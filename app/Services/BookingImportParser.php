<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Imports\BookingsImport;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Parses a "Hotel Record" Excel/CSV upload into structured rows for the
 * booking import preview UI. Resolves Vessel/Rank/Hotel relations by name
 * (case-insensitive, whitespace-normalised) and surfaces validation
 * errors/warnings without writing to the database.
 *
 * @phpstan-type ParsedRow array{
 *     row_index: int,
 *     guest_name: string,
 *     guest_phone: ?string,
 *     room_type: ?string,
 *     check_in_date: ?string,
 *     check_in_time: ?string,
 *     check_out_date: ?string,
 *     check_out_time: ?string,
 *     is_open_checkout: bool,
 *     confirmation_number: ?string,
 *     remarks: ?string,
 *     vessel_id: ?int,
 *     vessel_name_raw: ?string,
 *     rank_id: ?int,
 *     rank_name_raw: ?string,
 *     hotel_id: ?int,
 *     hotel_name_raw: ?string,
 *     status: string,
 *     errors: array<int,string>,
 *     warnings: array<int,string>,
 * }
 */
class BookingImportParser
{
    /**
     * Parse the uploaded file into structured rows for preview.
     *
     * @return array{ rows: array<int,array<string,mixed>>, summary: array<string,int> }
     */
    public function parse(UploadedFile $file): array
    {
        $vessels = $this->buildLookup(Vessel::query()->pluck('name', 'id'));
        $ranks = $this->buildLookup(Rank::query()->pluck('name', 'id'));
        $hotels = $this->buildLookup(Hotel::query()->pluck('name', 'id'));

        $sheets = Excel::toCollection(new BookingsImport, $file);
        $rows = [];
        $rowIndex = 0;

        foreach ($sheets as $sheet) {
            foreach ($sheet as $raw) {
                $rowIndex++;
                $assoc = $this->normaliseRow($raw->toArray());

                if ($this->isEmptyRow($assoc)) {
                    continue;
                }

                $rows[] = $this->parseRow($rowIndex, $assoc, $vessels, $ranks, $hotels);
            }

            // Only the first sheet is used; the import is single-sheet.
            break;
        }

        return [
            'rows' => $rows,
            'summary' => $this->buildSummary($rows),
        ];
    }

    /**
     * @param  array<string,int>  $vessels
     * @param  array<string,int>  $ranks
     * @param  array<string,int>  $hotels
     * @return array<string,mixed>
     */
    private function parseRow(int $rowIndex, array $row, array $vessels, array $ranks, array $hotels): array
    {
        $errors = [];
        $warnings = [];

        $guestName = $this->sanitise($row['guest_name'] ?? null);
        if ($guestName === '') {
            $errors[] = 'missing_guest_name';
        }

        $guestPhone = $this->trimOrNull($row['mobile_no'] ?? null);

        $roomType = $this->sanitise($row['room_type'] ?? null);
        if ($roomType === '') {
            $errors[] = 'missing_room_type';
        }

        $checkInDate = $this->parseDate($row['check_in_date'] ?? null);
        if ($checkInDate === null) {
            $errors[] = 'missing_check_in';
        }

        $checkOutRaw = $row['check_out_date'] ?? null;
        $isOpen = $this->isOpenValue($checkOutRaw);
        $checkOutDate = $isOpen ? null : $this->parseDate($checkOutRaw);

        if ($checkInDate !== null && $checkOutDate !== null && $checkOutDate < $checkInDate) {
            // Keep import resilient for legacy sheets with swapped/earlier checkout dates.
            $checkOutDate = $checkInDate;
        }

        $checkInTime = $this->parseTime($row['check_in_time'] ?? null);
        $checkOutTime = $isOpen ? null : $this->parseTime($row['check_out_time'] ?? null);

        $vesselNameRaw = $this->trimOrNull($row['vessel'] ?? null);
        $vesselId = $this->lookupId($vesselNameRaw, $vessels);
        if ($vesselNameRaw === null || $vesselNameRaw === '') {
            $errors[] = 'missing_vessel';
        } elseif ($vesselId === null) {
            $errors[] = 'vessel_unmatched';
        }

        $rankNameRaw = $this->trimOrNull($row['rank'] ?? null);
        $rankId = $this->lookupId($rankNameRaw, $ranks);
        if ($rankNameRaw !== null && $rankNameRaw !== '' && $rankId === null) {
            $warnings[] = 'rank_unmatched';
        }

        $hotelNameRaw = $this->trimOrNull($row['hotel'] ?? null);
        $hotelId = $this->lookupId($hotelNameRaw, $hotels);

        $confirmationRaw = $this->trimOrNull($row['booking_confirmation'] ?? null);
        $isDenied = $this->isDeniedValue($confirmationRaw);
        $confirmationNumber = $isDenied ? null : $confirmationRaw;

        $remarksParts = array_filter([
            $this->trimOrNull($row['remarks'] ?? null),
            $this->trimOrNull($row['requests'] ?? null),
        ], fn ($v) => is_string($v) && $v !== '');
        $remarks = $remarksParts === [] ? null : implode(' | ', $remarksParts);

        $status = $this->resolveStatus($isDenied, $confirmationNumber);

        return [
            'row_index' => $rowIndex,
            'guest_name' => $guestName,
            'guest_phone' => $guestPhone,
            'room_type' => $roomType !== '' ? $roomType : null,
            'check_in_date' => $checkInDate,
            'check_in_time' => $checkInTime,
            'check_out_date' => $checkOutDate,
            'check_out_time' => $checkOutTime,
            'is_open_checkout' => $isOpen,
            'confirmation_number' => $confirmationNumber,
            'remarks' => $remarks,
            'vessel_id' => $vesselId,
            'vessel_name_raw' => $vesselNameRaw,
            'rank_id' => $rankId,
            'rank_name_raw' => $rankNameRaw,
            'hotel_id' => $hotelId,
            'hotel_name_raw' => $hotelNameRaw,
            'status' => $status,
            'errors' => array_values(array_unique($errors)),
            'warnings' => array_values(array_unique($warnings)),
        ];
    }

    /**
     * Map the raw row's keys to canonical snake_case keys we use in `parseRow`.
     *
     * @param  array<int|string,mixed>  $row
     * @return array<string,mixed>
     */
    private function normaliseRow(array $row): array
    {
        $aliases = [
            'guest_name' => ['guest_name', 'guest'],
            'mobile_no' => ['mobile_no', 'mobile_number', 'phone', 'mobile'],
            'rank' => ['rank'],
            'vessel' => ['vessel'],
            'room_type' => ['room_type', 'room_types'],
            'check_in_date' => ['check_in_date', 'checkin_date', 'check_in'],
            'check_in_time' => ['check_in_time', 'checkin_time'],
            'check_out_date' => ['check_out_date', 'checkout_date', 'check_out'],
            'check_out_time' => ['check_out_time', 'checkout_time'],
            'remarks' => ['remarks'],
            'requests' => ['requests'],
            'booking_confirmation' => ['booking_confirmation', 'booking_confirmation_no'],
            'hotel' => ['hotel'],
        ];

        $out = [];
        foreach ($aliases as $canonical => $candidates) {
            foreach ($candidates as $key) {
                if (array_key_exists($key, $row)) {
                    $out[$canonical] = $row[$key];

                    break;
                }
            }
        }

        return $out;
    }

    /**
     * @param  array<string,mixed>  $row
     */
    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if ($value === null) {
                continue;
            }

            if (is_string($value) && trim($value) === '') {
                continue;
            }

            return false;
        }

        return true;
    }

    /**
     * @param  iterable<int,string>  $names  id => name map
     * @return array<string,int>
     */
    private function buildLookup(iterable $names): array
    {
        $out = [];
        foreach ($names as $id => $name) {
            if (! is_string($name)) {
                continue;
            }
            $key = $this->normaliseKey($name);
            if ($key !== '' && ! isset($out[$key])) {
                $out[$key] = (int) $id;
            }
        }

        return $out;
    }

    /**
     * @param  array<string,int>  $lookup
     */
    private function lookupId(?string $rawName, array $lookup): ?int
    {
        if ($rawName === null) {
            return null;
        }
        $key = $this->normaliseKey($rawName);

        return $key === '' ? null : ($lookup[$key] ?? null);
    }

    private function normaliseKey(string $value): string
    {
        $value = str_replace("\xC2\xA0", ' ', $value);
        $value = preg_replace('/\s+/', ' ', trim($value)) ?? '';

        return mb_strtolower($value);
    }

    private function sanitise(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        if (! is_string($value)) {
            $value = (string) $value;
        }
        $value = str_replace("\xC2\xA0", ' ', $value);

        return trim((string) preg_replace('/\s+/', ' ', $value));
    }

    private function trimOrNull(mixed $value): ?string
    {
        $clean = $this->sanitise($value);

        return $clean === '' ? null : $clean;
    }

    private function isOpenValue(mixed $value): bool
    {
        if ($value === null) {
            return false;
        }

        return is_string($value) && mb_strtolower(trim($value)) === 'open';
    }

    private function isDeniedValue(?string $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }

        return in_array(mb_strtolower($value), ['denied', 'cancelled', 'canceled', 'rejected'], true);
    }

    private function parseDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance(Carbon::parse($value))->format('Y-m-d');
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '' || mb_strtolower($trimmed) === 'open') {
                return null;
            }

            try {
                return Carbon::parse($trimmed)->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        }

        return null;
    }

    private function parseTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $fraction = (float) $value - floor((float) $value);
            $seconds = (int) round($fraction * 86400);
            $h = intdiv($seconds, 3600);
            $m = intdiv($seconds % 3600, 60);
            $s = $seconds % 60;

            return sprintf('%02d:%02d:%02d', $h, $m, $s);
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return null;
            }

            try {
                return Carbon::parse($trimmed)->format('H:i:s');
            } catch (\Throwable) {
                return null;
            }
        }

        return null;
    }

    private function resolveStatus(bool $isDenied, ?string $confirmation): string
    {
        if ($isDenied) {
            return BookingStatus::Rejected->value;
        }

        if ($confirmation !== null && $confirmation !== '') {
            return BookingStatus::Confirmed->value;
        }

        return BookingStatus::Pending->value;
    }

    /**
     * @param  array<int,array<string,mixed>>  $rows
     * @return array<string,int>
     */
    private function buildSummary(array $rows): array
    {
        $importable = 0;
        $issues = 0;
        foreach ($rows as $row) {
            if (empty($row['errors'])) {
                $importable++;
            } else {
                $issues++;
            }
        }

        return [
            'total' => count($rows),
            'importable' => $importable,
            'issues' => $issues,
        ];
    }
}
