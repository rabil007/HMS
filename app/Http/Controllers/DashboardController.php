<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $today = now()->toDateString();

        $pendingInboxCount = null;
        if ($user->role === Role::Hotel && $user->hotel_id) {
            $pendingInboxCount = Booking::query()
                ->where('hotel_id', $user->hotel_id)
                ->where('status', BookingStatus::Pending->value)
                ->count();
        }

        $pendingBookingsCount = null;
        if ($user->role === Role::Client) {
            $pendingBookingsCount = Booking::query()
                ->where('user_id', $user->id)
                ->where('status', BookingStatus::Pending->value)
                ->whereDate('check_in_date', $today)
                ->count();
        }
        if ($user->role === Role::Admin) {
            $pendingBookingsCount = Booking::query()
                ->where('status', BookingStatus::Pending->value)
                ->whereDate('check_in_date', $today)
                ->count();
        }

        return Inertia::render('dashboard', [
            'pendingInboxCount' => $pendingInboxCount,
            'pendingBookingsCount' => $pendingBookingsCount,
        ]);
    }
}
