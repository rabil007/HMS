<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Exports\BookingTemplateExport;
use App\Http\Controllers\Controller;
use App\Models\Booking;
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
            ],
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

    public function store(Request $request): RedirectResponse
    {
        $statusValues = array_column(BookingStatus::cases(), 'value');
        $this->normaliseRows($request);

        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
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
        $created = 0;
        $failed = [];

        DB::transaction(function () use ($validated, $user, &$created, &$failed) {
            foreach ($validated['rows'] as $row) {
                try {
                    Booking::query()->create([
                        'hotel_id' => $row['hotel_id'] ?? null,
                        'user_id' => $user->id,
                        'client_id' => $user->client_id ?? null,
                        'public_id' => (string) Str::ulid(),
                        'status' => $row['status'],
                        'check_in_date' => $row['check_in_date'],
                        'check_out_date' => $row['check_out_date'] ?? null,
                        'actual_check_in_date' => $row['check_in_date'],
                        'actual_check_out_date' => $row['check_out_date'] ?? null,
                        'guest_check_in' => $this->combineDateTime($row['check_in_date'] ?? null, $row['check_in_time'] ?? null),
                        'guest_check_out' => $this->combineDateTime($row['check_out_date'] ?? null, $row['check_out_time'] ?? null),
                        'guest_name' => $row['guest_name'],
                        'guest_phone' => $row['guest_phone'] ?? null,
                        'rank_id' => $row['rank_id'] ?? null,
                        'vessel_id' => $row['vessel_id'],
                        'single_or_twin' => $row['room_type'],
                        'confirmation_number' => $row['confirmation_number'] ?? null,
                        'remarks' => $row['remarks'] ?? null,
                    ]);
                    $created++;
                } catch (\Throwable $e) {
                    $failed[] = [
                        'row_index' => $row['row_index'],
                        'reason' => $e->getMessage(),
                    ];
                }
            }
        });

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
}
