<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard bookings badge counts only today pending bookings for admin', function () {
    Carbon::setTestNow('2026-05-05 10:00:00');

    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $owner = User::factory()->createOne(['role' => Role::Client->value]);

    Booking::query()->create([
        'hotel_id' => null,
        'user_id' => $owner->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => '2026-05-05',
        'check_out_date' => null,
        'guest_name' => 'Today Pending',
    ]);

    Booking::query()->create([
        'hotel_id' => null,
        'user_id' => $owner->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => '2026-05-07',
        'check_out_date' => null,
        'guest_name' => 'Future Pending',
    ]);

    Booking::query()->create([
        'hotel_id' => null,
        'user_id' => $owner->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-05-05',
        'check_out_date' => null,
        'guest_name' => 'Today Confirmed',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('pendingBookingsCount', 1));

    Carbon::setTestNow();
});
