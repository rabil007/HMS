<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHotelRequest;
use App\Http\Requests\UpdateHotelRequest;
use App\Models\Hotel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HotelController extends Controller
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

        $query = Hotel::query()
            ->when($q !== '', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->orderBy($allowedSorts[$sort] ?? 'name', $dir);

        $hotels = $query
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/hotels/index', [
            'hotels' => $hotels,
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
        return Inertia::render('admin/hotels/create');
    }

    public function show(Hotel $hotel)
    {
        return Inertia::render('admin/hotels/show', [
            'hotel' => $hotel->loadCount(['users', 'bookings'])->only(['id', 'name', 'created_at', 'users_count', 'bookings_count']),
            'activities' => $hotel->activities()
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

    public function store(StoreHotelRequest $request)
    {
        Hotel::query()->create($request->validated());

        return redirect()->route('admin.hotels.index')->with('success', 'Hotel created.');
    }

    public function edit(Hotel $hotel)
    {
        return Inertia::render('admin/hotels/edit', [
            'hotel' => $hotel->only(['id', 'name']),
        ]);
    }

    public function update(UpdateHotelRequest $request, Hotel $hotel)
    {
        $hotel->update($request->validated());

        return redirect()->route('admin.hotels.index')->with('success', 'Hotel updated.');
    }

    public function destroy(Hotel $hotel)
    {
        $hotel->delete();

        return redirect()->route('admin.hotels.index')->with('success', 'Hotel deleted.');
    }
}
