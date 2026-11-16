<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\User;
use App\Notifications\BookingCheckedInNotification;
use App\Services\WebPushClientFactory;
use GuzzleHttp\Psr7\Request as Psr7Request;
use GuzzleHttp\Psr7\Response as Psr7Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\WebPush;
use NotificationChannels\WebPush\WebPushChannel;

/**
 * @param  array<string, int>  $statusByEndpoint
 * @return ArrayObject<int, string>
 */
function fakePushService(array $statusByEndpoint = []): ArrayObject
{
    $sent = new ArrayObject;

    $webPush = Mockery::mock(WebPush::class);
    $webPush->shouldReceive('queueNotification')->andReturnUsing(function ($subscription) use ($sent) {
        $sent[] = $subscription->getEndpoint();
    });
    $webPush->shouldReceive('flush')->andReturnUsing(function () use ($sent, $statusByEndpoint) {
        foreach ($sent as $endpoint) {
            $status = $statusByEndpoint[$endpoint] ?? 201;

            yield new MessageSentReport(
                new Psr7Request('POST', $endpoint),
                new Psr7Response($status, [], $status < 400 ? '' : 'push service said no'),
                $status < 400,
                $status < 400 ? 'OK' : "Client error: {$status}",
            );
        }
    });

    $factory = Mockery::mock(WebPushClientFactory::class);
    $factory->shouldReceive('make')->andReturn($webPush);
    app()->instance(WebPushClientFactory::class, $factory);

    return $sent;
}

function checkedInBooking(): Booking
{
    $hotel = Hotel::query()->create(['name' => 'Harbour Hotel']);
    $client = User::factory()->createOne(['role' => Role::Client->value]);
    $guest = Guest::query()->create(['full_name' => 'Sailor Sam', 'created_by_user_id' => $client->id]);

    return Booking::query()->create([
        'hotel_id' => $hotel->id,
        'user_id' => $client->id,
        'guest_id' => $guest->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'confirmation_number' => 'CNF-DELIVERY',
        'check_in_date' => now()->toDateString(),
    ]);
}

beforeEach(function () {
    config([
        'webpush.vapid.public_key' => 'BPublicKeyForTests',
        'webpush.vapid.private_key' => 'PrivateKeyForTests',
        // Production default: no queue worker needed for push or the bell.
        'queue.default' => 'database',
    ]);
});

test('push and the bell do not wait for a queue worker', function () {
    $notification = new BookingCheckedInNotification(checkedInBooking());

    expect($notification->viaConnections())->toBe([
        'database' => 'sync',
        WebPushChannel::class => 'deferred',
    ]);

    config(['webpush.queue_connection' => 'database']);
    expect($notification->viaConnections()[WebPushChannel::class])->toBe('database');
});

test('a booking push is delivered right after the request, with no queued job left behind', function () {
    $this->withoutDefer();
    $sent = fakePushService();
    $user = User::factory()->admin()->createOne();
    $user->updatePushSubscription('https://push.example.com/send/phone', 'p256dh', 'auth', 'aes128gcm');

    $user->notify(new BookingCheckedInNotification(checkedInBooking()));

    expect($sent->getArrayCopy())->toBe(['https://push.example.com/send/phone']);
    expect($user->notifications()->count())->toBe(1);
    expect(DB::table('jobs')->count())->toBe(0);
    expect($user->pushSubscriptions()->first()->last_used_at)->not->toBeNull();
});

test('a rejected push is logged with the reason', function () {
    $this->withoutDefer();
    fakePushService(['https://push.example.com/send/phone' => 403]);
    Log::spy();
    $user = User::factory()->admin()->createOne();
    $user->updatePushSubscription('https://push.example.com/send/phone', 'p256dh', 'auth', 'aes128gcm');

    $user->notify(new BookingCheckedInNotification(checkedInBooking()));

    Log::shouldHaveReceived('warning')->withArgs(fn ($message, $context) => $message === 'Web push failed'
        && $context['status'] === 403
        && $context['push_service'] === 'push.example.com'
        && $context['user_id'] === $user->id
        && $context['expired_and_removed'] === false
        && str_contains($context['response'], 'push service said no'));

    expect($user->pushSubscriptions()->count())->toBe(1);
});

test('a device the push service no longer knows is removed and logged', function () {
    $this->withoutDefer();
    fakePushService(['https://push.example.com/send/gone' => 410]);
    Log::spy();
    $user = User::factory()->admin()->createOne();
    $user->updatePushSubscription('https://push.example.com/send/gone', 'p256dh', 'auth', 'aes128gcm');
    $user->updatePushSubscription('https://push.example.com/send/phone', 'p256dh', 'auth', 'aes128gcm');

    $user->notify(new BookingCheckedInNotification(checkedInBooking()));

    expect($user->pushSubscriptions()->pluck('endpoint')->all())->toBe(['https://push.example.com/send/phone']);
    Log::shouldHaveReceived('warning')->withArgs(fn ($message, $context) => $message === 'Web push failed'
        && $context['status'] === 410
        && $context['expired_and_removed'] === true);
});
