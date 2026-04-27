<?php

namespace App\Services;

use App\Models\AppSetting;

class EmailSettings
{
    public const KEY_ENABLED = 'email_notifications_enabled';

    public function enabled(): bool
    {
        $row = AppSetting::query()->where('key', self::KEY_ENABLED)->first();
        $value = $row?->value;

        if (is_array($value) && array_key_exists('enabled', $value)) {
            return (bool) $value['enabled'];
        }

        return true;
    }

    public function setEnabled(bool $enabled): void
    {
        AppSetting::query()->updateOrCreate(
            ['key' => self::KEY_ENABLED],
            ['value' => ['enabled' => $enabled]]
        );
    }
}

