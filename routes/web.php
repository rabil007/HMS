<?php

use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\CountryController;
use App\Http\Controllers\Admin\HotelController;
use App\Http\Controllers\Admin\RankController;
use App\Http\Controllers\Admin\Reports\BookingReportController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VesselController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\Client\InHouseCalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Hotel\BookingInboxController;
use App\Http\Controllers\Hotel\QrScanController;
use App\Http\Controllers\Hotel\QrVerifyController;
use App\Http\Controllers\Hotel\StayController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\NotificationCenterController;
use App\Http\Controllers\OverviewController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'))->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('overview', OverviewController::class)->name('overview');

    Route::get('notifications', [NotificationsController::class, 'index'])->name('notifications.index');
    Route::get('notifications/unread-count', [NotificationsController::class, 'unreadCount'])->name('notifications.unreadCount');
    Route::post('notifications/{id}/read', [NotificationsController::class, 'markRead'])->name('notifications.markRead');
    Route::post('notifications/read-all', [NotificationsController::class, 'markAllRead'])->name('notifications.markAllRead');
    Route::get('notifications-center', NotificationCenterController::class)->name('notifications.center');

    Route::middleware(['role:client,admin'])->group(function () {
        Route::middleware(['role:client'])->group(function () {
            Route::get('bookings/calendar', InHouseCalendarController::class)->name('bookings.calendar');
        });

        Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
        Route::get('bookings/create', [BookingController::class, 'create'])->name('bookings.create');
        Route::post('bookings', [BookingController::class, 'store'])->name('bookings.store');
        Route::get('bookings/{booking}', [BookingController::class, 'show'])->name('bookings.show');
        Route::get('bookings/{booking}/edit', [BookingController::class, 'edit'])->name('bookings.edit');
        Route::put('bookings/{booking}', [BookingController::class, 'update'])->name('bookings.update');
        Route::delete('bookings/{booking}', [BookingController::class, 'destroy'])->name('bookings.destroy');
    });

    Route::middleware(['role:hotel', 'hotel.assigned'])->prefix('hotel')->name('hotel.')->group(function () {
        Route::get('bookings', [BookingInboxController::class, 'index'])->name('bookings.index');
        Route::get('bookings/{booking}', [BookingInboxController::class, 'show'])->name('bookings.show');
        Route::put('bookings/{booking}/approve', [BookingInboxController::class, 'approve'])->name('bookings.approve');
        Route::put('bookings/{booking}/reject', [BookingInboxController::class, 'reject'])->name('bookings.reject');

        Route::get('scan', QrScanController::class)->name('scan');
        Route::get('scan/verify', QrVerifyController::class)->name('scan.verify');

        Route::get('stays', [StayController::class, 'index'])->name('stays.index');
        Route::get('stays/{booking}', [StayController::class, 'show'])->name('stays.show');
        Route::put('stays/{booking}/check-in', [StayController::class, 'checkIn'])->name('stays.checkIn');
        Route::put('stays/{booking}/check-out', [StayController::class, 'checkOut'])->name('stays.checkOut');
    });

    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', UserController::class);
        Route::resource('hotels', HotelController::class);
        Route::resource('clients', ClientController::class);
        Route::resource('countries', CountryController::class);
        Route::resource('ranks', RankController::class);
        Route::resource('vessels', VesselController::class);

        Route::get('reports/bookings', [BookingReportController::class, 'index'])->name('reports.bookings.index');
        Route::get('reports/bookings/export', [BookingReportController::class, 'export'])->name('reports.bookings.export');
    });
});

require __DIR__.'/settings.php';
