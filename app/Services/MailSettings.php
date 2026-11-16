<?php

namespace App\Services;

use App\Models\AppSetting;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Outgoing mail server settings that admins edit in Settings → Email.
 *
 * Saved values live in app_settings and override the MAIL_* values from .env.
 * When nothing is saved, the .env values are used as before. The SMTP password
 * is stored encrypted with APP_KEY and is never sent back to the browser.
 */
class MailSettings
{
    public const KEY = 'mail_configuration';

    public const MAILERS = ['smtp', 'sendmail', 'log'];

    public const ENCRYPTIONS = ['tls', 'ssl', 'none'];

    /**
     * The mail config as it came from config/mail.php (.env), captured before
     * any saved settings were applied (this class is a singleton), so a reset can fall back to it.
     *
     * @var array<string, mixed>|null
     */
    private ?array $original = null;

    /**
     * The saved settings, or null when the .env values are in use.
     *
     * @return array<string, mixed>|null
     */
    public function saved(): ?array
    {
        try {
            $value = AppSetting::query()->where('key', self::KEY)->value('value');
        } catch (Throwable) {
            // Database not migrated or unreachable: keep the .env values.
            return null;
        }

        if (is_string($value)) {
            $value = json_decode($value, true);
        }

        return is_array($value) ? $value : null;
    }

    /**
     * What the form should show: the effective settings, without the password.
     *
     * @return array<string, mixed>
     */
    public function forForm(): array
    {
        $saved = $this->saved();
        $original = $this->original();

        if ($saved === null) {
            $smtp = (array) ($original['mailers']['smtp'] ?? []);

            return [
                'source' => 'env',
                'mailer' => in_array($original['default'] ?? null, self::MAILERS, true) ? $original['default'] : 'smtp',
                'host' => (string) ($smtp['host'] ?? ''),
                'port' => $smtp['port'] ?? null,
                'username' => (string) ($smtp['username'] ?? ''),
                'encryption' => $this->encryptionFromScheme($smtp['scheme'] ?? null, $smtp['port'] ?? null),
                'from_address' => (string) ($original['from']['address'] ?? ''),
                'from_name' => (string) ($original['from']['name'] ?? ''),
                'password_set' => filled($smtp['password'] ?? null),
            ];
        }

        return [
            'source' => 'database',
            'mailer' => $saved['mailer'] ?? 'smtp',
            'host' => (string) ($saved['host'] ?? ''),
            'port' => $saved['port'] ?? null,
            'username' => (string) ($saved['username'] ?? ''),
            'encryption' => $saved['encryption'] ?? 'tls',
            'from_address' => (string) ($saved['from_address'] ?? ''),
            'from_name' => (string) ($saved['from_name'] ?? ''),
            'password_set' => filled($saved['password'] ?? null) || filled($original['mailers']['smtp']['password'] ?? null),
        ];
    }

    /**
     * Save the settings. A blank password keeps the one already saved.
     *
     * @param  array<string, mixed>  $data
     */
    public function save(array $data): void
    {
        $previous = $this->saved();

        $password = $previous['password'] ?? null;

        if (filled($data['password'] ?? null)) {
            $password = Crypt::encryptString((string) $data['password']);
        }

        AppSetting::query()->updateOrCreate(
            ['key' => self::KEY],
            ['value' => [
                'mailer' => $data['mailer'],
                'host' => $data['host'] ?? null,
                'port' => isset($data['port']) && $data['port'] !== '' ? (int) $data['port'] : null,
                'username' => $data['username'] ?? null,
                'password' => $password,
                'encryption' => $data['encryption'] ?? 'tls',
                'from_address' => $data['from_address'],
                'from_name' => $data['from_name'] ?? null,
            ]]
        );

        $this->apply(refreshMailers: true);
    }

    /**
     * Forget the saved settings and go back to the .env values.
     */
    public function reset(): void
    {
        AppSetting::query()->where('key', self::KEY)->delete();

        $this->apply(refreshMailers: true);
    }

    /**
     * Put the saved settings (or the .env values) into the mail config.
     */
    public function apply(bool $refreshMailers = false): void
    {
        $original = $this->original();
        $saved = $this->saved();

        config(['mail' => $original]);

        if ($saved !== null) {
            $smtp = (array) ($original['mailers']['smtp'] ?? []);
            $encryption = $saved['encryption'] ?? 'tls';

            $smtp['url'] = null;
            $smtp['host'] = $saved['host'] ?? $smtp['host'] ?? null;
            $smtp['port'] = $saved['port'] ?? $smtp['port'] ?? null;
            $smtp['username'] = $saved['username'] ?? null;
            $smtp['password'] = $this->decryptPassword($saved['password'] ?? null) ?? ($smtp['password'] ?? null);
            $smtp['scheme'] = $encryption === 'ssl' ? 'smtps' : 'smtp';
            $smtp['auto_tls'] = $encryption !== 'none';

            config([
                'mail.default' => $saved['mailer'] ?? 'smtp',
                'mail.mailers.smtp' => $smtp,
                'mail.from.address' => $saved['from_address'] ?? ($original['from']['address'] ?? null),
                'mail.from.name' => filled($saved['from_name'] ?? null) ? $saved['from_name'] : ($original['from']['name'] ?? null),
            ]);
        }

        if ($refreshMailers && app()->resolved('mail.manager')) {
            app('mail.manager')->forgetMailers();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function original(): array
    {
        return $this->original ??= (array) config('mail');
    }

    private function decryptPassword(?string $encrypted): ?string
    {
        if (blank($encrypted)) {
            return null;
        }

        try {
            return Crypt::decryptString($encrypted);
        } catch (DecryptException) {
            Log::warning('The saved mail password could not be decrypted (was APP_KEY changed?). Using the .env password instead.');

            return null;
        }
    }

    private function encryptionFromScheme(?string $scheme, mixed $port): string
    {
        if ($scheme === 'smtps' || (int) $port === 465) {
            return 'ssl';
        }

        return 'tls';
    }
}
