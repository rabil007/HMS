<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Exports\BookingTemplateExport;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingImportHistory;
use App\Models\Client;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use App\Services\BookingImportParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BookingImportController extends Controller
{
    public function __construct(private BookingImportParser $parser) {}

    public function create(): Response
    {
        return Inertia::render('admin/bookings/import', [
            'lookups' => [
                'vessels' => Vessel::query()->orderBy('name')->get(['id', 'name']),
                'ranks' => Rank::query()->orderBy('name')->get(['id', 'name']),
                'hotels' => Hotel::query()->orderBy('name')->get(['id', 'name']),
                'clients' => Client::query()->orderBy('name')->get(['id', 'name']),
            ],
            'importHistories' => BookingImportHistory::query()
                ->with('user:id,name')
                ->latest('id')
                ->limit(20)
                ->get()
                ->map(fn (BookingImportHistory $history) => [
                    'id' => $history->id,
                    'created_at' => $history->created_at?->toISOString(),
                    'file_name' => $history->file_name,
                    'submitted_count' => $history->submitted_count,
                    'created_count' => $history->created_count,
                    'failed_count' => $history->failed_count,
                    'failed_rows' => collect($history->failed_rows ?? [])
                        ->map(function (array $failedRow): array {
                            $reason = (string) ($failedRow['reason'] ?? '');
                            $failedRow['reason'] = $this->shouldHumanizeReason($reason)
                                ? $this->humanizeFailureReason($reason)
                                : $reason;

                            return $failedRow;
                        })
                        ->values()
                        ->all(),
                    'user' => [
                        'id' => $history->user?->id,
                        'name' => $history->user?->name,
                    ],
                ]),
        ]);
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(new BookingTemplateExport, 'bookings_import_template.xlsx');
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls,txt', 'max:8192'],
        ]);

        try {
            $payload = $this->parser->parse($request->file('file'));
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error reading file: '.$e->getMessage()], 422);
        }

        if ($payload['rows'] === []) {
            return response()->json([
                'error' => 'No rows were found in this file. Make sure the first row contains headers like "Guest Name", "Vessel", "HOTEL", etc.',
            ], 422);
        }

        return response()->json($payload);
    }

    public function createMissingLookups(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vessels' => ['nullable', 'array'],
            'vessels.*' => ['string', 'max:255'],
            'ranks' => ['nullable', 'array'],
            'ranks.*' => ['string', 'max:255'],
            'hotels' => ['nullable', 'array'],
            'hotels.*' => ['string', 'max:255'],
        ]);

        $created = [
            'vessels' => 0,
            'ranks' => 0,
            'hotels' => 0,
        ];

        $created['vessels'] = $this->createMissingNames(
            Vessel::query()->pluck('name')->all(),
            $validated['vessels'] ?? [],
            fn (string $name) => Vessel::query()->create(['name' => $name])
        );

        $created['ranks'] = $this->createMissingNames(
            Rank::query()->pluck('name')->all(),
            $validated['ranks'] ?? [],
            fn (string $name) => Rank::query()->create(['name' => $name])
        );

        $created['hotels'] = $this->createMissingNames(
            Hotel::query()->pluck('name')->all(),
            $validated['hotels'] ?? [],
            fn (string $name) => Hotel::query()->create(['name' => $name])
        );

        return response()->json([
            'created' => $created,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $statusValues = array_column(BookingStatus::cases(), 'value');
        $this->normaliseRows($request);

        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'meta' => ['nullable', 'array'],
            'meta.file_name' => ['nullable', 'string', 'max:255'],
            'meta.client_id' => ['required', 'integer', Rule::exists('clients', 'id')],
            'rows.*.row_index' => ['required', 'integer'],
            'rows.*.guest_name' => ['required', 'string', 'max:255'],
            'rows.*.guest_phone' => ['nullable', 'string', 'max:50'],
            'rows.*.room_type' => ['required', 'string', 'max:50'],
            'rows.*.check_in_date' => ['required', 'date_format:Y-m-d'],
            'rows.*.check_out_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:rows.*.check_in_date'],
            'rows.*.check_in_time' => ['nullable', 'string', 'max:8'],
            'rows.*.check_out_time' => ['nullable', 'string', 'max:8'],
            'rows.*.vessel_id' => ['required', 'integer', Rule::exists('vessels', 'id')],
            'rows.*.rank_id' => ['nullable', 'integer', Rule::exists('ranks', 'id')],
            'rows.*.hotel_id' => ['nullable', 'integer', Rule::exists('hotels', 'id')],
            'rows.*.confirmation_number' => ['nullable', 'string', 'max:255'],
            'rows.*.remarks' => ['nullable', 'string'],
            'rows.*.status' => ['required', 'string', Rule::in($statusValues)],
        ]);

        $user = $request->user();
        $selectedClientId = data_get($validated, 'meta.client_id');
        $created = 0;
        $failed = [];
        $importHistory = BookingImportHistory::query()->create([
            'user_id' => $user->id,
            'file_name' => $request->input('meta.file_name'),
            'submitted_count' => count($validated['rows']),
            'created_count' => 0,
            'failed_count' => 0,
            'failed_rows' => [],
        ]);

        DB::transaction(function () use ($validated, $user, $selectedClientId, $importHistory, &$created, &$failed) {
            $seenConfirmations = [];
            $guestCacheByPhone = [];
            $guestCacheByName = [];

            foreach ($validated['rows'] as $row) {
                $confirmation = $this->normaliseConfirmationNumber($row['confirmation_number'] ?? null);
                if ($confirmation !== null) {
                    // Duplicate confirmation numbers are allowed during import.
                    // To preserve successful inserts under the DB unique index,
                    // keep only first-seen unique values and drop duplicates.
                    if (isset($seenConfirmations[$confirmation])) {
                        $confirmation = null;
                    } else {
                        $exists = Booking::query()
                            ->withTrashed()
                            ->where('confirmation_number', $confirmation)
                            ->exists();
                        if ($exists) {
                            $confirmation = null;
                        } else {
                            $seenConfirmations[$confirmation] = true;
                        }
                    }
                }

                try {
                    $guest = $this->resolveGuestForRow(
                        $row,
                        $user->id,
                        $guestCacheByPhone,
                        $guestCacheByName,
                    );

                    Booking::query()->create([
                        'hotel_id' => $row['hotel_id'] ?? null,
                        'user_id' => $user->id,
                        'guest_id' => $guest?->id,
                        'client_id' => $selectedClientId ?? ($user->client_id ?? null),
                        'public_id' => (string) Str::ulid(),
                        'status' => $row['status'],
                        'check_in_date' => $row['check_in_date'],
                        'check_out_date' => $row['check_out_date'] ?? null,
                        'actual_check_in_date' => $row['check_in_date'],
                        'actual_check_out_date' => $row['check_out_date'] ?? null,
                        'guest_check_in' => $this->combineDateTime($row['check_in_date'] ?? null, $row['check_in_time'] ?? null),
                        'guest_check_out' => $this->combineDateTime($row['check_out_date'] ?? null, $row['check_out_time'] ?? null),
                        'rank_id' => $row['rank_id'] ?? null,
                        'vessel_id' => $row['vessel_id'],
                        'single_or_twin' => $row['room_type'],
                        'confirmation_number' => $confirmation,
                        'remarks' => $row['remarks'] ?? null,
                        'import_source' => 'excel',
                        'booking_import_history_id' => $importHistory->id,
                    ]);
                    $created++;
                } catch (\Throwable $e) {
                    $failed[] = [
                        'row_index' => $row['row_index'],
                        'guest_name' => $row['guest_name'] ?? null,
                        'reason' => $this->humanizeFailureReason($e->getMessage()),
                    ];
                }
            }
        });

        $importHistory->update([
            'created_count' => $created,
            'failed_count' => count($failed),
            'failed_rows' => $failed,
        ]);

        return redirect()
            ->route('admin.bookings.import.create')
            ->with('success', $this->buildFlashMessage($created, count($failed)))
            ->with('import_failed_rows', $failed);
    }

    private function combineDateTime(?string $date, ?string $time): ?string
    {
        if ($date === null || $date === '') {
            return null;
        }

        $base = Carbon::parse($date)->startOfDay();

        if ($time !== null && $time !== '') {
            try {
                $parsed = Carbon::parse($time);
                $base->setTime($parsed->hour, $parsed->minute, $parsed->second);
            } catch (\Throwable) {
                // Fall back to start-of-day if the time is unparseable.
            }
        }

        return $base->toDateTimeString();
    }

    private function buildFlashMessage(int $created, int $failed): string
    {
        if ($created === 0 && $failed === 0) {
            return 'No bookings imported.';
        }

        $parts = [];
        $parts[] = $created === 1 ? '1 booking imported' : "{$created} bookings imported";
        if ($failed > 0) {
            $parts[] = $failed === 1 ? '1 row failed' : "{$failed} rows failed";
        }

        return implode(', ', $parts).'.';
    }

    private function normaliseRows(Request $request): void
    {
        $rows = $request->input('rows', []);
        if (! is_array($rows)) {
            return;
        }

        foreach ($rows as $index => $row) {
            if (! is_array($row)) {
                continue;
            }

            $checkInDate = $row['check_in_date'] ?? null;
            $checkOutDate = $row['check_out_date'] ?? null;
            if (! is_string($checkInDate) || ! is_string($checkOutDate) || $checkInDate === '' || $checkOutDate === '') {
                continue;
            }

            if ($checkOutDate < $checkInDate) {
                $rows[$index]['check_out_date'] = $checkInDate;
            }
        }

        $request->merge(['rows' => $rows]);
    }

    private function humanizeFailureReason(string $rawReason): string
    {
        $normalized = mb_strtolower($rawReason);

        if (str_contains($normalized, 'bookings_confirmation_number_unique') || str_contains($normalized, 'duplicate entry')) {
            return 'Duplicate confirmation number. Another booking already uses this confirmation number.';
        }

        if (str_contains($normalized, 'bookings_public_id_unique')) {
            return 'Duplicate booking reference generated. Please retry import.';
        }

        if (str_contains($normalized, 'cannot add or update a child row') || str_contains($normalized, 'foreign key constraint fails')) {
            return 'Related data (hotel, vessel, rank, or user) is missing or invalid.';
        }

        if (str_contains($normalized, 'data too long')) {
            return 'One of the fields is too long. Please shorten the value and try again.';
        }

        return 'Could not insert this row due to invalid or conflicting data.';
    }

    private function shouldHumanizeReason(string $reason): bool
    {
        $normalized = mb_strtolower($reason);

        return str_contains($normalized, 'sqlstate')
            || str_contains($normalized, 'integrity constraint violation')
            || str_contains($normalized, 'duplicate entry')
            || str_contains($normalized, 'foreign key constraint')
            || str_contains($normalized, 'data too long')
            || str_contains($normalized, 'insert into');
    }

    private function normaliseConfirmationNumber(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $normalized = trim($value);

        return $normalized === '' ? null : $normalized;
    }

    /**
     * @param  array<int,string>  $existingNames
     * @param  array<int,string>  $incomingNames
     */
    private function createMissingNames(array $existingNames, array $incomingNames, \Closure $create): int
    {
        $existing = [];
        foreach ($existingNames as $name) {
            $normalized = $this->normaliseName($name);
            if ($normalized !== '') {
                $existing[$normalized] = true;
            }
        }

        $created = 0;
        foreach ($incomingNames as $name) {
            $clean = $this->normaliseName($name);
            if ($clean === '' || isset($existing[$clean])) {
                continue;
            }

            $create($name);
            $existing[$clean] = true;
            $created++;
        }

        return $created;
    }

    private function normaliseName(string $value): string
    {
        $value = str_replace("\xC2\xA0", ' ', $value);
        $value = trim((string) preg_replace('/\s+/', ' ', $value));

        return mb_strtolower($value);
    }

    /**
     * Find an existing guest by phone, then by name, otherwise create a new one.
     * Phone matches are reused across the batch; name fallbacks are also cached
     * to avoid creating duplicates for repeated rows in the same import.
     *
     * @param  array<string, mixed>  $row
     * @param  array<string, Guest>  $guestCacheByPhone
     * @param  array<string, Guest>  $guestCacheByName
     */
    private function resolveGuestForRow(
        array $row,
        int $createdByUserId,
        array &$guestCacheByPhone,
        array &$guestCacheByName,
    ): Guest {
        $rawName = is_string($row['guest_name'] ?? null) ? trim($row['guest_name']) : '';
        $rawPhone = is_string($row['guest_phone'] ?? null) ? trim($row['guest_phone']) : '';

        if ($rawPhone !== '') {
            $phoneKey = $rawPhone;

            if (isset($guestCacheByPhone[$phoneKey])) {
                return $guestCacheByPhone[$phoneKey];
            }

            $existing = Guest::query()->where('phone', $phoneKey)->first();
            if ($existing !== null) {
                return $guestCacheByPhone[$phoneKey] = $existing;
            }

            $guest = Guest::query()->create([
                'full_name' => $rawName !== '' ? $rawName : 'Imported Guest',
                'phone' => $phoneKey,
                'created_by_user_id' => $createdByUserId,
            ]);

            return $guestCacheByPhone[$phoneKey] = $guest;
        }

        $nameKey = $this->normaliseName($rawName);
        if ($nameKey !== '' && isset($guestCacheByName[$nameKey])) {
            return $guestCacheByName[$nameKey];
        }

        $guest = Guest::query()->create([
            'full_name' => $rawName !== '' ? $rawName : 'Imported Guest',
            'created_by_user_id' => $createdByUserId,
        ]);

        if ($nameKey !== '') {
            $guestCacheByName[$nameKey] = $guest;
        }

        return $guest;
    }
}
