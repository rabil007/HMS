<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVesselRequest;
use App\Http\Requests\UpdateVesselRequest;
use App\Models\Vessel;
use Inertia\Inertia;

class VesselController extends Controller
{
    public function index()
    {
        $vessels = Vessel::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('admin/vessels/index', [
            'vessels' => $vessels,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/vessels/create');
    }

    public function store(StoreVesselRequest $request)
    {
        Vessel::query()->create($request->validated());

        return redirect()->route('admin.vessels.index');
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

        return redirect()->route('admin.vessels.index');
    }

    public function destroy(Vessel $vessel)
    {
        $vessel->delete();

        return redirect()->route('admin.vessels.index');
    }
}

