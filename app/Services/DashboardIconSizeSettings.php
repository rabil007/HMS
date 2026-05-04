<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\User;

class DashboardIconSizeSettings
{
    private const KEY_PREFIX = 'dashboard_icon_size_user_';

    public function forUser(User $user): string
    {
        $row = AppSetting::query()->where('key', self::key($user))->first();
        $value = $row?->value;

        if (is_array($value) && array_key_exists('size', $value)) {
            $size = (string) $value['size'];

            if (in_array($size, ['sm', 'md', 'lg'], true)) {
                return $size;
            }
        }

        return 'lg';
    }

    public function setForUser(User $user, string $size): void
    {
        AppSetting::query()->updateOrCreate(
            ['key' => self::key($user)],
            ['value' => ['size' => $size]]
        );
    }

    private static function key(User $user): string
    {
        return self::KEY_PREFIX.$user->id;
    }
}
