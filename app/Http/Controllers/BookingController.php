<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Hotel;
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
            ->with(['hotel', 'room'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('bookings/index', [
            'bookings' => $bookings
        ]);
    }

    public function create()
    {
        $hotels = Hotel::with(['rooms' => function ($query) {
            $query->orderBy('room_number');
        }])->get();

        return Inertia::render('bookings/create', [
            'hotels' => $hotels
        ]);
    }

    public function store(StoreBookingRequest $request)
    {
        $this->bookingService->createBooking(
            $request->validated(),
            $request->user()
        );

        return redirect()->route('bookings.index')
            ->with('status', 'Booking created successfully and is pending approval.');
    }
}
