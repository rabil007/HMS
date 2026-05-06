<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\User;
use Illuminate\Support\Str;

it('shows metric drilldown list for in-house bookings', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $owner = User::factory()->createOne(['role' => Role::Client->value]);
    $inHouseGuest = Guest::query()->create(['full_name' => 'In House Guest']);
    $pendingCheckedInGuest = Guest::query()->create(['full_name' => 'Pending Checked-in Guest']);

    Booking::query()->create([
        'hotel_id' => null,
        'user_id' => $owner->id,
        'guest_id' => $inHouseGuest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => now()->subDay()->toDateString(),
        'check_out_date' => now()->addDay()->toDateString(),
        'guest_check_in' => now()->subHours(10),
        'guest_check_out' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => null,
        'user_id' => $owner->id,
        'guest_id' => $pendingCheckedInGuest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->subDay()->toDateString(),
        'check_out_date' => now()->addDay()->toDateString(),
        'guest_check_in' => now()->subHours(8),
        'guest_check_out' => null,
    ]);

    $this->actingAs($admin)
        ->get(route('overview.metric', ['metric' => 'in-house']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('overview-metric')
            ->where('title', 'In House')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.guest_name', 'In House Guest')
        );
});

it('applies status filter on metric drilldown', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $owner = User::factory()->createOne(['role' => Role::Client->value]);
    $pendingGuest = Guest::query()->create(['full_name' => 'Pending Guest']);
    $confirmedGuest = Guest::query()->create(['full_name' => 'Confirmed Guest']);

    Booking::query()->create([
        'hotel_id' => null,
        'user_id' => $owner->id,
        'guest_id' => $pendingGuest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => null,
        'user_id' => $owner->id,
        'guest_id' => $confirmedGuest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    $this->actingAs($admin)
        ->get(route('overview.metric', ['metric' => 'total', 'status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('overview-metric')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.guest_name', 'Pending Guest')
        );
});
