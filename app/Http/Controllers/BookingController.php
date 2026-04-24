<?php

namespace App\Http\Controllers;

use App\Exports\BookingsExport;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use App\Services\BookingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Maatwebsite\Excel\Facades\Excel;

class BookingController extends Controller
{
    public function __construct(
        private BookingService $bookingService
    ) {}

    public function index(Request $request)
    {
        $q = $request->string('q')->trim()->toString();
        $status = $request->string('status')->toString();
        $filters = (array) $request->input('filters', []);
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';

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
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'q' => $q,
                'status' => $status,
                'column' => $filters,
                'sort' => $sort,
                'dir' => $dir,
            ],
            'counts' => $counts,
        ]);
    }

    protected function bookingsQuery(Request $request, string $q, array $filters): Builder
    {
        $user = $request->user();

        return Booking::query()
            ->where('user_id', $user->id)
            ->with(['hotel', 'rank', 'vessel'])
            ->when($q !== '', function (Builder $query) use ($q) {
                $query->where(function (Builder $inner) use ($q) {
                    $inner
                        ->where('public_id', 'like', "%{$q}%")
                        ->orWhere('guest_name', 'like', "%{$q}%")
                        ->orWhere('guest_email', 'like', "%{$q}%")
                        ->orWhere('guest_phone', 'like', "%{$q}%");
                });
            })
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
        ]);
    }

    public function show(Booking $booking)
    {
        $this->authorize('view', $booking);

        return Inertia::render('bookings/show', [
            'booking' => $booking->load(['hotel', 'rank', 'vessel', 'user']),
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

    public function export(Request $request, string $format)
    {
        $q = $request->string('q')->trim()->toString();
        $status = $request->string('status')->toString();
        $filters = (array) $request->input('filters', []);
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = [
            'created_at' => 'created_at',
            'check_in_date' => 'check_in_date',
            'check_out_date' => 'check_out_date',
            'status' => 'status',
            'guest_name' => 'guest_name',
            'guest_email' => 'guest_email',
        ];

        $query = $this->bookingsQuery($request, $q, $filters)
            ->when(in_array($status, ['pending', 'confirmed', 'cancelled'], true), fn (Builder $q2) => $q2->where('status', $status))
            ->orderBy($allowedSorts[$sort] ?? 'created_at', $dir);

        $fileBase = 'bookings-'.now()->format('Ymd-His');

        return match (strtolower($format)) {
            'csv' => Excel::download(new BookingsExport($query), $fileBase.'.csv', ExcelWriter::CSV),
            'xlsx' => Excel::download(new BookingsExport($query), $fileBase.'.xlsx', ExcelWriter::XLSX),
            'pdf' => Pdf::loadView('exports.bookings', [
                'bookings' => $query->get(),
            ])->download($fileBase.'.pdf'),
            default => abort(404),
        };
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
