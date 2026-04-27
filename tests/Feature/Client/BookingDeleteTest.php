<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;

it('allows client to delete own pending booking', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $client = User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null, 'client_id' => null]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($client->id));

    delete(route('bookings.destroy', $booking))
        ->assertRedirect(route('bookings.index'));

    expect(Booking::query()->find($booking->id))->toBeNull();
    expect(Booking::withTrashed()->findOrFail($booking->id)->deleted_at)->not->toBeNull();
});

it('forbids deleting non-pending booking', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $client = User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null, 'client_id' => null]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-1',
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($client->id));

    delete(route('bookings.destroy', $booking))
        ->assertForbidden();
});

