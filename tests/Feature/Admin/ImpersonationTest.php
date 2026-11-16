<?php

use App\Enums\Role;
use App\Models\Hotel;
use App\Models\User;

it('lets an admin log in as a client user and return to admin', function () {
    $admin = User::factory()->admin()->create();
    $client = User::factory()->create(['role' => Role::Client->value]);

    $this->actingAs($admin)
        ->post(route('admin.users.impersonate', $client))
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($client);
    expect(session('impersonator_id'))->toBe($admin->id);

    $this->get(route('bookings.index'))->assertOk();
    $this->get(route('dashboard'))->assertInertia(fn ($page) => $page->where('auth.impersonating', true));

    $this->post(route('impersonation.leave'))
        ->assertRedirect(route('admin.users.index'));

    $this->assertAuthenticatedAs($admin);
    expect(session()->has('impersonator_id'))->toBeFalse();
});

it('lets an admin open the hotel portal as a hotel user', function () {
    $admin = User::factory()->admin()->create();
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::factory()->create(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id]);

    $this->actingAs($admin)->post(route('admin.users.impersonate', $hotelUser));

    $this->assertAuthenticatedAs($hotelUser);
    $this->get(route('hotel.bookings.index'))->assertOk();
});

it('refuses to impersonate admins or hotel users without a hotel', function () {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();
    $unassigned = User::factory()->create(['role' => Role::Hotel->value, 'hotel_id' => null]);

    $this->actingAs($admin)->post(route('admin.users.impersonate', $otherAdmin))->assertSessionHas('error');
    $this->assertAuthenticatedAs($admin);

    $this->actingAs($admin)->post(route('admin.users.impersonate', $unassigned))->assertSessionHas('error');
    $this->assertAuthenticatedAs($admin);
});

it('does not let non-admins impersonate', function () {
    $client = User::factory()->create(['role' => Role::Client->value]);
    $other = User::factory()->create(['role' => Role::Client->value]);

    $this->actingAs($client)->post(route('admin.users.impersonate', $other))->assertForbidden();
    $this->assertAuthenticatedAs($client);
});

it('ignores return to admin when not impersonating', function () {
    $client = User::factory()->create(['role' => Role::Client->value]);

    $this->actingAs($client)->post(route('impersonation.leave'))->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($client);
});
