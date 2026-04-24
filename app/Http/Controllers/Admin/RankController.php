<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRankRequest;
use App\Http\Requests\UpdateRankRequest;
use App\Models\Rank;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RankController extends Controller
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

        $query = Rank::query()
            ->when($q !== '', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->orderBy($allowedSorts[$sort] ?? 'name', $dir);

        $ranks = $query
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/ranks/index', [
            'ranks' => $ranks,
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
        return Inertia::render('admin/ranks/create');
    }

    public function show(Rank $rank)
    {
        return Inertia::render('admin/ranks/show', [
            'rank' => $rank->loadCount(['bookings'])->only(['id', 'name', 'created_at', 'bookings_count']),
            'activities' => $rank->activities()
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

    public function store(StoreRankRequest $request)
    {
        Rank::query()->create($request->validated());

        return redirect()->route('admin.ranks.index')->with('success', 'Rank created.');
    }

    public function edit(Rank $rank)
    {
        return Inertia::render('admin/ranks/edit', [
            'rank' => $rank->only(['id', 'name']),
        ]);
    }

    public function update(UpdateRankRequest $request, Rank $rank)
    {
        $rank->update($request->validated());

        return redirect()->route('admin.ranks.index')->with('success', 'Rank updated.');
    }

    public function destroy(Rank $rank)
    {
        $rank->delete();

        return redirect()->route('admin.ranks.index')->with('success', 'Rank deleted.');
    }
}
