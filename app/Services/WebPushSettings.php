<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\User;

class WebPushSettings
{
    private const PROMPT_DISMISSED_KEY_PREFIX = 'push_prompt_dismissed_user_';

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

    /**
     * Whether the user tapped "Skip" on the dashboard prompt (remembered on every device).
     */
    public function promptDismissed(User $user): bool
    {
        return AppSetting::query()->where('key', self::PROMPT_DISMISSED_KEY_PREFIX.$user->id)->exists();
    }

    public function dismissPrompt(User $user): void
    {
        AppSetting::query()->updateOrCreate(
            ['key' => self::PROMPT_DISMISSED_KEY_PREFIX.$user->id],
            ['value' => ['dismissed_at' => now()->toISOString()]]
        );
    }
}
