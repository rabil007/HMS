<?php

namespace App\Http\Controllers\Hotel;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hotel\ApproveBookingRequest;
use App\Http\Requests\Hotel\RejectBookingRequest;
use App\Models\Booking;
use App\Notifications\BookingApprovedNotification;
use App\Notifications\BookingRejectedNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingInboxController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $bookings = Booking::query()
            ->where('hotel_id', $user->hotel_id)
            ->with([
                'user:id,name,email,client_id',
                'client:id,name',
                'rank:id,name',
                'vessel:id,name',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('hotel/bookings/index', [
            'bookings' => $bookings,
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
