<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCountryRequest;
use App\Http\Requests\UpdateCountryRequest;
use App\Models\Country;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CountryController extends Controller
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
            'iso2' => 'iso2',
            'dial_code' => 'dial_code',
            'created_at' => 'created_at',
        ];

        $query = Country::query()
            ->when($q !== '', function (Builder $query) use ($q) {
                $query->where(function (Builder $inner) use ($q) {
                    $inner
                        ->where('name', 'like', "%{$q}%")
                        ->orWhere('iso2', 'like', "%{$q}%")
                        ->orWhere('dial_code', 'like', "%{$q}%");
                });
            })
            ->orderBy($allowedSorts[$sort] ?? 'name', $dir);

        $countries = $query
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/countries/index', [
            'countries' => $countries,
            'filters' => [
                'q' => $q,
                'sort' => $sort,
                'dir' => $dir,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('admin/countries/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCountryRequest $request)
    {
        Country::query()->create([
            'name' => $request->validated('name'),
            'iso2' => strtoupper($request->validated('iso2')),
            'dial_code' => $request->validated('dial_code'),
        ]);

        return redirect()->route('admin.countries.index')->with('success', 'Country created.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Country $country)
    {
        return Inertia::render('admin/countries/show', [
            'country' => $country->only(['id', 'name', 'iso2', 'dial_code', 'created_at']),
            'activities' => $country->activities()
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

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Country $country)
    {
        return Inertia::render('admin/countries/edit', [
            'country' => $country->only(['id', 'name', 'iso2', 'dial_code']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCountryRequest $request, Country $country)
    {
        $country->update([
            'name' => $request->validated('name'),
            'iso2' => strtoupper($request->validated('iso2')),
            'dial_code' => $request->validated('dial_code'),
        ]);

        return redirect()->route('admin.countries.index')->with('success', 'Country updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Country $country)
    {
        $country->delete();

        return redirect()->route('admin.countries.index')->with('success', 'Country deleted.');
    }
}
