<?php

use App\Models\Country;
use App\Models\User;

it('lists countries with pagination and supports search and per-page', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 20) as $i) {
        Country::query()->create([
            'name' => "Country {$i}",
            'iso2' => str_pad((string) $i, 2, '0', STR_PAD_LEFT),
            'dial_code' => '+1',
        ]);
    }

    Country::query()->create(['name' => 'United Arab Emirates', 'iso2' => 'AE', 'dial_code' => '+971']);

    $response = $this->actingAs($admin)->get(route('admin.countries.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/countries/index')
        ->has('countries.data', 15)
        ->where('filters.per_page', 15)
    );

    $response = $this->actingAs($admin)->get(route('admin.countries.index', ['q' => 'AE']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/countries/index')
        ->has('countries.data', 1)
        ->where('countries.data.0.iso2', 'AE')
    );

    $response = $this->actingAs($admin)->get(route('admin.countries.index', ['per_page' => 30]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/countries/index')
        ->has('countries.data', 21)
        ->where('filters.per_page', 30)
    );
});
