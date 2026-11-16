<?php

use App\Http\Controllers\Settings\DashboardIconSizeController;
use App\Http\Controllers\Settings\EmailNotificationsController;
use App\Http\Controllers\Settings\EmailSettingsController;
use App\Http\Controllers\Settings\NotificationSettingsController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::put('settings/dashboard-icon-size', [DashboardIconSizeController::class, 'update'])
        ->name('settings.dashboard-icon-size.update');

    Route::get('settings/notifications', [NotificationSettingsController::class, 'edit'])
        ->name('notification-settings.edit');

    Route::middleware('role:admin')->group(function () {
        Route::get('settings/email', [EmailSettingsController::class, 'edit'])->name('email-settings.edit');
        Route::put('settings/email', [EmailSettingsController::class, 'update'])->name('email-settings.update');
        Route::delete('settings/email', [EmailSettingsController::class, 'destroy'])->name('email-settings.destroy');
        Route::post('settings/email/test', [EmailSettingsController::class, 'test'])
            ->middleware('throttle:6,1')
            ->name('email-settings.test');
    });

    Route::put('settings/email-notifications', [EmailNotificationsController::class, 'update'])
        ->middleware('role:admin')
        ->name('settings.email-notifications.update');
});
