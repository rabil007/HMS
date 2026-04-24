<?php

use App\Models\User;
use App\Models\Vessel;

it('lists vessels with pagination and supports search and per-page', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 20) as $i) {
        Vessel::query()->create(['name' => "Vessel {$i}"]);
    }

    Vessel::query()->create(['name' => 'Needle Vessel']);

    $response = $this->actingAs($admin)->get(route('admin.vessels.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/vessels/index')
        ->has('vessels.data', 15)
        ->where('filters.per_page', 15)
    );

    $response = $this->actingAs($admin)->get(route('admin.vessels.index', ['q' => 'Needle']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/vessels/index')
        ->has('vessels.data', 1)
        ->where('vessels.data.0.name', 'Needle Vessel')
    );

    $response = $this->actingAs($admin)->get(route('admin.vessels.index', ['per_page' => 30]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/vessels/index')
        ->has('vessels.data', 21)
        ->where('filters.per_page', 30)
    );
});

