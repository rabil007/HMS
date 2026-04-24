<?php

use App\Models\Hotel;
use App\Models\User;

it('lists hotels with pagination and supports search and per-page', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 20) as $i) {
        Hotel::query()->create(['name' => "Hotel {$i}"]);
    }

    Hotel::query()->create(['name' => 'Needle Hotel']);

    $response = $this->actingAs($admin)->get(route('admin.hotels.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/hotels/index')
        ->has('hotels.data', 15)
        ->where('filters.per_page', 15)
    );

    $response = $this->actingAs($admin)->get(route('admin.hotels.index', ['q' => 'Needle']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/hotels/index')
        ->has('hotels.data', 1)
        ->where('hotels.data.0.name', 'Needle Hotel')
    );

    $response = $this->actingAs($admin)->get(route('admin.hotels.index', ['per_page' => 30]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/hotels/index')
        ->has('hotels.data', 21)
        ->where('filters.per_page', 30)
    );
});
