<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\BackfillBookingRequest;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Country;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function createBackfill(): Response
    {
        return Inertia::render('admin/bookings/backfill', [
            ...$this->backfillLookups(),
            'booking' => null,
        ]);
    }

    public function editBackfill(Booking $booking): Response
    {
        $guests = Guest::query()
            ->orderBy('full_name')
            ->get(['id', 'full_name as name'])
            ->toArray();

        $hotels = Hotel::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->toArray();

        $clients = Client::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->toArray();

        $vessels = Vessel::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->toArray();

        $ranks = Rank::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->toArray();

        $countries = Country::query()
            ->orderBy('name')
            ->get(['id', 'name', 'iso2', 'dial_code'])
            ->toArray();

        return Inertia::render('admin/bookings/backfill', [
            'guests' => $guests,
            'hotels' => $hotels,
            'clients' => $clients,
            'vessels' => $vessels,
            'ranks' => $ranks,
            'countries' => $countries,
            'booking' => [
                'id' => $booking->id,
                'guest_id' => $booking->guest_id,
                'hotel_id' => $booking->hotel_id,
                'client_id' => $booking->client_id,
                'vessel_id' => $booking->vessel_id,
                'rank_id' => $booking->rank_id,
                'guest_check_in' => $booking->guest_check_in?->format('Y-m-d\TH:i'),
                'guest_check_out' => $booking->guest_check_out?->format('Y-m-d\TH:i'),
                'room_number' => $booking->room_number,
                'single_or_twin' => $booking->single_or_twin,
                'confirmation_number' => $booking->confirmation_number,
            ],
        ]);
    }

    public function storeBackfill(BackfillBookingRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();
        $checkInDate = Carbon::parse($validated['guest_check_in'])->toDateString();
        $checkOutDate = isset($validated['guest_check_out'])
            ? Carbon::parse($validated['guest_check_out'])->toDateString()
            : null;

        $booking = Booking::create([
            ...$validated,
            'check_in_date' => $checkInDate,
            'check_out_date' => $checkOutDate,
            'actual_check_in_date' => $checkInDate,
            'actual_check_out_date' => $checkOutDate,
            'public_id' => (string) Str::ulid(),
            'user_id' => $user?->id,
            'status' => BookingStatus::Confirmed->value,
        ]);

        activity()
            ->performedOn($booking)
            ->causedBy($user)
            ->withProperties([
                'backfilled' => true,
                'original_check_in' => $validated['guest_check_in'],
            ])
            ->log('Admin backfilled historical booking');

        return redirect()
            ->route('bookings.show', $booking)
            ->with('success', 'Historical booking recorded successfully');
    }

    public function updateBackfill(BackfillBookingRequest $request, Booking $booking)
    {
        $validated = $request->validated();
        $checkInDate = Carbon::parse($validated['guest_check_in'])->toDateString();
        $checkOutDate = isset($validated['guest_check_out'])
            ? Carbon::parse($validated['guest_check_out'])->toDateString()
            : null;

        $booking->update([
            ...$validated,
            'check_in_date' => $checkInDate,
            'check_out_date' => $checkOutDate,
            'actual_check_in_date' => $checkInDate,
            'actual_check_out_date' => $checkOutDate,
        ]);

        activity()
            ->performedOn($booking)
            ->causedBy($request->user())
            ->withProperties([
                'backfilled' => true,
                'original_check_in' => $validated['guest_check_in'],
            ])
            ->log('Admin updated historical booking');

        return redirect()
            ->route('bookings.show', $booking)
            ->with('success', 'Historical booking updated successfully');
    }

    private function backfillLookups(): array
    {
        return [
            'guests' => Guest::query()->orderBy('full_name')->get(['id', 'full_name as name'])->toArray(),
            'hotels' => Hotel::query()->orderBy('name')->get(['id', 'name'])->toArray(),
            'clients' => Client::query()->orderBy('name')->get(['id', 'name'])->toArray(),
            'vessels' => Vessel::query()->orderBy('name')->get(['id', 'name'])->toArray(),
            'ranks' => Rank::query()->orderBy('name')->get(['id', 'name'])->toArray(),
            'countries' => Country::query()->orderBy('name')->get(['id', 'name', 'iso2', 'dial_code'])->toArray(),
        ];
    }
}
