<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Country;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use App\Services\BookingService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function __construct(
        private BookingService $bookingService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $q = $request->string('q')->trim()->toString();
        $status = $request->string('status')->toString();
        $filters = (array) $request->input('filters', []);
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $perPage = $request->integer('per_page') ?: 15;
        $perPage = in_array($perPage, [15, 30, 50, 100], true) ? $perPage : 15;

        $overallTotal = Booking::query()
            ->when($user->role !== Role::Admin, fn (Builder $query) => $query->where('user_id', $user->id))
            ->count();

        $base = $this->bookingsQuery($request, $q, $filters)
            ->when(in_array($status, ['pending', 'confirmed', 'cancelled'], true), fn (Builder $query) => $query->where('status', $status));

        $countsQuery = (clone $base);

        $counts = [
            'total' => (clone $countsQuery)->count(),
            'pending' => (clone $countsQuery)->where('status', 'pending')->count(),
            'confirmed' => (clone $countsQuery)->where('status', 'confirmed')->count(),
            'cancelled' => (clone $countsQuery)->where('status', 'cancelled')->count(),
        ];

        $allowedSorts = [
            'created_at' => 'created_at',
            'check_in_date' => 'check_in_date',
            'check_out_date' => 'check_out_date',
            'status' => 'status',
            'guest_name' => 'guest_name',
            'guest_email' => 'guest_email',
        ];

        $bookings = $base
            ->orderBy($allowedSorts[$sort] ?? 'created_at', $dir)
            ->paginate($perPage)
            ->withQueryString();

        $clientHotels = null;
        if ($user->role === Role::Client) {
            $hotelIds = Booking::query()
                ->where('user_id', $user->id)
                ->whereNotNull('hotel_id')
                ->distinct()
                ->pluck('hotel_id');

            $clientHotels = Hotel::query()
                ->whereIn('id', $hotelIds)
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Inertia::render('bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'q' => $q,
                'status' => $status,
                'column' => $filters,
                'sort' => $sort,
                'dir' => $dir,
                'per_page' => $perPage,
            ],
            'counts' => $counts,
            'overallTotal' => $overallTotal,
            'adminFilters' => $user->role === Role::Admin ? [
                'hotels' => Hotel::query()->orderBy('name')->get(['id', 'name']),
                'clients' => Client::query()->orderBy('name')->get(['id', 'name']),
            ] : null,
            'hotelFilters' => $clientHotels,
        ]);
    }

    protected function bookingsQuery(Request $request, string $q, array $filters): Builder
    {
        $user = $request->user();

        $dateFrom = is_string($filters['check_in_from'] ?? null) ? $filters['check_in_from'] : null;
        $dateTo = is_string($filters['check_in_to'] ?? null) ? $filters['check_in_to'] : null;

        $dateFrom = $dateFrom && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom) ? $dateFrom : null;
        $dateTo = $dateTo && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo) ? $dateTo : null;

        return Booking::query()
            ->when($user->role !== Role::Admin, fn (Builder $query) => $query->where('user_id', $user->id))
            ->with(['hotel', 'client', 'rank', 'vessel'])
            ->when($q !== '', function (Builder $query) use ($q) {
                $query->where(function (Builder $inner) use ($q) {
                    $inner
                        ->where('public_id', 'like', "%{$q}%")
                        ->orWhere('guest_name', 'like', "%{$q}%")
                        ->orWhere('guest_email', 'like', "%{$q}%")
                        ->orWhere('guest_phone', 'like', "%{$q}%");
                });
            })
            ->when($dateFrom !== null, fn (Builder $query) => $query->whereDate('check_in_date', '>=', Carbon::parse($dateFrom)->toDateString()))
            ->when($dateTo !== null, fn (Builder $query) => $query->whereDate('check_in_date', '<=', Carbon::parse($dateTo)->toDateString()))
            ->when(($filters['hotel_id'] ?? null) !== null && $filters['hotel_id'] !== '', fn (Builder $query) => $query->where('hotel_id', $filters['hotel_id']))
            ->when(($filters['client_id'] ?? null) !== null && $filters['client_id'] !== '', fn (Builder $query) => $query->where('client_id', $filters['client_id']))
            ->when(($filters['guest_name'] ?? null) !== null && $filters['guest_name'] !== '', fn (Builder $query) => $query->where('guest_name', 'like', '%'.$filters['guest_name'].'%'))
            ->when(($filters['guest_email'] ?? null) !== null && $filters['guest_email'] !== '', fn (Builder $query) => $query->where('guest_email', 'like', '%'.$filters['guest_email'].'%'))
            ->when(($filters['guest_phone'] ?? null) !== null && $filters['guest_phone'] !== '', fn (Builder $query) => $query->where('guest_phone', 'like', '%'.$filters['guest_phone'].'%'))
            ->when(($filters['public_id'] ?? null) !== null && $filters['public_id'] !== '', fn (Builder $query) => $query->where('public_id', 'like', '%'.$filters['public_id'].'%'))
            ->when(($filters['hotel_name'] ?? null) !== null && $filters['hotel_name'] !== '', function (Builder $query) use ($filters) {
                $query->whereHas('hotel', fn (Builder $h) => $h->where('name', 'like', '%'.$filters['hotel_name'].'%'));
            });
    }

    public function create()
    {
        return Inertia::render('bookings/create', [
            'hotels' => Hotel::orderBy('name')->get(['id', 'name']),
            'ranks' => Rank::orderBy('name')->get(['id', 'name']),
            'vessels' => Vessel::orderBy('name')->get(['id', 'name']),
            'countries' => Country::orderBy('name')->get(['id', 'name', 'iso2', 'dial_code']),
        ]);
    }

    public function show(Booking $booking)
    {
        $this->authorize('view', $booking);

        return Inertia::render('bookings/show', [
            'booking' => $booking->load([
                'hotel',
                'rank',
                'vessel',
                'user',
            ]),
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
                        'id' => $a->id,
                        'event' => $a->event,
                        'description' => $a->description,
                        'causer' => $a->causer?->name,
                        'changes' => [
                            'old' => $changes['old'] ?? null,
                            'attributes' => $changes['attributes'] ?? null,
                        ],
                        'created_at' => $a->created_at->toISOString(),
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
            'countries' => Country::orderBy('name')->get(['id', 'name', 'iso2', 'dial_code']),
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
