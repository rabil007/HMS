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

        return Inertia::render('guests/show', [
            'guest' => $guest
                ->loadCount('bookings')
                ->load('creator:id,name')
                ->only(['id', 'full_name', 'email', 'phone', 'notes', 'created_at', 'creator', 'bookings_count']),
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

            $names = $rows->flatten(1)
                ->map(function ($row) {
                    $name = $row['name'] ?? null;

                    return empty($name) ? null : $this->sanitizeName((string) $name);
                })
                ->filter()
                ->values();

            $existingNormalised = Guest::query()
                ->pluck('full_name')
                ->mapWithKeys(fn (string $n) => [strtolower($this->sanitizeName($n)) => true])
                ->all();

            $previewRows = $names->map(fn (string $name) => [
                'name' => $name,
                'isDuplicate' => isset($existingNormalised[strtolower($name)]),
            ])->values();

            return response()->json(['rows' => $previewRows]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error reading file: '.$e->getMessage()], 422);
        }
    }

    public function import(Request $request): RedirectResponse
    {
        $this->authorize('create', Guest::class);

        $request->validate([
            'names' => ['required', 'array', 'min:1'],
            'names.*' => ['required', 'string', 'max:255'],
        ]);

        $existingNormalised = Guest::query()
            ->pluck('full_name')
            ->mapWithKeys(fn (string $n) => [strtolower($this->sanitizeName($n)) => true])
            ->all();

        foreach ($request->names as $rawName) {
            $name = $this->sanitizeName((string) $rawName);
            if ($name === '') {
                continue;
            }

            $key = strtolower($name);
            if (! isset($existingNormalised[$key])) {
                Guest::query()->create([
                    'full_name' => $name,
                    'created_by_user_id' => $request->user()->id,
                ]);
                $existingNormalised[$key] = true;
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
}
