<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use App\Services\BookingService;
use App\Http\Requests\StoreBookingRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function __construct(
        private BookingService $bookingService
    ) {}

    public function index(Request $request)
    {
        $bookings = Booking::where('user_id', $request->user()->id)
            ->with(['hotel', 'rank', 'vessel'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('bookings/index', [
            'bookings' => $bookings
        ]);
    }

    public function create()
    {
        $hotels = Hotel::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        $ranks = Rank::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        $vessels = Vessel::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('bookings/create', [
            'hotels' => $hotels,
            'ranks' => $ranks,
            'vessels' => $vessels,
        ]);
    }

    public function store(StoreBookingRequest $request)
    {
        $this->bookingService->createBooking(
            $request->validated(),
            $request->user()
        );

        return redirect()->route('bookings.index')
            ->with('success', 'Booking request submitted.');
    }
}
