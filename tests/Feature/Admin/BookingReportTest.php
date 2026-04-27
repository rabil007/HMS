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

it('shows admin bookings report with filters and counts', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $client = Client::query()->create(['name' => 'C1']);
    $rank = Rank::query()->create(['name' => 'R1']);
    $vessel = Vessel::query()->create(['name' => 'V1']);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'client_id' => $client->id,
        'rank_id' => $rank->id,
        'vessel_id' => $vessel->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-1',
        'check_in_date' => '2026-04-27',
        'check_out_date' => null,
        'guest_check_in' => now(),
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($admin->id));

    get(route('admin.reports.bookings.index', [
        'filters' => [
            'check_in_from' => '2026-04-01',
            'check_in_to' => '2026-04-30',
            'hotel_id' => (string) $hotel->id,
            'client_id' => (string) $client->id,
            'rank_id' => (string) $rank->id,
            'vessel_id' => (string) $vessel->id,
        ],
    ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/bookings/index')
            ->has('bookings')
            ->where('bookings.data.0.confirmation_number', 'CNF-1')
        );
});

it('exports admin bookings report as xlsx', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $hotel = Hotel::query()->create(['name' => 'H1']);

    Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-1',
        'check_in_date' => '2026-04-27',
        'check_out_date' => null,
        'guest_check_in' => now(),
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($admin->id));

    get(route('admin.reports.bookings.export', [
        'filters' => ['hotel_id' => (string) $hotel->id],
    ]))
        ->assertOk()
        ->assertHeader('content-disposition');
});

