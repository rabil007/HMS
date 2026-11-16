<?php

use App\Enums\Role;
use App\Models\AppSetting;
use App\Models\User;
use App\Services\MailSettings;

use function Pest\Laravel\actingAs;

function validMailSettings(array $overrides = []): array
{
    return array_merge([
        'mailer' => 'smtp',
        'host' => 'smtp.example.com',
        'port' => 587,
        'username' => 'bookings@example.com',
        'password' => 'super-secret',
        'encryption' => 'tls',
        'from_address' => 'bookings@example.com',
        'from_name' => 'Harbour Bookings',
    ], $overrides);
}

test('admins see the email settings page with the .env values when nothing is saved', function () {
    config(['mail.mailers.smtp.host' => 'env-host.example.com', 'mail.mailers.smtp.password' => 'env-secret']);
    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->get(route('email-settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/email')
            ->where('emailNotificationsEnabled', true)
            ->where('mailSettings.source', 'env')
            ->where('mailSettings.host', 'env-host.example.com')
            ->where('mailSettings.password_set', true)
            ->missing('mailSettings.password'));
});

test('non-admins cannot see or change email settings', function () {
    $client = User::factory()->create(['role' => Role::Client->value]);

    actingAs($client)->get(route('email-settings.edit'))->assertForbidden();
    actingAs($client)->put(route('email-settings.update'), validMailSettings())->assertForbidden();
    actingAs($client)->delete(route('email-settings.destroy'))->assertForbidden();
    actingAs($client)->post(route('email-settings.test'))->assertForbidden();

    expect(AppSetting::query()->where('key', MailSettings::KEY)->exists())->toBeFalse();
});

test('saved settings are used for mail, with the password encrypted and never shown', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->put(route('email-settings.update'), validMailSettings())
        ->assertRedirect()
        ->assertSessionHas('success', 'Email settings saved.');

    $stored = AppSetting::query()->where('key', MailSettings::KEY)->first();
    expect(json_encode($stored->value))->not->toContain('super-secret');

    app(MailSettings::class)->apply();
    expect(config('mail.default'))->toBe('smtp');
    expect(config('mail.mailers.smtp.host'))->toBe('smtp.example.com');
    expect(config('mail.mailers.smtp.port'))->toBe(587);
    expect(config('mail.mailers.smtp.password'))->toBe('super-secret');
    expect(config('mail.mailers.smtp.scheme'))->toBe('smtp');
    expect(config('mail.from.address'))->toBe('bookings@example.com');
    expect(config('mail.from.name'))->toBe('Harbour Bookings');

    actingAs($admin)
        ->get(route('email-settings.edit'))
        ->assertInertia(fn ($page) => $page
            ->where('mailSettings.source', 'database')
            ->where('mailSettings.password_set', true)
            ->missing('mailSettings.password'))
        ->assertDontSee('super-secret');
});

test('a blank password keeps the saved one', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin)->put(route('email-settings.update'), validMailSettings());
    actingAs($admin)->put(route('email-settings.update'), validMailSettings(['password' => '', 'host' => 'smtp2.example.com', 'encryption' => 'ssl', 'port' => 465]));

    app(MailSettings::class)->apply();
    expect(config('mail.mailers.smtp.host'))->toBe('smtp2.example.com');
    expect(config('mail.mailers.smtp.password'))->toBe('super-secret');
    expect(config('mail.mailers.smtp.scheme'))->toBe('smtps');
});

test('settings are validated', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->put(route('email-settings.update'), validMailSettings(['mailer' => 'carrier-pigeon', 'from_address' => 'not-an-email', 'host' => '', 'port' => 99999]))
        ->assertSessionHasErrors(['mailer', 'from_address']);

    actingAs($admin)
        ->put(route('email-settings.update'), validMailSettings(['host' => '', 'port' => 99999]))
        ->assertSessionHasErrors(['host', 'port']);

    // Host and port are not needed for the log driver.
    actingAs($admin)
        ->put(route('email-settings.update'), validMailSettings(['mailer' => 'log', 'host' => '', 'port' => '']))
        ->assertSessionHasNoErrors();
});

test('resetting goes back to the .env values', function () {
    config(['mail.mailers.smtp.host' => 'env-host.example.com']);
    $admin = User::factory()->admin()->create();

    actingAs($admin)->put(route('email-settings.update'), validMailSettings());
    app(MailSettings::class)->apply();
    expect(config('mail.mailers.smtp.host'))->toBe('smtp.example.com');

    actingAs($admin)
        ->delete(route('email-settings.destroy'))
        ->assertSessionHas('success');

    expect(config('mail.mailers.smtp.host'))->toBe('env-host.example.com');
    expect(config('mail.default'))->toBe('array');
});

test('admins can send a test email', function () {
    $admin = User::factory()->admin()->create(['email' => 'admin@example.com']);

    actingAs($admin)
        ->post(route('email-settings.test'))
        ->assertRedirect()
        ->assertSessionHas('success', 'Test email sent to admin@example.com.');

    $messages = app('mail.manager')->mailer('array')->getSymfonyTransport()->messages();
    expect($messages)->toHaveCount(1);
    expect($messages->first()->getOriginalMessage()->getTo()[0]->getAddress())->toBe('admin@example.com');

    actingAs($admin)
        ->post(route('email-settings.test'), ['to' => 'someone@example.com'])
        ->assertSessionHas('success', 'Test email sent to someone@example.com.');
});

test('a failing test email shows the error', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin)->put(route('email-settings.update'), validMailSettings([
        'host' => '127.0.0.1',
        'port' => 1,
        'encryption' => 'none',
    ]));

    actingAs($admin)
        ->post(route('email-settings.test'))
        ->assertRedirect()
        ->assertSessionHas('error', fn ($error) => str_starts_with($error, 'Test email failed:'));
});

test('saved settings are applied as soon as the mailer is first used', function () {
    $admin = User::factory()->admin()->create();
    actingAs($admin)->put(route('email-settings.update'), validMailSettings(['host' => 'first-use.example.com']));

    config(['mail.mailers.smtp.host' => 'something-else']);
    app()->forgetInstance('mail.manager');
    app('mail.manager');

    expect(config('mail.mailers.smtp.host'))->toBe('first-use.example.com');
});
