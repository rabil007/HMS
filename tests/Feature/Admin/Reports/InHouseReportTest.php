<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\User;
use App\Models\Vessel;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('shows in-house guests (checked in, not checked out)', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $rank = Rank::query()->create(['name' => 'R1']);
    $vessel = Vessel::query()->create(['name' => 'V1']);
    $client = Client::query()->create(['name' => 'C1']);

    // In-house: guest_check_in set, guest_check_out null
    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'client_id' => $client->id,
        'rank_id' => $rank->id,
        'vessel_id' => $vessel->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'INHOUSE-1',
        'check_in_date' => now()->subDays(3)->toDateString(),
        'guest_check_in' => now()->subDays(3),
        'guest_check_out' => null,
    ]);

    // Checked out: should be excluded
    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CHECKOUT-1',
        'check_in_date' => now()->subDays(5)->toDateString(),
        'guest_check_in' => now()->subDays(5),
        'guest_check_out' => now()->subDays(1),
    ]);

    // Never checked in: should be excluded
    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'NOTCHECKED-1',
        'check_in_date' => now()->subDay()->toDateString(),
        'guest_check_in' => null,
    ]);

    actingAs(User::query()->findOrFail($admin->id));

    get(route('admin.reports.in-house.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/in-house/index')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.confirmation_number', 'INHOUSE-1')
        );
});

it('filters in-house report by hotel', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $hotelA = Hotel::query()->create(['name' => 'Hotel A']);
    $hotelB = Hotel::query()->create(['name' => 'Hotel B']);

    Booking::query()->create([
        'hotel_id' => $hotelA->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'A-1',
        'check_in_date' => now()->subDay()->toDateString(),
        'guest_check_in' => now()->subDay(),
        'guest_check_out' => null,
    ]);

    Booking::query()->create([
        'hotel_id' => $hotelB->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'B-1',
        'check_in_date' => now()->subDay()->toDateString(),
        'guest_check_in' => now()->subDay(),
        'guest_check_out' => null,
    ]);

    actingAs(User::query()->findOrFail($admin->id));

    get(route('admin.reports.in-house.index', ['filters' => ['hotel_id' => (string) $hotelA->id]]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('bookings.data', 1)
            ->where('bookings.data.0.confirmation_number', 'A-1')
        );
});

it('exports in-house report as xlsx', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $hotel = Hotel::query()->create(['name' => 'H1']);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'EXP-1',
        'check_in_date' => now()->subDays(2)->toDateString(),
        'guest_check_in' => now()->subDays(2),
        'guest_check_out' => null,
    ]);

    actingAs(User::query()->findOrFail($admin->id));

    get(route('admin.reports.in-house.export'))
        ->assertOk()
        ->assertHeader('content-disposition');
});

it('denies in-house report to non-admin users', function () {
    $client = User::factory()->createOne(['role' => Role::Client->value]);

    actingAs($client);

    get(route('admin.reports.in-house.index'))->assertForbidden();
});
