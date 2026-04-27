<?php

namespace App\Http\Controllers\Hotel;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hotel\ApproveBookingRequest;
use App\Http\Requests\Hotel\RejectBookingRequest;
use App\Models\Booking;
use App\Models\Client;
use App\Notifications\BookingApprovedNotification;
use App\Notifications\BookingRejectedNotification;
use App\Services\BookingIndexQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class BookingInboxController extends Controller
{
    public function __construct(
        private BookingIndexQuery $bookingIndexQuery
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $q = $request->string('q')->trim()->toString();
        $status = $request->string('status')->toString();
        $filters = (array) $request->input('filters', []);
        $perPage = $this->bookingIndexQuery->perPage($request);

        $allowedStatuses = [
            BookingStatus::Pending->value,
            BookingStatus::Confirmed->value,
            BookingStatus::Rejected->value,
        ];

        $base = Booking::query()
            ->where('hotel_id', $user->hotel_id)
            ->with([
                'user:id,name,email,client_id',
                'client:id,name',
                'rank:id,name',
                'vessel:id,name',
            ])
            ->when(($filters['client_id'] ?? null) !== null && $filters['client_id'] !== '', fn (Builder $query) => $query->where('client_id', $filters['client_id']))
            ->when(in_array($status, $allowedStatuses, true), fn (Builder $query) => $query->where('status', $status));

        $base = $this->bookingIndexQuery->applyTextSearch(
            $base,
            $q,
            [
                'public_id',
                'guest_name',
                'guest_email',
                'guest_phone',
                'confirmation_number',
                'remarks',
            ],
            true
        );

        $countsQuery = clone $base;

        $counts = [
            'pending' => (clone $countsQuery)->where('status', BookingStatus::Pending->value)->count(),
            'confirmed' => (clone $countsQuery)->where('status', BookingStatus::Confirmed->value)->count(),
            'rejected' => (clone $countsQuery)->where('status', BookingStatus::Rejected->value)->count(),
            'total' => (clone $countsQuery)->count(),
        ];

        $bookings = $base
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $today = Carbon::today();
        $todayStatsBase = Booking::query()->where('hotel_id', $user->hotel_id);

        $todayStats = [
            'pending' => (clone $todayStatsBase)->where('status', BookingStatus::Pending->value)->count(),
            'scheduledArrivals' => (clone $todayStatsBase)->whereDate('check_in_date', $today->toDateString())->count(),
            'actualArrivals' => (clone $todayStatsBase)->whereDate('actual_check_in_date', $today->toDateString())->count(),
            'inHouse' => (clone $todayStatsBase)
                ->whereNotNull('actual_check_in_date')
                ->whereDate('actual_check_in_date', '<=', $today->toDateString())
                ->where(function (Builder $query) use ($today) {
                    $query
                        ->whereNull('actual_check_out_date')
                        ->orWhereDate('actual_check_out_date', '>', $today->toDateString());
                })
                ->count(),
        ];

        $clientIds = Booking::query()
            ->where('hotel_id', $user->hotel_id)
            ->whereNotNull('client_id')
            ->distinct()
            ->pluck('client_id');

        $clients = Client::query()
            ->whereIn('id', $clientIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('hotel/bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'q' => $q,
                'status' => in_array($status, $allowedStatuses, true) ? $status : BookingStatus::Pending->value,
                'column' => $filters,
                'per_page' => $perPage,
            ],
            'counts' => $counts,
            'today' => $todayStats,
            'clients' => $clients,
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
            'approvedBy:id,name',
            'rejectedBy:id,name',
        ]);

        return Inertia::render('hotel/bookings/show', [
            'booking' => $booking,
        ]);
    }

    public function approve(ApproveBookingRequest $request, Booking $booking)
    {
        $this->authorize('update', $booking);

        $user = $request->user();

        if ($booking->status !== BookingStatus::Pending) {
            return redirect()->route('hotel.bookings.index')->with('error', 'Only pending bookings can be approved.');
        }

        $booking->update([
            'status' => BookingStatus::Confirmed->value,
            'confirmation_number' => $request->validated('confirmation_number'),
            'actual_check_in_date' => $request->validated('actual_check_in_date'),
            'actual_check_out_date' => $request->validated('actual_check_out_date'),
            'remarks' => $request->validated('remarks'),
            'approved_at' => now(),
            'approved_by_user_id' => $user->id,
            'rejected_at' => null,
            'rejected_by_user_id' => null,
        ]);

        $booking->user->notify(new BookingApprovedNotification($booking));

        return redirect()->route('hotel.bookings.index')->with('success', 'Booking approved.');
    }

    public function reject(RejectBookingRequest $request, Booking $booking)
    {
        $this->authorize('update', $booking);

        $user = $request->user();

        if ($booking->status !== BookingStatus::Pending) {
            return redirect()->route('hotel.bookings.index')->with('error', 'Only pending bookings can be rejected.');
        }

        $booking->update([
            'status' => BookingStatus::Rejected->value,
            'remarks' => $request->validated('remarks'),
            'rejected_at' => now(),
            'rejected_by_user_id' => $user->id,
            'approved_at' => null,
            'approved_by_user_id' => null,
        ]);

        $booking->user->notify(new BookingRejectedNotification($booking));

        return redirect()->route('hotel.bookings.index')->with('success', 'Booking rejected.');
    }
}
