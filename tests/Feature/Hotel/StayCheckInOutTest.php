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

it('lists only confirmed bookings in hotel stay module', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );
    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-1',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'Confirmed',
        'guest_email' => 'c@example.com',
        'guest_phone' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'Pending',
        'guest_email' => 'p@example.com',
        'guest_phone' => null,
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

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-OK',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => null,
    ]);

    actingAs($hotelUser);

    $response = put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'WRONG',
        'actual_check_in_date' => now()->toDateString(),
    ]);

    $response->assertSessionHasErrors(['confirmation_number']);
    expect($booking->fresh()->actual_check_in_date)->toBeNull();
});

it('allows check-in and then allows check-out', function () {
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
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-OK',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => null,
    ]);

    actingAs($hotelUser);

    $checkIn = put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'CNF-OK',
        'actual_check_in_date' => now()->toDateString(),
    ]);
    $checkIn->assertRedirect(route('hotel.stays.show', $booking));
    expect(substr((string) $booking->fresh()->getRawOriginal('actual_check_in_date'), 0, 10))->toBe(now()->toDateString());

    $checkOut = put(route('hotel.stays.checkOut', $booking), [
        'actual_check_out_date' => now()->addDay()->toDateString(),
    ]);
    $checkOut->assertRedirect(route('hotel.stays.show', $booking));
    expect(substr((string) $booking->fresh()->getRawOriginal('actual_check_out_date'), 0, 10))->toBe(now()->addDay()->toDateString());
});

