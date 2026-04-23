<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\Role\ClientController;
use App\Http\Controllers\Role\RankController;
use App\Http\Controllers\Role\VesselController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'))->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::get('bookings/create', [BookingController::class, 'create'])->name('bookings.create');
    Route::post('bookings', [BookingController::class, 'store'])->name('bookings.store');

    Route::middleware(['role:admin'])->prefix('role')->name('role.')->group(function () {
        Route::inertia('/', 'role/index')->name('index');
        Route::resource('clients', ClientController::class)->except(['show']);
        Route::resource('ranks', RankController::class)->except(['show']);
        Route::resource('vessels', VesselController::class)->except(['show']);
    });
});

require __DIR__.'/settings.php';
