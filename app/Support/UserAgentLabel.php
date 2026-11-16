<?php

namespace App\Support;

/**
 * Turns a browser user agent into a short, human label such as "Chrome on Android".
 * Deliberately small: it only needs to tell a user's own devices apart.
 */
class UserAgentLabel
{
    /**
     * @return array{browser: string, platform: string}
     */
    public static function describe(?string $userAgent): array
    {
        $ua = (string) $userAgent;

        return [
            'browser' => self::browser($ua),
            'platform' => self::platform($ua),
        ];
    }

    private static function browser(string $ua): string
    {
        return match (true) {
            $ua === '' => 'Unknown browser',
            str_contains($ua, 'Edg/') || str_contains($ua, 'EdgA/') || str_contains($ua, 'EdgiOS/') => 'Edge',
            str_contains($ua, 'OPR/') || str_contains($ua, 'Opera') => 'Opera',
            str_contains($ua, 'SamsungBrowser/') => 'Samsung Internet',
            str_contains($ua, 'Firefox/') || str_contains($ua, 'FxiOS/') => 'Firefox',
            str_contains($ua, 'CriOS/') || str_contains($ua, 'Chrome/') => 'Chrome',
            str_contains($ua, 'Safari/') || str_contains($ua, 'AppleWebKit/') => 'Safari',
            default => 'Unknown browser',
        };
    }

    private static function platform(string $ua): string
    {
        return match (true) {
            $ua === '' => 'Unknown device',
            str_contains($ua, 'iPhone') => 'iPhone',
            str_contains($ua, 'iPad') => 'iPad',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Mac OS X') || str_contains($ua, 'Macintosh') => 'Mac',
            str_contains($ua, 'CrOS') => 'ChromeOS',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'Unknown device',
        };
    }
}
