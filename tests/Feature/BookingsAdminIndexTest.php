<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('defaults bookings index to scheduled check-in today for admin users', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);

    $admin = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Admin->value, 'hotel_id' => null])->id
    );

    $u1 = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );
    $u2 = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );

    $b1 = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $u1->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G1',
        'guest_email' => 'g1@example.com',
        'guest_phone' => null,
    ]);

    $b2 = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $u2->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G2',
        'guest_email' => 'g2@example.com',
        'guest_phone' => null,
    ]);

    actingAs($admin);

    $response = get(route('bookings.index'));
    $response->assertOk();
    $response->assertInertia(function ($page) use ($b1) {
        $page
            ->component('bookings/index')
            ->has('bookings.data', 1)
            ->where('overallTotal', 2)
            ->where('bookings.data.0.id', $b1->id)
            ->where('filters.column.check_in_from', now()->toDateString())
            ->where('filters.column.check_in_to', now()->toDateString())
            ->where('filters.date_scope', null);
    });
});

it('lists all bookings for admin when date_scope is all', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);

    $admin = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Admin->value, 'hotel_id' => null])->id
    );

    $u1 = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );
    $u2 = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $u1->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G1',
        'guest_email' => 'g1@example.com',
        'guest_phone' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $u2->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G2',
        'guest_email' => 'g2@example.com',
        'guest_phone' => null,
    ]);

    actingAs($admin);

    $response = get(route('bookings.index', ['date_scope' => 'all']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('bookings/index')
        ->has('bookings.data', 2)
        ->where('filters.date_scope', 'all')
    );
});

it('filters bookings index by scheduled check-in date range', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);

    $admin = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Admin->value, 'hotel_id' => null])->id
    );

    $client = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );

    $inRange = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-06-10',
        'check_out_date' => null,
        'guest_name' => 'In',
        'guest_email' => 'in@example.com',
        'guest_phone' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-08-01',
        'check_out_date' => null,
        'guest_name' => 'Out',
        'guest_email' => 'out@example.com',
        'guest_phone' => null,
    ]);

    actingAs($admin);

    $response = get(route('bookings.index', [
        'filters' => [
            'check_in_from' => '2026-06-01',
            'check_in_to' => '2026-06-30',
        ],
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('bookings/index')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.id', $inRange->id)
    );
});
