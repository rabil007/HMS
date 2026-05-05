<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('shows bookings to other users in the same client account', function () {
    $hotel = Hotel::query()->create(['name' => 'Zakher Marine']);
    $client = Client::query()->create(['name' => 'Zakher Marine']);

    $creator = User::factory()->createOne([
        'role' => Role::Client->value,
        'client_id' => $client->id,
    ]);
    $anotherClientUser = User::factory()->createOne([
        'role' => Role::Client->value,
        'client_id' => $client->id,
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $creator->id,
        'client_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'Shared Guest',
        'guest_email' => 'shared@example.com',
        'guest_phone' => null,
        'single_or_twin' => 'single',
    ]);

    actingAs($anotherClientUser)
        ->get(route('bookings.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('bookings/index')
            ->where('overallTotal', 1)
            ->has('bookings.data', 1)
            ->where('bookings.data.0.id', $booking->id)
        );
});

it('allows viewing booking details for same client account', function () {
    $hotel = Hotel::query()->create(['name' => 'Zakher Marine']);
    $client = Client::query()->create(['name' => 'Zakher Marine']);

    $creator = User::factory()->createOne([
        'role' => Role::Client->value,
        'client_id' => $client->id,
    ]);
    $anotherClientUser = User::factory()->createOne([
        'role' => Role::Client->value,
        'client_id' => $client->id,
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $creator->id,
        'client_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'Shared Guest',
        'guest_email' => 'shared@example.com',
        'guest_phone' => null,
        'single_or_twin' => 'single',
    ]);

    actingAs($anotherClientUser)
        ->get(route('bookings.show', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('bookings/show')
            ->where('booking.id', $booking->id)
        );
});

