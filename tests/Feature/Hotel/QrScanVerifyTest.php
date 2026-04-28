<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('redirects to stay page when confirmation matches a confirmed booking for the hotel', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $hotelUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-OK',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($hotelUser->id));

    get(route('hotel.scan.verify', ['confirmation' => 'CNF-OK']))
        ->assertRedirect(route('hotel.stays.show', [$booking, 'confirmation' => 'CNF-OK']));
});

it('redirects back with error when confirmation is invalid', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id]);

    actingAs(User::query()->findOrFail($hotelUser->id));

    get(route('hotel.scan.verify', ['confirmation' => 'WRONG']))
        ->assertRedirect(route('hotel.scan'))
        ->assertSessionHas('error');
});

it('shows not confirmed reason when booking is pending for same hotel', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $hotelUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'confirmation_number' => 'CNF-PENDING',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($hotelUser->id));

    get(route('hotel.scan.verify', ['confirmation' => 'CNF-PENDING']))
        ->assertRedirect(route('hotel.scan'))
        ->assertSessionHas('error', 'Booking is not confirmed yet.');
});

it('shows wrong hotel reason when booking belongs to another hotel', function () {
    $h1 = Hotel::query()->create(['name' => 'H1']);
    $h2 = Hotel::query()->create(['name' => 'H2']);
    $hotelUser = User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $h1->id]);

    Booking::query()->create([
        'hotel_id' => $h2->id,
        'user_id' => $hotelUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-OTHER',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($hotelUser->id));

    get(route('hotel.scan.verify', ['confirmation' => 'CNF-OTHER']))
        ->assertRedirect(route('hotel.scan'))
        ->assertSessionHas('error', 'This booking belongs to a different hotel.');
});
