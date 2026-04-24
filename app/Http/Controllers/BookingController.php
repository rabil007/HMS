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
        $q = $request->string('q')->trim()->toString();
        $status = $request->string('status')->toString();

        $base = Booking::query()
            ->where('user_id', $request->user()->id)
            ->with(['hotel', 'rank', 'vessel'])
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner
                        ->where('public_id', 'like', "%{$q}%")
                        ->orWhere('guest_name', 'like', "%{$q}%")
                        ->orWhere('guest_email', 'like', "%{$q}%")
                        ->orWhere('guest_phone', 'like', "%{$q}%");
                });
            });

        $countsQuery = (clone $base);

        $counts = [
            'total' => (clone $countsQuery)->count(),
            'pending' => (clone $countsQuery)->where('status', 'pending')->count(),
            'confirmed' => (clone $countsQuery)->where('status', 'confirmed')->count(),
            'cancelled' => (clone $countsQuery)->where('status', 'cancelled')->count(),
        ];

        $bookings = $base
            ->when(in_array($status, ['pending', 'confirmed', 'cancelled'], true), fn ($query) => $query->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'q' => $q,
                'status' => $status,
            ],
            'counts' => $counts,
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
