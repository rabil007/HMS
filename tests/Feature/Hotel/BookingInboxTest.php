<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\put;

it('allows hotel users to view their booking inbox', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $hotelUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => null,
    ]);

    actingAs($hotelUser);

    $response = get(route('hotel.bookings.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('hotel/bookings/index'));
});

it('allows hotel users to approve pending bookings for their hotel', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );
    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => null,
    ]);

    actingAs($hotelUser);

    $response = put(route('hotel.bookings.approve', $booking), [
        'confirmation_number' => 'CNF-123',
        'remarks' => 'OK',
    ]);

    $response->assertRedirect(route('hotel.bookings.index'));

    expect($booking->fresh()->status->value)->toBe(BookingStatus::Confirmed->value);
    expect($booking->fresh()->confirmation_number)->toBe('CNF-123');
    expect($booking->fresh()->approved_by_user_id)->toBe($hotelUser->id);
});

it('allows hotel users to reject pending bookings for their hotel', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );
    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => null,
    ]);

    actingAs($hotelUser);

    $response = put(route('hotel.bookings.reject', $booking), [
        'remarks' => 'No availability',
    ]);

    $response->assertRedirect(route('hotel.bookings.index'));

    expect($booking->fresh()->status->value)->toBe(BookingStatus::Rejected->value);
    expect($booking->fresh()->rejected_by_user_id)->toBe($hotelUser->id);
});

it('allows hotel users to view booking inbox details', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $hotelUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => null,
    ]);

    actingAs($hotelUser);

    $response = get(route('hotel.bookings.show', $booking));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('hotel/bookings/show')->has('booking'));
});
