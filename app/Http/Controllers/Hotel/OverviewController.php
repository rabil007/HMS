<?php

namespace App\Http\Controllers\Hotel;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OverviewController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $hotelId = $user->hotel_id;
        $today = now()->toDateString();

        $base = Booking::query()
            ->where('hotel_id', $hotelId)
            ->where('status', BookingStatus::Confirmed->value);

        $pendingInbox = Booking::query()
            ->where('hotel_id', $hotelId)
            ->where('status', BookingStatus::Pending->value)
            ->count();

        $totalConfirmed = (clone $base)->count();

        $currentlyInHouse = (clone $base)
            ->whereNotNull('guest_check_in')
            ->whereNull('guest_check_out')
            ->count();

        $dueCheckinToday = (clone $base)
            ->whereNull('guest_check_in')
            ->whereDate('check_in_date', $today)
            ->count();

        $dueCheckoutToday = (clone $base)
            ->whereNotNull('guest_check_in')
            ->whereNull('guest_check_out')
            ->whereDate('check_out_date', $today)
            ->count();

        $checkedInToday = (clone $base)
            ->whereNotNull('guest_check_in')
            ->whereDate('guest_check_in', $today)
            ->count();

        $checkedOutToday = (clone $base)
            ->whereNotNull('guest_check_out')
            ->whereDate('guest_check_out', $today)
            ->count();

        $overstays = (clone $base)
            ->whereNotNull('guest_check_in')
            ->whereNull('guest_check_out')
            ->whereNotNull('check_out_date')
            ->whereDate('check_out_date', '<', $today)
            ->count();

        $inHouseNoRoom = (clone $base)
            ->whereNotNull('guest_check_in')
            ->whereNull('guest_check_out')
            ->whereNull('room_number')
            ->count();

        $completedThisMonth = (clone $base)
            ->whereNotNull('guest_check_out')
            ->whereMonth('guest_check_out', now()->month)
            ->whereYear('guest_check_out', now()->year)
            ->count();

        $avgStay = (clone $base)
            ->whereNotNull('guest_check_in')
            ->whereNotNull('guest_check_out')
            ->selectRaw('AVG(TIMESTAMPDIFF(DAY, DATE(guest_check_in), DATE(guest_check_out))) as avg_nights')
            ->value('avg_nights');

        $recentCheckins = (clone $base)
            ->with(['guest:id,full_name', 'vessel:id,name', 'rank:id,name'])
            ->whereNotNull('guest_check_in')
            ->whereNull('guest_check_out')
            ->orderByDesc('guest_check_in')
            ->limit(8)
            ->get(['id', 'guest_id', 'vessel_id', 'rank_id', 'room_number', 'guest_check_in', 'check_out_date', 'confirmation_number']);

        $upcomingCheckins = (clone $base)
            ->with(['guest:id,full_name', 'vessel:id,name'])
            ->whereNull('guest_check_in')
            ->where('check_in_date', '>=', $today)
            ->orderBy('check_in_date')
            ->limit(8)
            ->get(['id', 'guest_id', 'vessel_id', 'check_in_date', 'check_out_date', 'room_number']);

        return Inertia::render('hotel/overview', [
            'stats' => [
                'pending_inbox' => $pendingInbox,
                'total_confirmed' => $totalConfirmed,
                'currently_in_house' => $currentlyInHouse,
                'due_checkin_today' => $dueCheckinToday,
                'due_checkout_today' => $dueCheckoutToday,
                'checked_in_today' => $checkedInToday,
                'checked_out_today' => $checkedOutToday,
                'overstays' => $overstays,
                'in_house_no_room' => $inHouseNoRoom,
                'completed_this_month' => $completedThisMonth,
                'avg_stay_nights' => $avgStay !== null ? round((float) $avgStay, 1) : null,
            ],
            'recent_in_house' => $recentCheckins,
            'upcoming_checkins' => $upcomingCheckins,
            'today' => $today,
        ]);
    }
}
