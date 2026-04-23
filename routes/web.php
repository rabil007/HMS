<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\HotelController;
use App\Http\Controllers\Admin\RankController;
use App\Http\Controllers\Admin\VesselController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'))->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::get('bookings/create', [BookingController::class, 'create'])->name('bookings.create');
    Route::post('bookings', [BookingController::class, 'store'])->name('bookings.store');

    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('hotels', HotelController::class)->except(['show']);
        Route::resource('clients', ClientController::class)->except(['show']);
        Route::resource('ranks', RankController::class)->except(['show']);
        Route::resource('vessels', VesselController::class)->except(['show']);
    });
});

require __DIR__.'/settings.php';
