<?php

use App\Enums\Role;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Illuminate\Support\Str;

test('booking detail includes remarks when present', function () {
    $hotel = Hotel::query()->create([
        'name' => 'Test Hotel',
    ]);

    $user = User::factory()->createOne([
        'role' => Role::Client->value,
        'email_verified_at' => now(),
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $user->id,
        'public_id' => (string) Str::ulid(),
        'status' => 'pending',
        'check_in_date' => now()->toDateString(),
        'guest_name' => 'Guest',
        'guest_email' => 'guest@example.com',
        'guest_phone' => '+971500000000',
        'remarks' => 'Needs early check-in',
    ]);

    $this
        ->actingAs($user)
        ->get(route('bookings.show', $booking))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('bookings/show')
            ->where('booking.remarks', 'Needs early check-in')
        );
});

