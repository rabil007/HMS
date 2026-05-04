<?php

namespace App\Http\Controllers\Admin;

use App\Exports\VesselTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVesselRequest;
use App\Http\Requests\UpdateVesselRequest;
use App\Imports\VesselsImport;
use App\Models\User;
use App\Models\Vessel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class VesselController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->trim()->toString();
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $perPage = $request->integer('per_page') ?: 15;
        $perPage = in_array($perPage, [15, 30, 50, 100], true) ? $perPage : 15;

        $allowedSorts = [
            'name' => 'name',
            'created_at' => 'created_at',
        ];
        $sort = array_key_exists($sort, $allowedSorts) ? $sort : 'name';

        $query = Vessel::query()
            ->when($q !== '', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->orderBy($allowedSorts[$sort], $dir);

        $vessels = $query
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/vessels/index', [
            'vessels' => $vessels,
            'filters' => [
                'q' => $q,
                'sort' => $sort,
                'dir' => $dir,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/vessels/create');
    }

    public function show(Vessel $vessel)
    {
        $activitiesRaw = $vessel->activities()
            ->with('causer')
            ->latest()
            ->get();

        $userIds = $activitiesRaw
            ->flatMap(function ($a) {
                $changes = $a->attribute_changes?->toArray() ?? [];
                if (! isset($changes['old']) && ! isset($changes['attributes'])) {
                    $changes = [
                        'old' => $a->properties['old'] ?? null,
                        'attributes' => $a->properties['attributes'] ?? null,
                    ];
                }

                $attrs = is_array($changes['attributes'] ?? null) ? $changes['attributes'] : [];
                $old = is_array($changes['old'] ?? null) ? $changes['old'] : [];

                return collect([$attrs, $old])
                    ->flatMap(fn (array $arr) => collect($arr)->filter(fn ($v, $k) => $k === 'user_id' || str_ends_with((string) $k, '_user_id'))->values());
            })
            ->filter(fn ($v) => is_numeric($v))
            ->map(fn ($v) => (int) $v)
            ->unique()
            ->values();

        return Inertia::render('admin/vessels/show', [
            'vessel' => $vessel->loadCount(['bookings'])->only(['id', 'name', 'created_at', 'bookings_count']),
            'activities' => $activitiesRaw->map(function ($a) {
                $changes = $a->attribute_changes?->toArray() ?? [];
                if (! isset($changes['old']) && ! isset($changes['attributes'])) {
                    $changes = [
                        'old' => $a->properties['old'] ?? null,
                        'attributes' => $a->properties['attributes'] ?? null,
                    ];
                }

                return [
                    'id' => $a->id,
                    'event' => $a->event,
                    'description' => $a->description,
                    'causer' => $a->causer?->name,
                    'changes' => [
                        'old' => $changes['old'] ?? null,
                        'attributes' => $changes['attributes'] ?? null,
                    ],
                    'created_at' => $a->created_at->toISOString(),
                ];
            }),
            'activityLookups' => [
                'users' => User::query()->whereIn('id', $userIds)->pluck('name', 'id'),
            ],
        ]);
    }

    public function store(StoreVesselRequest $request)
    {
        Vessel::query()->create($request->validated());

        return redirect()->route('admin.vessels.index')->with('success', 'Vessel created.');
    }

    public function edit(Vessel $vessel)
    {
        return Inertia::render('admin/vessels/edit', [
            'vessel' => $vessel->only(['id', 'name']),
        ]);
    }

    public function update(UpdateVesselRequest $request, Vessel $vessel)
    {
        $vessel->update($request->validated());

        return redirect()->route('admin.vessels.index')->with('success', 'Vessel updated.');
    }

    public function destroy(Vessel $vessel)
    {
        $vessel->delete();

        return redirect()->route('admin.vessels.index')->with('success', 'Vessel deleted.');
    }

    public function importTemplate(): BinaryFileResponse
    {
        return Excel::download(new VesselTemplateExport, 'vessels_import_template.xlsx');
    }

    /**
     * Parse the uploaded file and return the rows as JSON for preview.
     * No data is written to the database at this stage.
     */
    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:2048'],
        ]);

        try {
            $rows = Excel::toCollection(new VesselsImport, $request->file('file'));

            // Sanitize all names from the sheet
            $names = $rows->flatten(1)
                ->map(function ($row) {
                    $name = $row['name'] ?? null;
                    if (empty($name)) {
                        return null;
                    }

                    $name = trim($name);
                    $name = str_replace("\xC2\xA0", ' ', $name);
                    $name = preg_replace('/\s+/', ' ', $name);

                    return empty($name) ? null : $name;
                })
                ->filter()
                ->values();

            // Find which names already exist in the DB (case-insensitive)
            $existingNames = Vessel::query()
                ->whereIn('name', $names)
                ->pluck('name')
                ->map(fn (string $n) => strtolower($n))
                ->all();

            $previewRows = $names->map(fn (string $name) => [
                'name' => $name,
                'isDuplicate' => in_array(strtolower($name), $existingNames, true),
            ])->values();

            return response()->json(['rows' => $previewRows]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error reading file: '.$e->getMessage()], 422);
        }
    }

    /**
     * Import a user-confirmed list of vessel names into the database.
     *
     * @return RedirectResponse
     */
    public function import(Request $request)
    {
        $request->validate([
            'names' => ['required', 'array', 'min:1'],
            'names.*' => ['required', 'string', 'max:255'],
        ]);

        foreach ($request->names as $name) {
            $name = trim($name);
            $name = str_replace("\xC2\xA0", ' ', $name);
            $name = preg_replace('/\s+/', ' ', $name);

            if (empty($name)) {
                continue;
            }

            Vessel::firstOrCreate(['name' => $name]);
        }

        return redirect()->route('admin.vessels.index')->with('success', 'Vessels imported successfully.');
    }
}
