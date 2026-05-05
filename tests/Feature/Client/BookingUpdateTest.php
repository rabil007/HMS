<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\User;
use App\Models\Vessel;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\put;

it('allows client to update own pending booking', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $vessel = Vessel::query()->create(['name' => 'V1']);
    $client = User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null, 'client_id' => null]);
    $guest = Guest::query()->create(['full_name' => 'G', 'email' => 'g@example.com', 'phone' => '+971501234567', 'created_by_user_id' => $client->id]);
    $guest2 = Guest::query()->create(['full_name' => 'G2', 'email' => 'g2@example.com', 'phone' => '+971501234568', 'created_by_user_id' => $client->id]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'guest_id' => $guest->id,
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($client->id));

    put(route('bookings.update', $booking), [
        'hotel_id' => $hotel->id,
        'guest_id' => $guest2->id,
        'check_in_date' => now()->addDays(2)->toDateString(),
        'check_out_date' => null,
        'rank_id' => null,
        'vessel_id' => $vessel->id,
        'single_or_twin' => 'single',
    ])->assertRedirect(route('bookings.index'));

    $booking->refresh();
    expect($booking->guest_name)->toBe('G2');
    expect($booking->guest_email)->toBe('g2@example.com');
});

it('forbids client from updating non-pending booking', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $vessel = Vessel::query()->create(['name' => 'V1']);
    $client = User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null, 'client_id' => null]);
    $guest = Guest::query()->create(['full_name' => 'G', 'email' => 'g3@example.com', 'phone' => '+971501234569', 'created_by_user_id' => $client->id]);
    $guest2 = Guest::query()->create(['full_name' => 'G2', 'email' => 'g4@example.com', 'phone' => '+971501234570', 'created_by_user_id' => $client->id]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-1',
        'guest_id' => $guest->id,
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($client->id));

    put(route('bookings.update', $booking), [
        'hotel_id' => $hotel->id,
        'guest_id' => $guest2->id,
        'check_in_date' => now()->addDays(2)->toDateString(),
        'check_out_date' => null,
        'rank_id' => null,
        'vessel_id' => $vessel->id,
        'single_or_twin' => 'single',
    ])->assertForbidden();
});
