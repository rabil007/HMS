<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVesselRequest;
use App\Http\Requests\UpdateVesselRequest;
use App\Models\User;
use App\Models\Vessel;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
}
