<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRankRequest;
use App\Http\Requests\UpdateRankRequest;
use App\Models\Rank;
use Inertia\Inertia;

class RankController extends Controller
{
    public function index()
    {
        $ranks = Rank::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('admin/ranks/index', [
            'ranks' => $ranks,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/ranks/create');
    }

    public function store(StoreRankRequest $request)
    {
        Rank::query()->create($request->validated());

        return redirect()->route('admin.ranks.index');
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

        return redirect()->route('admin.ranks.index');
    }

    public function destroy(Rank $rank)
    {
        $rank->delete();

        return redirect()->route('admin.ranks.index');
    }
}

