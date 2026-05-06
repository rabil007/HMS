<?php

namespace App\Http\Controllers\Client;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InHouseCalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user && $user->role === Role::Client, 403);

        $monthInput = $request->string('month')->toString();
        $monthStart = $this->resolveMonthStart($monthInput);
        $monthEnd = $monthStart->endOfMonth()->endOfDay();
        $monthEndDate = $monthStart->endOfMonth();
        $today = CarbonImmutable::now()->toDateString();

        $scopedBookings = Booking::query();
        $this->applyClientScope($scopedBookings, $user);

        $inHouseBookings = (clone $scopedBookings)
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNotNull('guest_check_in')
            ->where('guest_check_in', '<=', $monthEnd)
            ->where(function ($query) use ($monthStart) {
                $query
                    ->whereNull('guest_check_out')
                    ->orWhere('guest_check_out', '>', $monthStart);
            })
            ->with(['hotel:id,name', 'rank:id,name', 'vessel:id,name', 'guest:id,full_name,email,phone'])
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
                    'room_number' => $booking->room_number,
                    'confirmation_number' => $booking->confirmation_number,
                    'guest_check_in' => $booking->guest_check_in?->toISOString(),
                    'guest_check_out' => $booking->guest_check_out?->toISOString(),
                ];
            })
            ->values();

        $scheduledBookings = (clone $scopedBookings)
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
                            ->filterCheckInRange($monthStart->toDateString(), $monthEndDate->toDateString(), Booking::DATE_MODE_SCHEDULED);
                    });
            })
            ->with(['hotel:id,name', 'rank:id,name', 'vessel:id,name', 'guest:id,full_name,email,phone'])
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
                    'room_number' => $booking->room_number,
                    'confirmation_number' => $booking->confirmation_number,
                    'check_in_date' => $checkInDate,
                    'check_out_date' => $checkOutDate,
                ];
            })
            ->values();

        $liveInHouseCount = (clone $scopedBookings)
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNotNull('guest_check_in')
            ->whereNull('guest_check_out')
            ->count();

        $dueCheckInTodayCount = (clone $scopedBookings)
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNull('guest_check_in')
            ->whereDate('check_in_date', $today)
            ->count();

        $dueCheckOutTodayCount = (clone $scopedBookings)
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNotNull('guest_check_in')
            ->whereNull('guest_check_out')
            ->whereDate('check_out_date', $today)
            ->count();

        return Inertia::render('bookings/calendar', [
            'month' => $monthStart->format('Y-m'),
            'inHouseBookings' => $inHouseBookings,
            'scheduledBookings' => $scheduledBookings,
            'liveStats' => [
                'in_house_now' => $liveInHouseCount,
                'due_check_in_today' => $dueCheckInTodayCount,
                'due_check_out_today' => $dueCheckOutTodayCount,
            ],
        ]);
    }

    private function resolveMonthStart(string $monthInput): CarbonImmutable
    {
        if (preg_match('/^\d{4}-\d{2}$/', $monthInput) === 1) {
            try {
                return CarbonImmutable::createFromFormat('Y-m', $monthInput)->startOfMonth();
            } catch (\Throwable) {
                // fall back to current month
            }
        }

        return CarbonImmutable::now()->startOfMonth();
    }

    private function applyClientScope(Builder $query, User $user): void
    {
        if ($user->client_id !== null) {
            $query->where('client_id', $user->client_id);

            return;
        }

        $query->where('user_id', $user->id);
    }
}
