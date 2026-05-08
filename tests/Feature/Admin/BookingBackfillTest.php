<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\User;
use App\Models\Vessel;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can access backfill booking form', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    $response = $this->actingAs($admin)
        ->get(route('admin.bookings.backfill.create'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/bookings/backfill')
            ->has('guests')
            ->has('hotels')
            ->has('clients')
            ->has('vessels')
            ->has('ranks')
            ->has('countries')
        );
});

test('non-admin cannot access backfill booking form', function () {
    $client = User::factory()->createOne(['role' => Role::Client->value]);

    $this->actingAs($client)
        ->get(route('admin.bookings.backfill.create'))
        ->assertForbidden();
});

test('admin can backfill historical booking with all required fields', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $guest = Guest::query()->create(['full_name' => 'Historical Guest', 'email' => 'historical@example.com']);
    $hotel = Hotel::query()->create(['name' => 'Test Hotel']);
    $client = Client::query()->create(['name' => 'Test Client']);
    $vessel = Vessel::query()->create(['name' => 'MV Test']);
    $rank = Rank::query()->create(['name' => 'Captain']);

    expect(Booking::query()->count())->toBe(0);

    $response = $this->actingAs($admin)
        ->post(route('admin.bookings.backfill.store'), [
            'guest_id' => $guest->id,
            'hotel_id' => $hotel->id,
            'client_id' => $client->id,
            'vessel_id' => $vessel->id,
            'rank_id' => $rank->id,
            'guest_check_in' => '2025-12-10 14:00:00',
            'guest_check_out' => '2025-12-15 11:00:00',
            'room_number' => '301',
            'single_or_twin' => 'single',
            'confirmation_number' => 'BACKFILL123',
        ]);

    expect(Booking::query()->count())->toBe(1);

    $booking = Booking::query()->first();

    expect($booking)
        ->guest_id->toBe($guest->id)
        ->hotel_id->toBe($hotel->id)
        ->client_id->toBe($client->id)
        ->vessel_id->toBe($vessel->id)
        ->rank_id->toBe($rank->id)
        ->check_in_date->toDateString()->toBe('2025-12-10')
        ->check_out_date->toDateString()->toBe('2025-12-15')
        ->actual_check_in_date->toDateString()->toBe('2025-12-10')
        ->actual_check_out_date->toDateString()->toBe('2025-12-15')
        ->guest_check_in->toDateTimeString()->toBe('2025-12-10 14:00:00')
        ->guest_check_out->toDateTimeString()->toBe('2025-12-15 11:00:00')
        ->room_number->toBe('301')
        ->single_or_twin->toBe('single')
        ->confirmation_number->toBe('BACKFILL123')
        ->status->toBe(BookingStatus::Confirmed)
        ->user_id->toBe($admin->id);

    $response->assertRedirect(route('bookings.show', $booking));
});

test('backfill booking requires all mandatory fields', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    $this->actingAs($admin)
        ->post(route('admin.bookings.backfill.store'), [])
        ->assertSessionHasErrors([
            'guest_id',
            'client_id',
            'vessel_id',
            'guest_check_in',
            'single_or_twin',
        ]);

    expect(Booking::query()->count())->toBe(0);
});

test('backfill booking validates date logic', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $guest = Guest::query()->create(['full_name' => 'Test Guest']);
    $hotel = Hotel::query()->create(['name' => 'Test Hotel']);
    $client = Client::query()->create(['name' => 'Test Client']);
    $vessel = Vessel::query()->create(['name' => 'MV Test']);

    // Check-out before check-in
    $this->actingAs($admin)
        ->post(route('admin.bookings.backfill.store'), [
            'guest_id' => $guest->id,
            'hotel_id' => $hotel->id,
            'client_id' => $client->id,
            'vessel_id' => $vessel->id,
            // guest check-out before guest check-in should fail
            'guest_check_in' => '2025-12-10 14:00:00',
            'guest_check_out' => '2025-12-10 11:00:00',
            'room_number' => '301',
            'single_or_twin' => 'single',
        ])
        ->assertSessionHasErrors(['guest_check_out']);

    expect(Booking::query()->count())->toBe(0);
});

test('backfill booking creates activity log', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $guest = Guest::query()->create(['full_name' => 'Test Guest']);
    $hotel = Hotel::query()->create(['name' => 'Test Hotel']);
    $client = Client::query()->create(['name' => 'Test Client']);
    $vessel = Vessel::query()->create(['name' => 'MV Test']);

    $this->actingAs($admin)
        ->post(route('admin.bookings.backfill.store'), [
            'guest_id' => $guest->id,
            'hotel_id' => $hotel->id,
            'client_id' => $client->id,
            'vessel_id' => $vessel->id,
            'guest_check_in' => '2025-12-10 14:00:00',
            'guest_check_out' => '2025-12-15 11:00:00',
            'room_number' => '301',
            'single_or_twin' => 'single',
        ]);

    $booking = Booking::query()->first();

    expect($booking)->not->toBeNull();

    // Get the backfill activity (should be the last one after the automatic 'created' activity)
    $activity = $booking->activities()->where('description', 'Admin backfilled historical booking')->first();

    expect($activity)
        ->not->toBeNull()
        ->description->toBe('Admin backfilled historical booking');

    expect($activity->properties->get('backfilled'))->toBeTrue();
    expect($activity->properties->has('backfill_source'))->toBeFalse();
});

test('non-admin cannot backfill booking', function () {
    $client = User::factory()->createOne(['role' => Role::Client->value]);
    $guest = Guest::query()->create(['full_name' => 'Test Guest']);
    $hotel = Hotel::query()->create(['name' => 'Test Hotel']);
    $clientRecord = Client::query()->create(['name' => 'Test Client']);
    $vessel = Vessel::query()->create(['name' => 'MV Test']);

    $this->actingAs($client)
        ->post(route('admin.bookings.backfill.store'), [
            'guest_id' => $guest->id,
            'hotel_id' => $hotel->id,
            'client_id' => $clientRecord->id,
            'vessel_id' => $vessel->id,
            'guest_check_in' => '2025-12-10 14:00:00',
            'guest_check_out' => '2025-12-15 11:00:00',
            'room_number' => '301',
            'single_or_twin' => 'single',
        ])
        ->assertForbidden();

    expect(Booking::query()->count())->toBe(0);
});

test('backfill booking allows optional fields to be null', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $guest = Guest::query()->create(['full_name' => 'Test Guest']);
    $hotel = Hotel::query()->create(['name' => 'Test Hotel']);
    $client = Client::query()->create(['name' => 'Test Client']);
    $vessel = Vessel::query()->create(['name' => 'MV Test']);

    $this->actingAs($admin)
        ->post(route('admin.bookings.backfill.store'), [
            'guest_id' => $guest->id,
            'hotel_id' => $hotel->id,
            'client_id' => $client->id,
            'vessel_id' => $vessel->id,
            'guest_check_in' => '2025-12-10 14:00:00',
            'guest_check_out' => '2025-12-15 11:00:00',
            'room_number' => '301',
            'single_or_twin' => 'single',
            // rank_id and confirmation_number are optional
        ])
        ->assertRedirect();

    $booking = Booking::query()->first();

    expect($booking)
        ->rank_id->toBeNull()
        ->confirmation_number->toBeNull();

    expect(Booking::query()->count())->toBe(1);
});

test('backfill booking allows hotel, guest check-out and room number to be null', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $guest = Guest::query()->create(['full_name' => 'Test Guest']);
    $client = Client::query()->create(['name' => 'Test Client']);
    $vessel = Vessel::query()->create(['name' => 'MV Test']);

    $this->actingAs($admin)
        ->post(route('admin.bookings.backfill.store'), [
            'guest_id' => $guest->id,
            'hotel_id' => null,
            'client_id' => $client->id,
            'vessel_id' => $vessel->id,
            'guest_check_in' => '2025-12-10 14:00:00',
            'guest_check_out' => null,
            'room_number' => null,
            'single_or_twin' => 'single',
        ])
        ->assertRedirect();

    $booking = Booking::query()->first();

    expect($booking)
        ->hotel_id->toBeNull()
        ->guest_check_out->toBeNull()
        ->room_number->toBeNull()
        ->check_out_date->toBeNull()
        ->actual_check_out_date->toBeNull();
});
