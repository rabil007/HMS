<?php

namespace App\Http\Controllers\Client;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InHouseCalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user && $user->role === Role::Client, 403);

        $monthStart = CarbonImmutable::now()->startOfMonth();
        $monthEnd = $monthStart->endOfMonth()->endOfDay();
        $monthEndDate = $monthStart->endOfMonth();

        $inHouseBookings = Booking::query()
            ->where('user_id', $user->id)
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNotNull('guest_check_in')
            ->where('guest_check_in', '<=', $monthEnd)
            ->where(function ($query) use ($monthStart) {
                $query
                    ->whereNull('guest_check_out')
                    ->orWhere('guest_check_out', '>', $monthStart);
            })
            ->with(['hotel:id,name', 'rank:id,name', 'vessel:id,name'])
            ->orderBy('guest_check_in')
            ->get()
            ->map(function (Booking $booking) {
                return [
                    'id' => $booking->id,
                    'public_id' => $booking->public_id,
                    'hotel' => [
                        'id' => $booking->hotel?->id,
                        'name' => $booking->hotel?->name,
                    ],
                    'guest_name' => $booking->guest_name,
                    'rank' => $booking->rank?->name,
                    'vessel' => $booking->vessel?->name,
                    'guest_check_in' => $booking->guest_check_in?->toISOString(),
                    'guest_check_out' => $booking->guest_check_out?->toISOString(),
                ];
            })
            ->values();

        $scheduledBookings = Booking::query()
            ->where('user_id', $user->id)
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNull('guest_check_in')
            ->where(function ($query) use ($monthStart, $monthEndDate) {
                $query
                    ->where(function ($q) use ($monthStart, $monthEndDate) {
                        $q->whereNotNull('actual_check_in_date')
                            ->whereDate('actual_check_in_date', '>=', $monthStart->toDateString())
                            ->whereDate('actual_check_in_date', '<=', $monthEndDate->toDateString());
                    })
                    ->orWhere(function ($q) use ($monthStart, $monthEndDate) {
                        $q->whereNull('actual_check_in_date')
                            ->whereDate('check_in_date', '>=', $monthStart->toDateString())
                            ->whereDate('check_in_date', '<=', $monthEndDate->toDateString());
                    });
            })
            ->with(['hotel:id,name', 'rank:id,name', 'vessel:id,name'])
            ->orderBy('check_in_date')
            ->get()
            ->map(function (Booking $booking) {
                $checkIn = $booking->actual_check_in_date ?? $booking->check_in_date;
                $checkOut = $booking->actual_check_out_date ?? $booking->check_out_date;

                $checkInDate = $checkIn instanceof CarbonInterface
                    ? $checkIn->toDateString()
                    : (is_string($checkIn) ? $checkIn : null);

                $checkOutDate = $checkOut instanceof CarbonInterface
                    ? $checkOut->toDateString()
                    : (is_string($checkOut) ? $checkOut : null);

                return [
                    'id' => $booking->id,
                    'public_id' => $booking->public_id,
                    'hotel' => [
                        'id' => $booking->hotel?->id,
                        'name' => $booking->hotel?->name,
                    ],
                    'guest_name' => $booking->guest_name,
                    'rank' => $booking->rank?->name,
                    'vessel' => $booking->vessel?->name,
                    'check_in_date' => $checkInDate,
                    'check_out_date' => $checkOutDate,
                ];
            })
            ->values();

        return Inertia::render('bookings/calendar', [
            'month' => $monthStart->format('Y-m'),
            'inHouseBookings' => $inHouseBookings,
            'scheduledBookings' => $scheduledBookings,
        ]);
    }
}

