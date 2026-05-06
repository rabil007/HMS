<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\put;

it('lists only confirmed bookings in hotel stay module', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );
    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );
    $confirmedGuest = Guest::query()->create([
        'full_name' => 'Confirmed',
        'email' => 'c@example.com',
        'created_by_user_id' => $clientUser->id,
    ]);
    $pendingGuest = Guest::query()->create([
        'full_name' => 'Pending',
        'email' => 'p@example.com',
        'created_by_user_id' => $clientUser->id,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'guest_id' => $confirmedGuest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-1',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'guest_id' => $pendingGuest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    actingAs($hotelUser);

    $response = get(route('hotel.stays.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('hotel/stays/index')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.guest_name', 'Confirmed')
        ->has('counts')
    );
});

it('requires matching confirmation number to check in', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );
    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );
    $guest = Guest::query()->create([
        'full_name' => 'G',
        'email' => 'g1@example.com',
        'created_by_user_id' => $clientUser->id,
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'guest_id' => $guest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-OK',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    actingAs($hotelUser);

    $response = put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'WRONG',
        'room_number' => '101',
        'guest_check_in' => now()->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors(['confirmation_number']);
    expect($booking->fresh()->guest_check_in)->toBeNull();
});

it('allows check-in and then allows check-out', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );
    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );
    $guest = Guest::query()->create([
        'full_name' => 'G',
        'email' => 'g2@example.com',
        'created_by_user_id' => $clientUser->id,
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'guest_id' => $guest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-OK',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    actingAs($hotelUser);

    $checkIn = put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'CNF-OK',
        'room_number' => '305',
        'guest_check_in' => now()->toDateTimeString(),
    ]);
    $checkIn->assertRedirect(route('hotel.stays.show', $booking));
    expect(substr((string) $booking->fresh()->getRawOriginal('guest_check_in'), 0, 10))->toBe(now()->toDateString());
    expect($booking->fresh()->room_number)->toBe('305');

    $checkOut = put(route('hotel.stays.checkOut', $booking), [
        'guest_check_out' => now()->addDay()->toDateTimeString(),
    ]);
    $checkOut->assertRedirect(route('hotel.stays.show', $booking));
    expect(substr((string) $booking->fresh()->getRawOriginal('guest_check_out'), 0, 10))->toBe(now()->addDay()->toDateString());
});

it('requires room_number when checking in', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );
    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );
    $guest = Guest::query()->create([
        'full_name' => 'G',
        'email' => 'g3@example.com',
        'created_by_user_id' => $clientUser->id,
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'guest_id' => $guest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-OK',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    actingAs($hotelUser);

    $response = put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'CNF-OK',
        'guest_check_in' => now()->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors(['room_number']);
    expect($booking->fresh()->guest_check_in)->toBeNull();
    expect($booking->fresh()->room_number)->toBeNull();
});

it('locks room_number after first successful check-in', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );
    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );
    $guest = Guest::query()->create([
        'full_name' => 'G',
        'email' => 'g4@example.com',
        'created_by_user_id' => $clientUser->id,
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'guest_id' => $guest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-OK',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    actingAs($hotelUser);

    put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'CNF-OK',
        'room_number' => '101',
        'guest_check_in' => now()->toDateTimeString(),
    ])->assertRedirect(route('hotel.stays.show', $booking));

    expect($booking->fresh()->room_number)->toBe('101');

    put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'CNF-OK',
        'room_number' => '999',
        'guest_check_in' => now()->toDateTimeString(),
    ])->assertRedirect(route('hotel.stays.show', $booking));

    expect($booking->fresh()->room_number)->toBe('101');
});
