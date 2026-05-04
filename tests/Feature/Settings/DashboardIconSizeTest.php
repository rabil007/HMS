<?php

use App\Models\AppSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a verified user can update their dashboard icon size', function () {
    $user = User::factory()->createOne([
        'email_verified_at' => now(),
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('appearance.edit'))
        ->put(route('settings.dashboard-icon-size.update'), [
            'size' => 'lg',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('appearance.edit'));

    $this->assertDatabaseHas('app_settings', [
        'key' => 'dashboard_icon_size_user_'.$user->id,
    ]);

    $row = AppSetting::query()->where('key', 'dashboard_icon_size_user_'.$user->id)->firstOrFail();
    expect($row->value['size'] ?? null)->toBe('lg');

    $this
        ->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('dashboardIconSize', 'lg')
        );
});

test('dashboard icon size defaults to large when not set', function () {
    $user = User::factory()->createOne([
        'email_verified_at' => now(),
    ]);

    $this
        ->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('dashboardIconSize', 'lg')
        );
});
