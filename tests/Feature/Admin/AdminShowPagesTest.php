<?php

use App\Enums\Role;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Country;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\User;
use App\Models\Vessel;
use Illuminate\Support\Str;

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

it('exposes activities and activityLookups on all show pages', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    $hotel = Hotel::query()->create(['name' => 'Hotel 1']);
    $client = Client::query()->create(['name' => 'Client 1']);
    $country = Country::query()->create(['name' => 'United Arab Emirates', 'iso2' => 'AE', 'dial_code' => '+971']);
    $rank = Rank::query()->create(['name' => 'Rank 1']);
    $vessel = Vessel::query()->create(['name' => 'Vessel 1']);
    $hotelUser = User::factory()->createOne([
        'role' => Role::Hotel->value,
        'hotel_id' => $hotel->id,
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $hotelUser->id,
        'client_id' => $client->id,
        'rank_id' => $rank->id,
        'vessel_id' => $vessel->id,
        'public_id' => (string) Str::ulid(),
        'status' => 'pending',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => now()->addDay()->toDateString(),
        'guest_name' => 'Guest One',
        'guest_email' => 'guest@example.com',
        'guest_phone' => '+971501234567',
        'single_or_twin' => 'single',
    ]);

    // Trigger at least one update activity per subject.
    $hotel->update(['name' => 'Hotel 1 Updated']);
    $client->update(['name' => 'Client 1 Updated']);
    $country->update(['dial_code' => '+9711']);
    $rank->update(['name' => 'Rank 1 Updated']);
    $vessel->update(['name' => 'Vessel 1 Updated']);
    $hotelUser->update(['name' => 'Hotel User Updated']);
    $booking->update(['remarks' => 'updated in test']);

    $this->actingAs($admin)
        ->get(route('admin.ranks.show', $rank))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ranks/show')
            ->has('activities')
            ->has('activityLookups.users')
        );

    $this->actingAs($admin)
        ->get(route('admin.vessels.show', $vessel))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/vessels/show')
            ->has('activities')
            ->has('activityLookups.users')
        );

    $this->actingAs($admin)
        ->get(route('admin.hotels.show', $hotel))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/hotels/show')
            ->has('activities')
            ->has('activityLookups.users')
        );

    $this->actingAs($admin)
        ->get(route('admin.clients.show', $client))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/clients/show')
            ->has('activities')
            ->has('activityLookups.users')
        );

    $this->actingAs($admin)
        ->get(route('admin.users.show', $hotelUser))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/show')
            ->has('activities')
            ->has('activityLookups.users')
        );

    $this->actingAs($admin)
        ->get(route('admin.countries.show', $country))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/countries/show')
            ->has('activities')
            ->has('activityLookups.users')
        );

    $this->actingAs($admin)
        ->get(route('bookings.show', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('bookings/show')
            ->has('activities')
            ->has('activityLookups.users')
            ->has('activityLookups.hotels')
            ->has('activityLookups.clients')
            ->has('activityLookups.ranks')
            ->has('activityLookups.vessels')
        );
});
