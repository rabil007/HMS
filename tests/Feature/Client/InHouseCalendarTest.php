<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('client in-house calendar shows only confirmed in-house bookings for current month', function () {
    Carbon::setTestNow(Carbon::create(2026, 4, 15, 10, 0, 0, 'Asia/Dubai'));

    $hotel = Hotel::query()->create(['name' => 'Test Hotel']);

    $user = User::factory()->createOne([
        'role' => Role::Client->value,
        'email_verified_at' => now(),
    ]);

    $otherUser = User::factory()->createOne([
        'role' => Role::Client->value,
        'email_verified_at' => now(),
    ]);

    $included = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-04-10',
        'check_out_date' => '2026-04-20',
        'guest_name' => 'Guest A',
        'guest_email' => 'a@example.com',
        'guest_phone' => '+971500000000',
        'guest_check_in' => '2026-04-10 12:00:00',
        'guest_check_out' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-04-05',
        'check_out_date' => '2026-04-06',
        'guest_name' => 'Guest B',
        'guest_email' => 'b@example.com',
        'guest_phone' => '+971500000001',
        'guest_check_in' => null,
        'guest_check_out' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Rejected->value,
        'check_in_date' => '2026-04-12',
        'check_out_date' => '2026-04-13',
        'guest_name' => 'Guest C',
        'guest_email' => 'c@example.com',
        'guest_phone' => '+971500000002',
        'guest_check_in' => '2026-04-12 12:00:00',
        'guest_check_out' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $otherUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-04-11',
        'check_out_date' => '2026-04-12',
        'guest_name' => 'Other User Guest',
        'guest_email' => 'o@example.com',
        'guest_phone' => '+971500000003',
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
            ->has('inHouseBookings', 1)
            ->where('inHouseBookings.0.id', $included->id)
            ->has('scheduledBookings', 1)
            ->where('scheduledBookings.0.guest_name', 'Guest B')
        );
});

