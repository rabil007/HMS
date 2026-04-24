<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use App\Services\BookingService;
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
            'bookings' => $bookings,
        ]);
    }

    public function create()
    {
        return Inertia::render('bookings/create', [
            'hotels' => Hotel::orderBy('name')->get(['id', 'name']),
            'ranks' => Rank::orderBy('name')->get(['id', 'name']),
            'vessels' => Vessel::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function show(Booking $booking)
    {
        $this->authorize('view', $booking);

        return Inertia::render('bookings/show', [
            'booking'    => $booking->load(['hotel', 'rank', 'vessel', 'user']),
            'activities' => $booking->activities()
                ->with('causer')
                ->latest()
                ->get()
                ->map(function ($a) {
                    $changes = $a->attribute_changes?->toArray() ?? [];
                    if (! isset($changes['old']) && ! isset($changes['attributes'])) {
                        $changes = [
                            'old' => $a->properties['old'] ?? null,
                            'attributes' => $a->properties['attributes'] ?? null,
                        ];
                    }

                    return [
                    'id'          => $a->id,
                    'event'       => $a->event,
                    'description' => $a->description,
                    'causer'      => $a->causer?->name,
                    'changes'     => [
                        'old' => $changes['old'] ?? null,
                        'attributes' => $changes['attributes'] ?? null,
                    ],
                    'created_at'  => $a->created_at->toISOString(),
                    ];
                }),
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

    public function edit(Booking $booking)
    {
        $this->authorize('update', $booking);

        return Inertia::render('bookings/edit', [
            'booking' => $booking->load(['hotel', 'rank', 'vessel']),
            'hotels' => Hotel::orderBy('name')->get(['id', 'name']),
            'ranks' => Rank::orderBy('name')->get(['id', 'name']),
            'vessels' => Vessel::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateBookingRequest $request, Booking $booking)
    {
        $booking->update($request->validated());

        return redirect()->route('bookings.index')
            ->with('success', 'Booking updated successfully.');
    }

    public function destroy(Request $request, Booking $booking)
    {
        $this->authorize('delete', $booking);

        $booking->delete();

        return redirect()->route('bookings.index')
            ->with('success', 'Booking cancelled.');
    }
}
