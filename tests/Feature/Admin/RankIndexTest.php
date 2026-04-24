<?php

use App\Models\Rank;
use App\Models\User;

it('lists ranks with pagination and supports search and per-page', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 20) as $i) {
        Rank::query()->create(['name' => "Rank {$i}"]);
    }

    Rank::query()->create(['name' => 'Captain']);

    $response = $this->actingAs($admin)->get(route('admin.ranks.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/ranks/index')
        ->has('ranks.data', 15)
        ->where('filters.per_page', 15)
    );

    $response = $this->actingAs($admin)->get(route('admin.ranks.index', ['q' => 'Captain']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/ranks/index')
        ->has('ranks.data', 1)
        ->where('ranks.data.0.name', 'Captain')
    );

    $response = $this->actingAs($admin)->get(route('admin.ranks.index', ['per_page' => 30]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/ranks/index')
        ->has('ranks.data', 21)
        ->where('filters.per_page', 30)
    );
});

