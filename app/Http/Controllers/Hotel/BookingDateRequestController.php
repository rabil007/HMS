<?php

namespace App\Http\Controllers\Hotel;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hotel\StoreBookingDateRequestRequest;
use App\Models\Booking;
use App\Models\BookingDateRequest;
use App\Notifications\BookingDateChangeProposedNotification;
use Illuminate\Http\RedirectResponse;

class BookingDateRequestController extends Controller
{
    public function store(StoreBookingDateRequestRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorize('update', $booking);

        if ($booking->status !== BookingStatus::Pending) {
            return redirect()->route('hotel.bookings.index')->with('error', 'Only pending bookings can be rescheduled.');
        }

        $existingPending = BookingDateRequest::query()
            ->where('booking_id', $booking->id)
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return redirect()->route('hotel.bookings.index')->with('error', 'A pending date-change request already exists for this booking.');
        }

        $payload = $request->validated();

        $dateRequest = BookingDateRequest::create([
            'booking_id' => $booking->id,
            'requested_by_user_id' => $request->user()->id,
            'requested_check_in_date' => $payload['requested_check_in_date'],
            'requested_check_out_date' => $payload['requested_check_out_date'] ?? null,
            'status' => 'pending',
            'response_note' => $payload['response_note'] ?? null,
        ]);

        $booking->loadMissing(['hotel', 'user']);
        $booking->user->notify(new BookingDateChangeProposedNotification($booking, $dateRequest));

        return redirect()->route('hotel.bookings.index')->with('success', 'Date-change request sent to client.');
    }
}

