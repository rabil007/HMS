<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('client in-house calendar shows only confirmed in-house bookings for current month', function () {
    Carbon::setTestNow(Carbon::create(2026, 4, 15, 10, 0, 0, 'Asia/Dubai'));

    $hotel = Hotel::query()->create(['name' => 'Test Hotel']);
    $client = Client::query()->create(['name' => 'Client A']);

    $user = User::factory()->createOne([
        'role' => Role::Client->value,
        'client_id' => $client->id,
        'email_verified_at' => now(),
    ]);

    $otherUser = User::factory()->createOne([
        'role' => Role::Client->value,
        'client_id' => $client->id,
        'email_verified_at' => now(),
    ]);

    $guestA = Guest::query()->create(['full_name' => 'Guest A', 'email' => 'a@example.com', 'phone' => '+971500000000']);
    $guestB = Guest::query()->create(['full_name' => 'Guest B', 'email' => 'b@example.com', 'phone' => '+971500000001']);
    $guestC = Guest::query()->create(['full_name' => 'Guest C', 'email' => 'c@example.com', 'phone' => '+971500000002']);
    $otherGuest = Guest::query()->create(['full_name' => 'Other User Guest', 'email' => 'o@example.com', 'phone' => '+971500000003']);

    $included = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'guest_id' => $guestA->id,
        'client_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-04-10',
        'check_out_date' => '2026-04-20',
        'guest_check_in' => '2026-04-10 12:00:00',
        'guest_check_out' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'guest_id' => $guestB->id,
        'client_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-04-05',
        'check_out_date' => '2026-04-06',
        'guest_check_in' => null,
        'guest_check_out' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'guest_id' => $guestC->id,
        'client_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Rejected->value,
        'check_in_date' => '2026-04-12',
        'check_out_date' => '2026-04-13',
        'guest_check_in' => '2026-04-12 12:00:00',
        'guest_check_out' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $otherUser->id,
        'guest_id' => $otherGuest->id,
        'client_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-04-11',
        'check_out_date' => '2026-04-12',
        'guest_check_in' => '2026-04-11 12:00:00',
        'guest_check_out' => null,
    ]);

    $this
        ->actingAs($user)
        ->get(route('bookings.calendar'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('bookings/calendar')
            ->where('month', '2026-04')
            ->has('inHouseBookings', 2)
            ->where('inHouseBookings.0.id', $included->id)
            ->has('scheduledBookings', 1)
            ->where('scheduledBookings.0.guest_name', 'Guest B')
        );
});

test('client can switch calendar month using month query', function () {
    Carbon::setTestNow(Carbon::create(2026, 4, 15, 10, 0, 0, 'Asia/Dubai'));

    $hotel = Hotel::query()->create(['name' => 'Test Hotel']);
    $client = Client::query()->create(['name' => 'Client A']);
    $user = User::factory()->createOne([
        'role' => Role::Client->value,
        'client_id' => $client->id,
        'email_verified_at' => now(),
    ]);
    $guestMay = Guest::query()->create(['full_name' => 'Guest May']);
    $guestApril = Guest::query()->create(['full_name' => 'Guest April']);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'guest_id' => $guestApril->id,
        'client_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-04-10',
        'check_out_date' => '2026-04-20',
        'guest_check_in' => '2026-04-10 12:00:00',
        'guest_check_out' => '2026-04-20 12:00:00',
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'guest_id' => $guestMay->id,
        'client_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-05-05',
        'check_out_date' => '2026-05-20',
        'guest_check_in' => '2026-05-05 12:00:00',
        'guest_check_out' => null,
    ]);

    $this
        ->actingAs($user)
        ->get(route('bookings.calendar', ['month' => '2026-05']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('bookings/calendar')
            ->where('month', '2026-05')
            ->has('inHouseBookings', 1)
            ->where('inHouseBookings.0.guest_name', 'Guest May')
        );
});
