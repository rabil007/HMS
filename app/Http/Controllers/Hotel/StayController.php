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
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
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

        $countsRow = (clone $base)
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when guest_check_in is null then 1 else 0 end) as to_checkin')
            ->selectRaw('sum(case when guest_check_in is not null and guest_check_out is null then 1 else 0 end) as in_house')
            ->selectRaw('sum(case when guest_check_out is not null then 1 else 0 end) as checked_out')
            ->first();

        $counts = [
            'to_checkin' => (int) ($countsRow?->to_checkin ?? 0),
            'in_house' => (int) ($countsRow?->in_house ?? 0),
            'checked_out' => (int) ($countsRow?->checked_out ?? 0),
            'total' => (int) ($countsRow?->total ?? 0),
        ];

        $base = match ($tab) {
            'in_house' => $base->whereNotNull('guest_check_in')->whereNull('guest_check_out'),
            'checked_out' => $base->whereNotNull('guest_check_out'),
            default => $base->whereNull('guest_check_in'),
        };

        $allowedSorts = [
            'created_at' => 'created_at',
            'check_in_date' => 'check_in_date',
            'guest_check_in' => 'guest_check_in',
        ];
        $sort = array_key_exists($sort, $allowedSorts) ? $sort : 'created_at';

        $bookings = $base
            ->orderBy($allowedSorts[$sort], $dir)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('hotel/stays/index', [
            'bookings' => $bookings,
            'filters' => [
                'q' => $q,
                'tab' => in_array($tab, ['to_checkin', 'in_house', 'checked_out'], true) ? $tab : 'to_checkin',
                'column' => $filters,
                'sort' => $sort,
                'dir' => $dir,
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
