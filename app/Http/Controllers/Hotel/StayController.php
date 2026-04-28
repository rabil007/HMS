<?php

namespace App\Http\Controllers\Hotel;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hotel\CheckInBookingRequest;
use App\Http\Requests\Hotel\CheckOutBookingRequest;
use App\Models\Booking;
use App\Services\BookingIndexQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class StayController extends Controller
{
    public function __construct(
        private BookingIndexQuery $bookingIndexQuery
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $q = $request->string('q')->trim()->toString();
        $tab = $request->string('tab')->toString() ?: 'to_checkin';
        $filters = (array) $request->input('filters', []);
        $perPage = $this->bookingIndexQuery->perPage($request);

        $base = Booking::query()
            ->where('hotel_id', $user->hotel_id)
            ->where('status', BookingStatus::Confirmed->value)
            ->with([
                'user:id,name,email,client_id',
                'client:id,name',
                'rank:id,name',
                'vessel:id,name',
            ])
            ->when(($filters['client_id'] ?? null) !== null && $filters['client_id'] !== '', fn (Builder $query) => $query->where('client_id', $filters['client_id']));

        $base = $this->bookingIndexQuery->applyTextSearch(
            $base,
            $q,
            [
                'public_id',
                'guest_name',
                'guest_email',
                'guest_phone',
                'confirmation_number',
            ],
            true
        );

        $countsQuery = clone $base;

        $counts = [
            'to_checkin' => (clone $countsQuery)->whereNull('guest_check_in')->count(),
            'in_house' => (clone $countsQuery)
                ->whereNotNull('guest_check_in')
                ->whereNull('guest_check_out')
                ->count(),
            'checked_out' => (clone $countsQuery)->whereNotNull('guest_check_out')->count(),
            'total' => (clone $countsQuery)->count(),
        ];

        $base = match ($tab) {
            'in_house' => $base->whereNotNull('guest_check_in')->whereNull('guest_check_out'),
            'checked_out' => $base->whereNotNull('guest_check_out'),
            default => $base->whereNull('guest_check_in'),
        };

        $bookings = $base
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('hotel/stays/index', [
            'bookings' => $bookings,
            'filters' => [
                'q' => $q,
                'tab' => in_array($tab, ['to_checkin', 'in_house', 'checked_out'], true) ? $tab : 'to_checkin',
                'column' => $filters,
                'per_page' => $perPage,
            ],
            'counts' => $counts,
        ]);
    }

    public function show(Request $request, Booking $booking)
    {
        $this->authorize('view', $booking);

        $booking->load([
            'hotel:id,name',
            'user:id,name,email,client_id',
            'client:id,name',
            'rank:id,name',
            'vessel:id,name',
        ]);

        return Inertia::render('hotel/stays/show', [
            'booking' => $booking,
        ]);
    }

    public function checkIn(CheckInBookingRequest $request, Booking $booking)
    {
        $this->authorize('update', $booking);

        if ($booking->status->value !== BookingStatus::Confirmed->value) {
            return redirect()->route('hotel.stays.index')->with('error', 'Only confirmed bookings can be checked in.');
        }

        if ($booking->guest_check_in !== null) {
            return redirect()->route('hotel.stays.show', $booking)->with('error', 'Booking already checked in.');
        }

        if ($request->validated('confirmation_number') !== $booking->confirmation_number) {
            return back()->withErrors(['confirmation_number' => 'Confirmation number does not match.']);
        }

        $raw = (string) $request->validated('guest_check_in');
        $checkInAt = preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)
            ? Carbon::parse($raw)->setTimeFromTimeString(now()->format('H:i:s'))
            : Carbon::parse($raw);

        $booking->update([
            'guest_check_in' => $checkInAt,
        ]);

        return redirect()->route('hotel.stays.show', $booking)->with('success', 'Guest checked in.');
    }

    public function checkOut(CheckOutBookingRequest $request, Booking $booking)
    {
        $this->authorize('update', $booking);

        if ($booking->status->value !== BookingStatus::Confirmed->value) {
            return redirect()->route('hotel.stays.index')->with('error', 'Only confirmed bookings can be checked out.');
        }

        if ($booking->guest_check_in === null) {
            return redirect()->route('hotel.stays.show', $booking)->with('error', 'Guest must be checked in first.');
        }

        if ($booking->guest_check_out !== null) {
            return redirect()->route('hotel.stays.show', $booking)->with('error', 'Booking already checked out.');
        }

        $raw = (string) $request->validated('guest_check_out');
        $checkOutAt = preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)
            ? Carbon::parse($raw)->setTimeFromTimeString(now()->format('H:i:s'))
            : Carbon::parse($raw);

        if ($booking->guest_check_in !== null && $checkOutAt->lessThan($booking->guest_check_in)) {
            return back()->withErrors(['guest_check_out' => 'Check-out must be after check-in.']);
        }

        $booking->update([
            'guest_check_out' => $checkOutAt,
        ]);

        return redirect()->route('hotel.stays.show', $booking)->with('success', 'Guest checked out.');
    }
}
