<?php

namespace App\Http\Controllers;

use App\Exports\GuestTemplateExport;
use App\Http\Requests\StoreGuestRequest;
use App\Http\Requests\UpdateGuestRequest;
use App\Imports\GuestsImport;
use App\Models\Country;
use App\Models\Guest;
use App\Services\ActivityLogFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GuestController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Guest::class);

        $q = $request->string('q')->trim()->toString();
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $perPage = $request->integer('per_page') ?: 15;
        $perPage = in_array($perPage, [15, 30, 50, 100], true) ? $perPage : 15;

        $allowedSorts = [
            'full_name' => 'full_name',
            'created_at' => 'created_at',
            'email' => 'email',
            'phone' => 'phone',
        ];
        $sort = array_key_exists($sort, $allowedSorts) ? $sort : 'full_name';

        $query = Guest::query()
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner->where('full_name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%");
                });
            })
            ->orderBy($allowedSorts[$sort], $dir);

        $guests = $query
            ->withCount('bookings')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('guests/index', [
            'guests' => $guests,
            'filters' => [
                'q' => $q,
                'sort' => $sort,
                'dir' => $dir,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Guest::class);

        return Inertia::render('guests/create', [
            'redirect_to_booking' => request()->boolean('redirect_to_booking'),
            'countries' => Country::query()->orderBy('name')->get(['id', 'name', 'iso2', 'dial_code']),
        ]);
    }

    public function store(StoreGuestRequest $request): RedirectResponse|JsonResponse
    {
        $this->authorize('create', Guest::class);

        $guest = Guest::query()->create([
            ...$request->validated(),
            'created_by_user_id' => $request->user()->id,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'guest' => $guest->only(['id', 'full_name', 'email', 'phone']),
                'message' => 'Guest created.',
            ], 201);
        }

        if ($request->boolean('redirect_to_booking')) {
            return redirect()
                ->route('bookings.create', ['guest_id' => $guest->id])
                ->with('success', 'Guest created.');
        }

        return redirect()->route('guests.index')->with('success', 'Guest created.');
    }

    public function show(Guest $guest, ActivityLogFormatter $activityLog): Response
    {
        $this->authorize('view', $guest);

        $bookings = $guest->bookings()
            ->with(['hotel:id,name', 'vessel:id,name', 'rank:id,name'])
            ->orderByDesc('check_in_date')
            ->get([
                'id', 'guest_id', 'hotel_id', 'vessel_id', 'rank_id',
                'status', 'check_in_date', 'check_out_date',
                'guest_check_in', 'guest_check_out',
                'room_number', 'single_or_twin', 'confirmation_number',
                'public_id',
            ]);

        return Inertia::render('guests/show', [
            'guest' => $guest
                ->loadCount('bookings')
                ->load('creator:id,name')
                ->only(['id', 'full_name', 'email', 'phone', 'notes', 'created_at', 'creator', 'bookings_count']),
            'bookings' => $bookings,
            ...$activityLog->format($guest),
        ]);
    }

    public function edit(Guest $guest): Response
    {
        $this->authorize('update', $guest);

        return Inertia::render('guests/edit', [
            'guest' => $guest->only(['id', 'full_name', 'email', 'phone', 'notes']),
            'countries' => Country::query()->orderBy('name')->get(['id', 'name', 'iso2', 'dial_code']),
        ]);
    }

    public function update(UpdateGuestRequest $request, Guest $guest): RedirectResponse
    {
        $guest->update($request->validated());

        return redirect()->route('guests.index')->with('success', 'Guest updated.');
    }

    public function destroy(Guest $guest): RedirectResponse
    {
        $this->authorize('delete', $guest);

        if ($guest->bookings()->exists()) {
            return redirect()
                ->route('guests.index')
                ->with('error', 'This guest is referenced by bookings and cannot be deleted.');
        }

        $guest->delete();

        return redirect()->route('guests.index')->with('success', 'Guest deleted.');
    }

    public function importTemplate(): BinaryFileResponse
    {
        $this->authorize('create', Guest::class);

        return Excel::download(new GuestTemplateExport, 'guests_import_template.xlsx');
    }

    public function importPreview(Request $request): JsonResponse
    {
        $this->authorize('create', Guest::class);

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:2048'],
        ]);

        try {
            $rows = Excel::toCollection(new GuestsImport, $request->file('file'));

            $existingNormalised = Guest::query()
                ->pluck('full_name')
                ->mapWithKeys(fn (string $n) => [strtolower($this->sanitizeName($n)) => true])
                ->all();
            $seenInFile = [];

            $previewRows = $rows->flatten(1)
                ->map(function ($row) use ($existingNormalised, &$seenInFile) {
                    $name = $this->sanitizeName((string) ($row['name'] ?? ''));
                    if ($name === '') {
                        return null;
                    }

                    $key = strtolower($name);
                    $isDuplicate = isset($existingNormalised[$key]) || isset($seenInFile[$key]);
                    $seenInFile[$key] = true;

                    return [
                        'name' => $name,
                        'email' => $this->sanitizeNullable((string) ($row['email'] ?? '')),
                        'phone' => $this->sanitizeNullable((string) ($row['phone'] ?? '')),
                        'isDuplicate' => $isDuplicate,
                    ];
                })
                ->filter()
                ->values();

            return response()->json(['rows' => $previewRows]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error reading file: '.$e->getMessage()], 422);
        }
    }

    public function import(Request $request): RedirectResponse
    {
        $this->authorize('create', Guest::class);

        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.name' => ['required', 'string', 'max:255'],
            'rows.*.email' => ['nullable', 'string', 'email', 'max:255'],
            'rows.*.phone' => ['nullable', 'string', 'max:50'],
        ]);

        $existingNames = Guest::query()
            ->pluck('full_name')
            ->mapWithKeys(fn (string $n) => [strtolower($this->sanitizeName($n)) => true])
            ->all();
        $existingEmails = Guest::query()
            ->whereNotNull('email')
            ->pluck('email')
            ->mapWithKeys(fn (string $e) => [strtolower(trim($e)) => true])
            ->all();
        $existingPhones = Guest::query()
            ->whereNotNull('phone')
            ->pluck('phone')
            ->mapWithKeys(fn (string $p) => [trim($p) => true])
            ->all();

        foreach ($validated['rows'] as $rawRow) {
            $name = $this->sanitizeName((string) $rawRow['name']);
            if ($name === '') {
                continue;
            }

            $nameKey = strtolower($name);
            if (isset($existingNames[$nameKey])) {
                continue;
            }

            $email = $this->sanitizeNullable((string) ($rawRow['email'] ?? ''));
            $emailKey = $email !== null ? strtolower($email) : null;
            if ($emailKey !== null && isset($existingEmails[$emailKey])) {
                $email = null;
                $emailKey = null;
            }

            $phone = $this->sanitizeNullable((string) ($rawRow['phone'] ?? ''));
            $phoneKey = $phone !== null ? $phone : null;
            if ($phoneKey !== null && isset($existingPhones[$phoneKey])) {
                $phone = null;
                $phoneKey = null;
            }

            Guest::query()->create([
                'full_name' => $name,
                'email' => $email,
                'phone' => $phone,
                'created_by_user_id' => $request->user()->id,
            ]);

            $existingNames[$nameKey] = true;
            if ($emailKey !== null) {
                $existingEmails[$emailKey] = true;
            }
            if ($phoneKey !== null) {
                $existingPhones[$phoneKey] = true;
            }
        }

        return redirect()->route('guests.index')->with('success', 'Guests imported successfully.');
    }

    private function sanitizeName(string $name): string
    {
        $name = trim($name);
        $name = str_replace("\xC2\xA0", ' ', $name);
        $name = (string) preg_replace('/\s+/', ' ', $name);

        return trim($name);
    }

    private function sanitizeNullable(string $value): ?string
    {
        $value = trim($value);

        return $value === '' ? null : $value;
    }
}
