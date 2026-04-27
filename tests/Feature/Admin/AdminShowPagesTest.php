<?php

use App\Enums\Role;
use App\Models\Client;
use App\Models\Country;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\User;
use App\Models\Vessel;

it('renders admin show pages', function () {
    $admin = User::factory()->create(['role' => Role::Admin->value]);

    $rank = Rank::query()->create(['name' => 'Rank 1']);
    $vessel = Vessel::query()->create(['name' => 'Vessel 1']);
    $hotel = Hotel::query()->create(['name' => 'Hotel 1']);
    $client = Client::query()->create(['name' => 'Client 1']);
    $country = Country::query()->create(['name' => 'United Arab Emirates', 'iso2' => 'AE', 'dial_code' => '+971']);
    $user = User::factory()->create([
        'role' => Role::Hotel->value,
        'hotel_id' => $hotel->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.ranks.show', $rank))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/ranks/show'));

    $this->actingAs($admin)
        ->get(route('admin.vessels.show', $vessel))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/vessels/show'));

    $this->actingAs($admin)
        ->get(route('admin.hotels.show', $hotel))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/hotels/show'));

    $this->actingAs($admin)
        ->get(route('admin.clients.show', $client))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/clients/show'));

    $this->actingAs($admin)
        ->get(route('admin.users.show', $user))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/users/show'));

    $this->actingAs($admin)
        ->get(route('admin.countries.show', $country))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/countries/show'));
});
