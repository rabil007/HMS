<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('bookings', [\App\Http\Controllers\BookingController::class, 'index'])->name('bookings.index');
    Route::get('bookings/create', [\App\Http\Controllers\BookingController::class, 'create'])->name('bookings.create');
    Route::post('bookings', [\App\Http\Controllers\BookingController::class, 'store'])->name('bookings.store');
});

require __DIR__.'/settings.php';
