<?php

use App\Enums\Role;
use App\Models\User;
use App\Services\EmailSettings;

it('lets an admin turn booking emails off and on', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('settings.email-notifications.update'), ['enabled' => false])
        ->assertRedirect()
        ->assertSessionHas('success', 'Emails disabled.');

    expect(app(EmailSettings::class)->enabled())->toBeFalse();

    $this->actingAs($admin)
        ->put(route('settings.email-notifications.update'), ['enabled' => true])
        ->assertSessionHas('success', 'Emails enabled.');

    expect(app(EmailSettings::class)->enabled())->toBeTrue();
});

it('shows admins the saved email setting on the email settings page', function () {
    $admin = User::factory()->admin()->create();
    app(EmailSettings::class)->setEnabled(false);

    $this->actingAs($admin)
        ->get(route('email-settings.edit'))
        ->assertInertia(fn ($page) => $page->where('emailNotificationsEnabled', false));
});

it('does not let non-admins change the email setting', function () {
    $client = User::factory()->create(['role' => Role::Client->value]);

    $this->actingAs($client)
        ->put(route('settings.email-notifications.update'), ['enabled' => false])
        ->assertForbidden();

    expect(app(EmailSettings::class)->enabled())->toBeTrue();
});

it('returns 404 when viewing an admin in the admin users page', function () {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)->get(route('admin.users.show', $otherAdmin))->assertNotFound();
});
