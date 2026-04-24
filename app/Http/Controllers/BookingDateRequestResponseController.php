<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Requests\AcceptBookingDateRequestRequest;
use App\Http\Requests\RejectBookingDateRequestRequest;
use App\Models\BookingDateRequest;
use App\Models\User;
use App\Notifications\BookingDateChangeAcceptedNotification;
use App\Notifications\BookingDateChangeRejectedNotification;
use Illuminate\Http\RedirectResponse;

class BookingDateRequestResponseController extends Controller
{
    public function accept(AcceptBookingDateRequestRequest $request, BookingDateRequest $bookingDateRequest): RedirectResponse
    {
        $booking = $bookingDateRequest->booking;
        $this->authorize('view', $booking);

        if ($booking->status !== BookingStatus::Pending) {
            return redirect()->route('bookings.show', $booking)->with('error', 'Only pending bookings can accept date changes.');
        }

        if ($bookingDateRequest->status !== 'pending') {
            return redirect()->route('bookings.show', $booking)->with('error', 'This date-change request is already responded.');
        }

        $payload = $request->validated();

        $booking->update([
            'check_in_date' => $bookingDateRequest->requested_check_in_date,
            'check_out_date' => $bookingDateRequest->requested_check_out_date,
        ]);

        $bookingDateRequest->update([
            'status' => 'accepted',
            'responded_by_user_id' => $request->user()->id,
            'responded_at' => now(),
            'response_note' => $payload['response_note'] ?? null,
        ]);

        User::query()
            ->where('role', 'hotel')
            ->where('hotel_id', $booking->hotel_id)
            ->get()
            ->each(fn (User $hotelUser) => $hotelUser->notify(new BookingDateChangeAcceptedNotification($booking, $bookingDateRequest)));

        return redirect()->route('bookings.show', $booking)->with('success', 'Date change accepted.');
    }

    public function reject(RejectBookingDateRequestRequest $request, BookingDateRequest $bookingDateRequest): RedirectResponse
    {
        $booking = $bookingDateRequest->booking;
        $this->authorize('view', $booking);

        if ($booking->status !== BookingStatus::Pending) {
            return redirect()->route('bookings.show', $booking)->with('error', 'Only pending bookings can reject date changes.');
        }

        if ($bookingDateRequest->status !== 'pending') {
            return redirect()->route('bookings.show', $booking)->with('error', 'This date-change request is already responded.');
        }

        $payload = $request->validated();

        $bookingDateRequest->update([
            'status' => 'rejected',
            'responded_by_user_id' => $request->user()->id,
            'responded_at' => now(),
            'response_note' => $payload['response_note'],
        ]);

        User::query()
            ->where('role', 'hotel')
            ->where('hotel_id', $booking->hotel_id)
            ->get()
            ->each(fn (User $hotelUser) => $hotelUser->notify(new BookingDateChangeRejectedNotification($booking, $bookingDateRequest)));

        return redirect()->route('bookings.show', $booking)->with('success', 'Date change rejected.');
    }
}

