<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\AppSetting;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use App\Notifications\BookingApprovedNotification;
use App\Notifications\BookingRequestedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

it('sends booking submitted email to hotel users and admins when enabled', function () {
    Notification::fake();

    AppSetting::query()->updateOrCreate(
        ['key' => 'email_notifications_enabled'],
        ['value' => ['enabled' => true]]
    );

    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id]);
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $client = User::factory()->createOne(['role' => Role::Client->value, 'client_id' => null, 'hotel_id' => null]);

    actingAs(User::query()->findOrFail($client->id));

    post(route('bookings.store'), [
        'hotel_id' => $hotel->id,
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'Guest',
        'guest_email' => 'guest@example.com',
        'guest_phone' => '+971501234567',
        'single_or_twin' => 'single',
    ])->assertRedirect(route('bookings.index'));

    Notification::assertSentTo(User::query()->findOrFail($hotelUser->id), BookingRequestedNotification::class);
    Notification::assertSentTo(User::query()->findOrFail($admin->id), BookingRequestedNotification::class);
});

it('does not send booking submitted email when disabled', function () {
    Notification::fake();

    AppSetting::query()->updateOrCreate(
        ['key' => 'email_notifications_enabled'],
        ['value' => ['enabled' => false]]
    );

    $hotel = Hotel::query()->create(['name' => 'H1']);
    User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id]);
    User::factory()->createOne(['role' => Role::Admin->value]);
    $client = User::factory()->createOne(['role' => Role::Client->value, 'client_id' => null, 'hotel_id' => null]);

    actingAs(User::query()->findOrFail($client->id));

    post(route('bookings.store'), [
        'hotel_id' => $hotel->id,
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'Guest',
        'guest_email' => 'guest@example.com',
        'guest_phone' => '+971501234567',
        'single_or_twin' => 'single',
    ])->assertRedirect(route('bookings.index'));

    Notification::assertNothingSent();
});

it('sends booking approved email to admin, guest, and client when enabled', function () {
    Notification::fake();

    AppSetting::query()->updateOrCreate(
        ['key' => 'email_notifications_enabled'],
        ['value' => ['enabled' => true]]
    );

    $hotel = Hotel::query()->create(['name' => 'H1']);
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $hotelUser = User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id]);
    $client = User::factory()->createOne(['role' => Role::Client->value, 'client_id' => null, 'hotel_id' => null, 'email' => 'client@example.com']);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $client->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Pending->value,
        'check_in_date' => now()->addDay()->toDateString(),
        'check_out_date' => null,
        'guest_name' => 'Guest',
        'guest_email' => 'guest@example.com',
        'guest_phone' => '+971501234567',
    ]);

    actingAs(User::query()->findOrFail($hotelUser->id));

    put(route('hotel.bookings.approve', $booking), [
        'confirmation_number' => 'CNF-123',
        'actual_check_in_date' => now()->addDay()->toDateString(),
        'actual_check_out_date' => null,
        'remarks' => 'ok',
    ])->assertRedirect(route('hotel.bookings.index'));

    Notification::assertSentTo(User::query()->findOrFail($client->id), BookingApprovedNotification::class);
    Notification::assertSentTo(User::query()->findOrFail($admin->id), BookingApprovedNotification::class);
    Notification::assertSentOnDemand(BookingApprovedNotification::class);
});

