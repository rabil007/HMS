<?php

namespace App\Notifications\Concerns;

use App\Services\EmailSettings;
use App\Services\WebPushSettings;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * Shared delivery channels for booking notifications: the in-app bell (database),
 * optional email, and web push for users who turned it on in their browser.
 */
trait BookingNotificationChannels
{
    /**
     * Whether this notification should also be emailed (when emails are enabled).
     */
    protected function sendsMail(): bool
    {
        return true;
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($this->sendsMail() && app(EmailSettings::class)->enabled()) {
            $channels[] = 'mail';
        }

        if (app(WebPushSettings::class)->shouldPush($notifiable)) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    /**
     * Queue connection per channel. The bell is written right away and web push
     * is sent just after the response (the "deferred" connection), so neither
     * depends on a queue worker running on the server. Email keeps the default
     * queue because SMTP can be slow.
     *
     * @return array<string, string>
     */
    public function viaConnections(): array
    {
        return [
            'database' => 'sync',
            WebPushChannel::class => (string) config('webpush.queue_connection', 'deferred'),
        ];
    }

    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $data = $this->toArray($notifiable);

        $url = (string) ($data['url'] ?? '/notifications-center');

        return (new WebPushMessage)
            ->title((string) ($data['title'] ?? config('app.name')))
            ->body((string) ($data['body'] ?? ''))
            ->icon('/apple-touch-icon.png')
            ->badge('/favicon.png')
            ->tag(($data['type'] ?? 'booking').'-'.($data['booking_id'] ?? ''))
            ->data(['url' => url($url)])
            ->options(['TTL' => 86400, 'urgency' => 'high']);
    }
}
