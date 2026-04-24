<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVesselRequest;
use App\Http\Requests\UpdateVesselRequest;
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

        $query = Vessel::query()
            ->when($q !== '', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->orderBy($allowedSorts[$sort] ?? 'name', $dir);

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
        return Inertia::render('admin/vessels/show', [
            'vessel' => $vessel->loadCount(['bookings'])->only(['id', 'name', 'created_at', 'bookings_count']),
            'activities' => $vessel->activities()
                ->with('causer')
                ->latest()
                ->get()
                ->map(function ($a) {
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
