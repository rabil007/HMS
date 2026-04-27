<?php

namespace App\Http\Controllers\Hotel;

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

        $booking = Booking::query()
            ->where('hotel_id', $hotelId)
            ->where('status', 'confirmed')
            ->where('confirmation_number', $confirmation)
            ->first();

        if (! $booking) {
            return redirect()->route('hotel.scan')->with('error', 'Invalid confirmation number.');
        }

        return redirect()->route('hotel.stays.show', [$booking, 'confirmation' => $confirmation]);
    }
}

