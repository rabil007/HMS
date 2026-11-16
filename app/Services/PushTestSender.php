<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Minishlink\WebPush\Subscription;
use NotificationChannels\WebPush\PushSubscription;
use Throwable;

/**
 * Sends a test push right away (not queued) so the user sees at once whether
 * push works on their device, and why not if it fails.
 */
class PushTestSender
{
    public function __construct(private WebPushClientFactory $clients) {}

    /**
     * @param  Collection<int, PushSubscription>  $subscriptions
     * @return array{sent: int, failed: int, removed: int, errors: list<string>}
     */
    public function send(Collection $subscriptions): array
    {
        $webPush = $this->clients->make();

        $payload = json_encode([
            'title' => 'Test notification',
            'body' => 'Push notifications work on this device.',
            'icon' => '/apple-touch-icon.png',
            'badge' => '/favicon.png',
            'tag' => 'push-test',
            'data' => ['url' => url('/settings/notifications')],
        ]);

        $byEndpoint = $subscriptions->keyBy('endpoint');

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                new Subscription(
                    $subscription->endpoint,
                    $subscription->public_key,
                    $subscription->auth_token,
                    $subscription->content_encoding ?: 'aes128gcm',
                ),
                $payload,
                ['TTL' => 300, 'urgency' => 'high'],
            );
        }

        $result = ['sent' => 0, 'failed' => 0, 'removed' => 0, 'errors' => []];

        try {
            foreach ($webPush->flush() as $report) {
                $subscription = $byEndpoint->get($report->getEndpoint());

                if ($report->isSuccess()) {
                    $result['sent']++;
                    $subscription?->forceFill(['last_used_at' => now()])->save();

                    continue;
                }

                $result['failed']++;

                if ($report->isSubscriptionExpired()) {
                    // The browser no longer accepts pushes for this device.
                    $subscription?->delete();
                    $result['removed']++;
                    $result['errors'][] = 'A device was no longer registered with its browser and has been removed. Turn push on again on that device.';

                    continue;
                }

                $result['errors'][] = $this->describe($report->getReason());
            }
        } catch (Throwable $e) {
            report($e);
            $result['failed'] = $subscriptions->count() - $result['sent'];
            $result['errors'][] = 'The server could not send the push: '.$e->getMessage();
        }

        $result['errors'] = array_values(array_unique($result['errors']));

        return $result;
    }

    private function describe(string $reason): string
    {
        $reason = trim($reason);

        if (str_contains($reason, '403') || str_contains($reason, '401')) {
            return 'The push service refused the server keys. Check VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on the server, then turn push off and on again on this device.';
        }

        return 'The push service rejected the message: '.($reason !== '' ? $reason : 'unknown error').'.';
    }
}
