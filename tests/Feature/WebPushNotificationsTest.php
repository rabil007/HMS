<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\User;
use App\Notifications\BookingApprovedNotification;
use App\Notifications\BookingCheckedInNotification;
use App\Notifications\BookingCheckedOutNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Minishlink\WebPush\VAPID;
use NotificationChannels\WebPush\WebPushChannel;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\put;

function configureVapid(): void
{
    config([
        'webpush.vapid.public_key' => 'BPublicKeyForTests',
        'webpush.vapid.private_key' => 'PrivateKeyForTests',
    ]);
}

/**
 * @return array{hotel: Hotel, hotelUser: User, clientUser: User, admin: User, booking: Booking}
 */
function stayScenario(): array
{
    $hotel = Hotel::query()->create(['name' => 'Harbour Hotel']);
    $hotelUser = User::factory()->createOne(['role' => Role::Hotel->value, 'hotel_id' => $hotel->id]);
    $clientUser = User::factory()->createOne(['role' => Role::Client->value, 'hotel_id' => null]);
    $admin = User::factory()->createOne(['role' => Role::Admin->value, 'hotel_id' => null]);

    $guest = Guest::query()->create([
        'full_name' => 'Sailor Sam',
        'email' => 'sam@example.com',
        'created_by_user_id' => $clientUser->id,
    ]);

    $booking = Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $clientUser->id,
        'guest_id' => $guest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-PUSH',
        'check_in_date' => now()->toDateString(),
        'check_out_date' => null,
    ]);

    return compact('hotel', 'hotelUser', 'clientUser', 'admin', 'booking');
}

test('users can save and remove a push subscription', function () {
    configureVapid();
    $user = User::factory()->createOne();

    actingAs($user)
        ->postJson(route('push-subscriptions.store'), [
            'endpoint' => 'https://push.example.com/send/abc',
            'keys' => ['p256dh' => 'p256dh-key', 'auth' => 'auth-key'],
            'contentEncoding' => 'aes128gcm',
        ])
        ->assertOk()
        ->assertJson(['subscribed' => true]);

    expect($user->pushSubscriptions()->count())->toBe(1);
    expect($user->pushSubscriptions()->first()->endpoint)->toBe('https://push.example.com/send/abc');

    actingAs($user)
        ->deleteJson(route('push-subscriptions.destroy'), ['endpoint' => 'https://push.example.com/send/abc'])
        ->assertOk()
        ->assertJson(['subscribed' => false]);

    expect($user->pushSubscriptions()->count())->toBe(0);
});

test('saving a subscription is refused when VAPID keys are missing', function () {
    config(['webpush.vapid.public_key' => null, 'webpush.vapid.private_key' => null]);
    $user = User::factory()->createOne();

    actingAs($user)
        ->postJson(route('push-subscriptions.store'), [
            'endpoint' => 'https://push.example.com/send/abc',
            'keys' => ['p256dh' => 'p256dh-key', 'auth' => 'auth-key'],
        ])
        ->assertStatus(503);

    expect($user->pushSubscriptions()->count())->toBe(0);
});

test('push subscription requires the browser keys', function () {
    configureVapid();
    $user = User::factory()->createOne();

    actingAs($user)
        ->postJson(route('push-subscriptions.store'), ['endpoint' => 'https://push.example.com/send/abc'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['keys.p256dh', 'keys.auth']);
});

test('guests cannot save push subscriptions', function () {
    $this->postJson(route('push-subscriptions.store'), [])->assertUnauthorized();
});

test('the VAPID public key is shared with the frontend only when configured', function () {
    $user = User::factory()->createOne(['email_verified_at' => now()]);

    config(['webpush.vapid.public_key' => null, 'webpush.vapid.private_key' => null]);
    actingAs($user)->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page->where('webPush.publicKey', null));

    configureVapid();
    actingAs($user)->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page->where('webPush.publicKey', 'BPublicKeyForTests'));
});

test('booking notifications go out by push only to users who opted in', function () {
    configureVapid();
    ['clientUser' => $optedIn, 'admin' => $notOptedIn, 'booking' => $booking] = stayScenario();

    $optedIn->updatePushSubscription('https://push.example.com/send/1', 'p256dh-key', 'auth-key');

    $notification = new BookingApprovedNotification($booking);

    expect($notification->via($optedIn))->toContain(WebPushChannel::class);
    expect($notification->via($notOptedIn))->not->toContain(WebPushChannel::class);
    expect($notification->via($optedIn))->toContain('database');
});

test('no push is attempted when VAPID keys are missing', function () {
    config(['webpush.vapid.public_key' => null, 'webpush.vapid.private_key' => null]);
    ['clientUser' => $user, 'booking' => $booking] = stayScenario();

    $user->updatePushSubscription('https://push.example.com/send/1', 'p256dh-key', 'auth-key');

    expect((new BookingApprovedNotification($booking))->via($user))->not->toContain(WebPushChannel::class);
});

test('the push message carries the title, body and a link to the booking', function () {
    ['clientUser' => $user, 'booking' => $booking] = stayScenario();

    $message = (new BookingApprovedNotification($booking))->toWebPush($user, null)->toArray();

    expect($message['title'])->toBe('Booking approved');
    expect($message['body'])->toContain('Sailor Sam');
    expect($message['data']['url'])->toBe(url(route('bookings.show', $booking, absolute: false)));
});

test('checking a guest in notifies the booking creator and admins', function () {
    Notification::fake();
    ['hotelUser' => $hotelUser, 'clientUser' => $creator, 'admin' => $admin, 'booking' => $booking] = stayScenario();

    actingAs($hotelUser);

    put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'CNF-PUSH',
        'room_number' => '204',
        'guest_check_in' => now()->toDateTimeString(),
    ])->assertRedirect(route('hotel.stays.show', $booking));

    Notification::assertSentTo($creator, BookingCheckedInNotification::class);
    Notification::assertSentTo($admin, BookingCheckedInNotification::class);
    Notification::assertNotSentTo($hotelUser, BookingCheckedInNotification::class);
    Notification::assertSentTimes(BookingCheckedInNotification::class, 2);
});

test('checking a guest out notifies the booking creator and admins', function () {
    ['hotelUser' => $hotelUser, 'clientUser' => $creator, 'admin' => $admin, 'booking' => $booking] = stayScenario();
    $booking->update(['guest_check_in' => now()->subDay(), 'room_number' => '204']);

    Notification::fake();
    actingAs($hotelUser);

    put(route('hotel.stays.checkOut', $booking), [
        'guest_check_out' => now()->toDateTimeString(),
    ])->assertRedirect(route('hotel.stays.show', $booking));

    Notification::assertSentTo($creator, BookingCheckedOutNotification::class);
    Notification::assertSentTo($admin, BookingCheckedOutNotification::class);
    Notification::assertSentTimes(BookingCheckedOutNotification::class, 2);
});

test('an admin who created the booking is notified once on check-in', function () {
    Notification::fake();
    ['hotelUser' => $hotelUser, 'admin' => $admin, 'booking' => $booking] = stayScenario();
    $booking->update(['user_id' => $admin->id]);

    actingAs($hotelUser);

    put(route('hotel.stays.checkIn', $booking), [
        'confirmation_number' => 'CNF-PUSH',
        'room_number' => '204',
        'guest_check_in' => now()->toDateTimeString(),
    ]);

    Notification::assertSentTimes(BookingCheckedInNotification::class, 1);
});

test('check-in notification appears in the bell with a link the reader can open', function () {
    ['hotelUser' => $hotelUser, 'clientUser' => $creator, 'booking' => $booking] = stayScenario();
    $booking->update(['guest_check_in' => now(), 'room_number' => '204']);

    $forCreator = (new BookingCheckedInNotification($booking))->toArray($creator);
    $forHotel = (new BookingCheckedInNotification($booking))->toArray($hotelUser);

    expect($forCreator['type'])->toBe('booking_checked_in');
    expect($forCreator['title'])->toBe('Guest checked in');
    expect($forCreator['body'])->toContain('Room 204');
    expect($forCreator['url'])->toBe(route('bookings.show', $booking, absolute: false));
    expect($forHotel['url'])->toBe(route('hotel.stays.show', $booking, absolute: false));
    expect((new BookingCheckedInNotification($booking))->via($creator))->not->toContain('mail');
});

test('the push channel can be built with real VAPID keys on this server', function () {
    $keys = VAPID::createVapidKeys();
    config([
        'webpush.vapid.public_key' => $keys['publicKey'],
        'webpush.vapid.private_key' => $keys['privateKey'],
    ]);

    expect(app(WebPushChannel::class))->toBeInstanceOf(WebPushChannel::class);
});

test('the dashboard prompt shows until the user skips it, and skipping is remembered per user', function () {
    configureVapid();
    $user = User::factory()->createOne(['email_verified_at' => now()]);
    $otherUser = User::factory()->createOne(['email_verified_at' => now()]);

    actingAs($user)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('webPush.promptDismissed', false));

    actingAs($user)
        ->postJson(route('push-subscriptions.prompt.dismiss'))
        ->assertOk()
        ->assertJson(['dismissed' => true]);

    actingAs($user)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('webPush.promptDismissed', true));

    actingAs($otherUser)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('webPush.promptDismissed', false));
});

test('a user who skipped the prompt can still turn push on from settings', function () {
    configureVapid();
    $user = User::factory()->createOne();

    actingAs($user)->postJson(route('push-subscriptions.prompt.dismiss'))->assertOk();

    actingAs($user)
        ->postJson(route('push-subscriptions.store'), [
            'endpoint' => 'https://push.example.com/send/after-skip',
            'keys' => ['p256dh' => 'p256dh-key', 'auth' => 'auth-key'],
        ])
        ->assertOk();

    expect($user->pushSubscriptions()->count())->toBe(1);
});

test('guests cannot dismiss the push prompt', function () {
    $this->postJson(route('push-subscriptions.prompt.dismiss'))->assertUnauthorized();
});
