<?php

namespace App\Services;

class WebPushSettings
{
    /**
     * Web push works only once the VAPID keys are set on the server.
     */
    public function configured(): bool
    {
        return filled(config('webpush.vapid.public_key')) && filled(config('webpush.vapid.private_key'));
    }

    public function publicKey(): ?string
    {
        return $this->configured() ? (string) config('webpush.vapid.public_key') : null;
    }

    /**
     * Push only to users who enabled it in at least one browser or phone.
     */
    public function shouldPush(object $notifiable): bool
    {
        if (! $this->configured() || ! method_exists($notifiable, 'pushSubscriptions')) {
            return false;
        }

        return $notifiable->pushSubscriptions()->exists();
    }
}
