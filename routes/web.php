<?php

use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\HotelController;
use App\Http\Controllers\Admin\RankController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VesselController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Hotel\BookingInboxController;
use App\Http\Controllers\OverviewController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'))->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('overview', OverviewController::class)->name('overview');

    Route::middleware(['role:client,admin'])->group(function () {
        Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
        Route::get('bookings/export/{format}', [BookingController::class, 'export'])->name('bookings.export');
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
    });

    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', UserController::class);
        Route::resource('hotels', HotelController::class);
        Route::resource('clients', ClientController::class);
        Route::resource('ranks', RankController::class);
        Route::resource('vessels', VesselController::class);
    });
});

require __DIR__.'/settings.php';
