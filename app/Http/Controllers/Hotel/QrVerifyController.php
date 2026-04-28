<?php

namespace App\Http\Controllers\Hotel;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class QrVerifyController extends Controller
{
    public function __invoke(Request $request)
    {
        $confirmation = trim((string) $request->string('confirmation'));

        if ($confirmation === '') {
            return redirect()->route('hotel.scan')->with('error', 'Confirmation number is required.');
        }

        $user = $request->user();
        $hotelId = (int) ($user?->hotel_id ?? 0);

        $anyBooking = Booking::query()
            ->where('confirmation_number', $confirmation)
            ->first();

        if (! $anyBooking) {
            return redirect()->route('hotel.scan')->with('error', 'Booking not found.');
        }

        if ((int) $anyBooking->hotel_id !== $hotelId) {
            return redirect()->route('hotel.scan')->with('error', 'This booking belongs to a different hotel.');
        }

        if (($anyBooking->status->value ?? (string) $anyBooking->status) !== BookingStatus::Confirmed->value) {
            return redirect()->route('hotel.scan')->with('error', 'Booking is not confirmed yet.');
        }

        return redirect()->route('hotel.stays.show', [$anyBooking, 'confirmation' => $confirmation]);
    }
}
