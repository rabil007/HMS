<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\MessageSentReport;
use NotificationChannels\WebPush\Events\NotificationFailed;
use NotificationChannels\WebPush\Events\NotificationSent;
use NotificationChannels\WebPush\PushSubscription;

/**
 * Without this, a push the browser's push service rejects fails silently.
 * Failures are logged with the reason, and devices that receive a push are
 * marked as recently used in Settings → Notifications.
 */
class WebPushReportLogger
{
    public function sent(NotificationSent $event): void
    {
        $this->touch($event->subscription);
    }

    public function failed(NotificationFailed $event): void
    {
        $this->logFailure($event->report, $event->subscription);
    }

    public function logFailure(MessageSentReport $report, ?PushSubscription $subscription = null, string $context = 'notification'): void
    {
        $response = $report->getResponse();

        Log::warning('Web push failed', [
            'context' => $context,
            'user_id' => $subscription?->subscribable_id,
            'subscription_id' => $subscription?->id,
            'push_service' => parse_url($report->getEndpoint(), PHP_URL_HOST),
            'status' => $response?->getStatusCode(),
            'reason' => $report->getReason(),
            'response' => $response ? mb_substr((string) $response->getBody(), 0, 300) : null,
            'expired_and_removed' => $report->isSubscriptionExpired(),
        ]);
    }

    public function touch(?PushSubscription $subscription): void
    {
        if ($subscription?->exists) {
            $subscription->forceFill(['last_used_at' => now()])->saveQuietly();
        }
    }
}
