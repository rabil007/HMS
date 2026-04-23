<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHotelRequest;
use App\Http\Requests\UpdateHotelRequest;
use App\Models\Hotel;
use Inertia\Inertia;

class HotelController extends Controller
{
    public function index()
    {
        $hotels = Hotel::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('admin/hotels/index', [
            'hotels' => $hotels,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/hotels/create');
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

