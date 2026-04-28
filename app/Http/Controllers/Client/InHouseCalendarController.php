<?php

namespace App\Http\Controllers\Client;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Carbon\CarbonImmutable;
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

        $bookings = Booking::query()
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

        return Inertia::render('bookings/calendar', [
            'month' => $monthStart->format('Y-m'),
            'bookings' => $bookings,
        ]);
    }
}

