<?php

use App\Enums\Role;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\User;
use App\Models\Vessel;

use function Pest\Laravel\actingAs;

it('stores booking with guest_id and snapshots guest fields', function () {
    $client = User::factory()->createOne(['role' => Role::Client->value]);
    $vessel = Vessel::query()->create(['name' => 'Vessel 1']);
    $guest = Guest::query()->create([
        'full_name' => 'Snapshot Guest',
        'email' => 'snapshot@example.com',
        'phone' => '+971501234530',
        'created_by_user_id' => $client->id,
    ]);

    actingAs($client)
        ->post(route('bookings.store'), [
            'hotel_id' => null,
            'guest_id' => $guest->id,
            'check_in_date' => now()->addDay()->toDateString(),
            'check_out_date' => null,
            'rank_id' => null,
            'vessel_id' => $vessel->id,
            'single_or_twin' => 'single',
        ])
        ->assertRedirect(route('bookings.index'));

    $booking = Booking::query()->latest('id')->firstOrFail();
    expect($booking->guest_id)->toBe($guest->id)
        ->and($booking->guest_name)->toBe('Snapshot Guest')
        ->and($booking->guest_email)->toBe('snapshot@example.com')
        ->and($booking->guest_phone)->toBe('+971501234530');
});

it('rejects booking store when guest_id is missing', function () {
    $client = User::factory()->createOne(['role' => Role::Client->value]);
    $vessel = Vessel::query()->create(['name' => 'Vessel 2']);

    actingAs($client)
        ->post(route('bookings.store'), [
            'hotel_id' => null,
            'check_in_date' => now()->addDay()->toDateString(),
            'check_out_date' => null,
            'rank_id' => null,
            'vessel_id' => $vessel->id,
            'single_or_twin' => 'single',
        ])
        ->assertSessionHasErrors(['guest_id']);
});
