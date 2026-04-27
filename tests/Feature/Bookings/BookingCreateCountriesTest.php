<?php

use App\Enums\Role;
use App\Models\Country;
use App\Models\User;

it('renders booking create page with countries for phone input', function () {
    Country::query()->create([
        'name' => 'United Arab Emirates',
        'iso2' => 'AE',
        'dial_code' => '+971',
    ]);

    $user = User::factory()->createOne([
        'role' => Role::Client,
        'hotel_id' => null,
    ]);

    $this->actingAs($user)
        ->get(route('bookings.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('bookings/create')
            ->has('countries', 1)
        );
});

