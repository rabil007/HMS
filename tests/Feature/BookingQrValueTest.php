<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('provides qrValue (confirmation number) for confirmed bookings', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $hotel = Hotel::query()->create(['name' => 'H1']);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $admin->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-123',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($admin->id));

    get(route('bookings.show', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('bookings/show')
            ->where('qrValue', 'CNF-123')
        );
});

