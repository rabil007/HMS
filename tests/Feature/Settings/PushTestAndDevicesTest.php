<?php

use App\Enums\Role;
use App\Models\User;
use App\Services\WebPushClientFactory;
use App\Support\UserAgentLabel;
use GuzzleHttp\Psr7\Request as Psr7Request;
use GuzzleHttp\Psr7\Response as Psr7Response;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\WebPush;

use function Pest\Laravel\actingAs;

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const MAC_CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

function enableVapid(): void
{
    config([
        'webpush.vapid.public_key' => 'BPublicKeyForTests',
        'webpush.vapid.private_key' => 'PrivateKeyForTests',
    ]);
}

function addDevice(User $user, string $endpoint, ?string $userAgent = MAC_CHROME_UA): void
{
    $subscription = $user->updatePushSubscription($endpoint, 'p256dh-key', 'auth-key', 'aes128gcm');
    $subscription->forceFill(['user_agent' => $userAgent, 'last_used_at' => now()->subDay()])->save();
}

/**
 * Replace the real web push client with one that records the endpoints it was
 * asked to push to and answers with the given HTTP status per endpoint.
 *
 * @param  array<string, int>  $statusByEndpoint
 * @return ArrayObject<int, string> endpoints that were pushed to
 */
function fakeWebPush(array $statusByEndpoint = []): ArrayObject
{
    $sent = new ArrayObject;

    $webPush = Mockery::mock(WebPush::class);
    $webPush->shouldReceive('queueNotification')->andReturnUsing(function ($subscription, $payload) use ($sent) {
        $sent[] = $subscription->getEndpoint();
        expect(json_decode($payload, true)['title'])->toBe('Test notification');

        return null;
    });
    $webPush->shouldReceive('flush')->andReturnUsing(function () use ($sent, $statusByEndpoint) {
        foreach ($sent as $endpoint) {
            $status = $statusByEndpoint[$endpoint] ?? 201;
            $request = new Psr7Request('POST', $endpoint);
            $response = new Psr7Response($status);

            yield new MessageSentReport($request, $response, $status < 400, $status < 400 ? 'OK' : "Push failed with {$status}");
        }
    });

    $factory = Mockery::mock(WebPushClientFactory::class);
    $factory->shouldReceive('make')->andReturn($webPush);
    app()->instance(WebPushClientFactory::class, $factory);

    return $sent;
}

test('saving a push subscription remembers the device', function () {
    enableVapid();
    $user = User::factory()->createOne();

    actingAs($user)
        ->withHeader('User-Agent', IPHONE_UA)
        ->postJson(route('push-subscriptions.store'), [
            'endpoint' => 'https://push.example.com/send/phone',
            'keys' => ['p256dh' => 'p256dh-key', 'auth' => 'auth-key'],
        ])
        ->assertOk();

    $subscription = $user->pushSubscriptions()->first();
    expect($subscription->user_agent)->toBe(IPHONE_UA);
    expect($subscription->last_used_at)->not->toBeNull();
});

test('the notifications settings page lists only the user\'s own devices', function () {
    $user = User::factory()->createOne();
    $other = User::factory()->createOne();
    addDevice($user, 'https://push.example.com/send/phone', IPHONE_UA);
    addDevice($user, 'https://push.example.com/send/laptop', MAC_CHROME_UA);
    addDevice($other, 'https://push.example.com/send/someone-else');

    actingAs($user)
        ->get(route('notification-settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/notifications')
            ->has('pushDevices', 2)
            ->where('pushDevices', fn ($devices) => collect($devices)->pluck('platform')->sort()->values()->all() === ['Mac', 'iPhone']
                && collect($devices)->pluck('endpoint')->doesntContain('https://push.example.com/send/someone-else')));
});

test('users can remove one of their devices but not someone else\'s', function () {
    $user = User::factory()->createOne();
    $other = User::factory()->createOne();
    addDevice($user, 'https://push.example.com/send/phone');
    addDevice($user, 'https://push.example.com/send/laptop');
    addDevice($other, 'https://push.example.com/send/someone-else');

    $phone = $user->pushSubscriptions()->where('endpoint', 'https://push.example.com/send/phone')->first();
    $foreign = $other->pushSubscriptions()->first();

    actingAs($user)
        ->delete(route('push-subscriptions.destroy-device', $phone->id))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($user->pushSubscriptions()->pluck('endpoint')->all())->toBe(['https://push.example.com/send/laptop']);

    actingAs($user)
        ->delete(route('push-subscriptions.destroy-device', $foreign->id))
        ->assertNotFound();

    expect($other->pushSubscriptions()->count())->toBe(1);
});

test('a test notification goes only to the current device when its endpoint is given', function () {
    enableVapid();
    $sent = fakeWebPush();
    $user = User::factory()->createOne();
    addDevice($user, 'https://push.example.com/send/phone');
    addDevice($user, 'https://push.example.com/send/laptop');

    actingAs($user)
        ->postJson(route('push-subscriptions.test'), ['endpoint' => 'https://push.example.com/send/phone'])
        ->assertOk()
        ->assertJson(['sent' => 1, 'failed' => 0])
        ->assertJsonPath('message', 'Test notification sent. It should appear in a few seconds.');

    expect($sent->getArrayCopy())->toBe(['https://push.example.com/send/phone']);
});

test('a test notification can go to all of the user\'s devices', function () {
    enableVapid();
    $sent = fakeWebPush();
    $user = User::factory()->createOne();
    $other = User::factory()->createOne();
    addDevice($user, 'https://push.example.com/send/phone');
    addDevice($user, 'https://push.example.com/send/laptop');
    addDevice($other, 'https://push.example.com/send/someone-else');

    actingAs($user)
        ->postJson(route('push-subscriptions.test'))
        ->assertOk()
        ->assertJson(['sent' => 2])
        ->assertJsonPath('message', 'Test notification sent to 2 devices.');

    expect($sent->getArrayCopy())->toEqualCanonicalizing([
        'https://push.example.com/send/phone',
        'https://push.example.com/send/laptop',
    ]);
});

test('a device the browser no longer accepts is removed and reported', function () {
    enableVapid();
    fakeWebPush(['https://push.example.com/send/old-phone' => 410]);
    $user = User::factory()->createOne();
    addDevice($user, 'https://push.example.com/send/old-phone');

    actingAs($user)
        ->postJson(route('push-subscriptions.test'))
        ->assertStatus(502)
        ->assertJson(['sent' => 0, 'failed' => 1, 'removed' => 1])
        ->assertJsonPath('message', fn ($message) => str_contains($message, 'no longer registered'));

    expect($user->pushSubscriptions()->count())->toBe(0);
});

test('a test notification explains why it cannot be sent', function () {
    $user = User::factory()->createOne();
    $other = User::factory()->createOne(['role' => Role::Client->value]);
    addDevice($other, 'https://push.example.com/send/someone-else');

    // No VAPID keys on the server.
    config(['webpush.vapid.public_key' => null, 'webpush.vapid.private_key' => null]);
    actingAs($user)->postJson(route('push-subscriptions.test'))->assertStatus(503);

    enableVapid();
    fakeWebPush();

    // No devices at all.
    actingAs($user)
        ->postJson(route('push-subscriptions.test'))
        ->assertStatus(422)
        ->assertJsonPath('message', 'You have no devices with push notifications turned on.');

    // Someone else's device cannot be targeted.
    actingAs($user)
        ->postJson(route('push-subscriptions.test'), ['endpoint' => 'https://push.example.com/send/someone-else'])
        ->assertStatus(422);
});

test('user agents become short device labels', function () {
    expect(UserAgentLabel::describe(IPHONE_UA))->toBe(['browser' => 'Safari', 'platform' => 'iPhone']);
    expect(UserAgentLabel::describe(MAC_CHROME_UA))->toBe(['browser' => 'Chrome', 'platform' => 'Mac']);
    expect(UserAgentLabel::describe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0'))
        ->toBe(['browser' => 'Edge', 'platform' => 'Windows']);
    expect(UserAgentLabel::describe('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'))
        ->toBe(['browser' => 'Chrome', 'platform' => 'Android']);
    expect(UserAgentLabel::describe(null))->toBe(['browser' => 'Unknown browser', 'platform' => 'Unknown device']);
});
