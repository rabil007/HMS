<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\BookingDateRequest;
use App\Models\Hotel;
use App\Models\User;
use App\Notifications\BookingDateChangeAcceptedNotification;
use App\Notifications\BookingDateChangeProposedNotification;
use App\Notifications\BookingDateChangeRejectedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

it('allows hotel to propose date change and client to accept', function () {
    Notification::fake();

    $hotel = Hotel::query()->create(['name' => 'H1']);

    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );

    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => '2026-04-10',
        'check_out_date' => '2026-04-12',
        'guest_name' => 'G1',
        'guest_email' => 'g1@example.com',
        'guest_phone' => '123',
    ]);

    actingAs($hotelUser);

    post(route('hotel.bookings.date-requests.store', $booking), [
        'requested_check_in_date' => '2026-04-11',
        'requested_check_out_date' => '2026-04-13',
        'response_note' => 'Need to shift',
    ])->assertRedirect(route('hotel.bookings.index'));

    $dateRequest = BookingDateRequest::query()->where('booking_id', $booking->id)->firstOrFail();
    expect($dateRequest->status)->toBe('pending');

    Notification::assertSentTo($clientUser, BookingDateChangeProposedNotification::class);

    actingAs($clientUser);

    put(route('date-requests.accept', $dateRequest), [
        'response_note' => 'Ok',
    ])->assertRedirect(route('bookings.show', $booking));

    $booking->refresh();
    $dateRequest->refresh();

    expect($booking->check_in_date?->toDateString())->toBe('2026-04-11');
    expect($booking->check_out_date?->toDateString())->toBe('2026-04-13');
    expect($dateRequest->status)->toBe('accepted');

    Notification::assertSentTo($hotelUser, BookingDateChangeAcceptedNotification::class);
});

it('allows client to reject a pending date change', function () {
    Notification::fake();

    $hotel = Hotel::query()->create(['name' => 'H1']);

    $hotelUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id])->id
    );

    $clientUser = User::query()->findOrFail(
        User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null])->id
    );

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => '2026-04-10',
        'check_out_date' => null,
        'guest_name' => 'G1',
        'guest_email' => 'g1@example.com',
        'guest_phone' => '123',
    ]);

    $dateRequest = BookingDateRequest::query()->create([
        'booking_id' => $booking->id,
        'requested_by_user_id' => $hotelUser->id,
        'requested_check_in_date' => '2026-04-11',
        'requested_check_out_date' => null,
        'status' => 'pending',
    ]);

    actingAs($clientUser);

    put(route('date-requests.reject', $dateRequest), [
        'response_note' => 'Cannot change',
    ])->assertRedirect(route('bookings.show', $booking));

    $dateRequest->refresh();
    expect($dateRequest->status)->toBe('rejected');

    Notification::assertSentTo($hotelUser, BookingDateChangeRejectedNotification::class);
});

