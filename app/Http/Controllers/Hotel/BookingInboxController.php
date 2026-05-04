<?php

namespace App\Http\Controllers\Hotel;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hotel\ApproveBookingRequest;
use App\Http\Requests\Hotel\RejectBookingRequest;
use App\Models\Booking;
use App\Models\Client;
use App\Models\User;
use App\Notifications\BookingApprovedNotification;
use App\Notifications\BookingRejectedNotification;
use App\Services\BookingIndexQuery;
use App\Services\EmailSettings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class BookingInboxController extends Controller
{
    public function __construct(
        private BookingIndexQuery $bookingIndexQuery
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $q = $request->string('q')->trim()->toString();
        $status = $request->string('status')->toString();
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $filters = (array) $request->input('filters', []);
        $perPage = $this->bookingIndexQuery->perPage($request);

        $allowedStatuses = [
            BookingStatus::Pending->value,
            BookingStatus::Confirmed->value,
            BookingStatus::Rejected->value,
        ];
        $status = in_array($status, $allowedStatuses, true) ? $status : BookingStatus::Pending->value;

        $allowedSorts = [
            'created_at' => 'created_at',
            'check_in_date' => 'check_in_date',
            'check_out_date' => 'check_out_date',
        ];
        $sort = array_key_exists($sort, $allowedSorts) ? $sort : 'created_at';

        $base = Booking::query()
            ->where('hotel_id', $user->hotel_id)
            ->with([
                'user:id,name,email,client_id',
                'client:id,name',
                'rank:id,name',
                'vessel:id,name',
            ])
            ->when(($filters['client_id'] ?? null) !== null && $filters['client_id'] !== '', fn (Builder $query) => $query->where('client_id', $filters['client_id']));

        $base = $this->bookingIndexQuery->applyTextSearch(
            $base,
            $q,
            [
                'public_id',
                'guest_name',
                'guest_email',
                'guest_phone',
                'confirmation_number',
                'remarks',
            ],
            true
        );

        $countsRow = (clone $base)
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when status = ? then 1 else 0 end) as pending', [BookingStatus::Pending->value])
            ->selectRaw('sum(case when status = ? then 1 else 0 end) as confirmed', [BookingStatus::Confirmed->value])
            ->selectRaw('sum(case when status = ? then 1 else 0 end) as rejected', [BookingStatus::Rejected->value])
            ->first();

        $counts = [
            'pending' => (int) ($countsRow?->pending ?? 0),
            'confirmed' => (int) ($countsRow?->confirmed ?? 0),
            'rejected' => (int) ($countsRow?->rejected ?? 0),
            'total' => (int) ($countsRow?->total ?? 0),
        ];

        $base = $base->where('status', $status);

        $bookings = $base
            ->orderBy($allowedSorts[$sort], $dir)
            ->paginate($perPage)
            ->withQueryString();

        $clients = Client::query()
            ->whereIn('id', Booking::query()
                ->where('hotel_id', $user->hotel_id)
                ->whereNotNull('client_id')
                ->select('client_id')
                ->distinct()
            )
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('hotel/bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'q' => $q,
                'status' => $status,
                'sort' => $sort,
                'dir' => $dir,
                'column' => $filters,
                'per_page' => $perPage,
            ],
            'counts' => $counts,
            'clients' => $clients,
        ]);
    }

    public function show(Request $request, Booking $booking)
    {
        $this->authorize('view', $booking);

        $booking->load([
            'hotel:id,name',
            'user:id,name,email,client_id',
            'client:id,name',
            'rank:id,name',
            'vessel:id,name',
            'approvedBy:id,name',
            'rejectedBy:id,name',
        ]);

        return Inertia::render('hotel/bookings/show', [
            'booking' => $booking,
        ]);
    }

    public function approve(ApproveBookingRequest $request, Booking $booking)
    {
        $this->authorize('update', $booking);

        $user = $request->user();

        if ($booking->status !== BookingStatus::Pending) {
            return redirect()->route('hotel.bookings.index')->with('error', 'Only pending bookings can be approved.');
        }

        $booking->update([
            'status' => BookingStatus::Confirmed->value,
            'confirmation_number' => $request->validated('confirmation_number'),
            'actual_check_in_date' => $request->validated('actual_check_in_date'),
            'actual_check_out_date' => $request->validated('actual_check_out_date'),
            'remarks' => $request->validated('remarks'),
            'approved_at' => now(),
            'approved_by_user_id' => $user->id,
            'rejected_at' => null,
            'rejected_by_user_id' => null,
        ]);

        $booking->user->notify(new BookingApprovedNotification($booking));

        User::query()
            ->where('role', 'admin')
            ->get()
            ->each(fn (User $adminUser) => $adminUser->notify(new BookingApprovedNotification($booking)));

        if (app(EmailSettings::class)->enabled()) {
            $guestEmail = trim((string) ($booking->guest_email ?? ''));
            $clientEmail = trim((string) ($booking->user?->email ?? ''));
            if ($guestEmail !== '' && strtolower($guestEmail) !== strtolower($clientEmail)) {
                Notification::route('mail', $guestEmail)->notify(new BookingApprovedNotification($booking));
            }
        }

        return redirect()->route('hotel.bookings.index')->with('success', 'Booking approved.');
    }

    public function reject(RejectBookingRequest $request, Booking $booking)
    {
        $this->authorize('update', $booking);

        $user = $request->user();

        if ($booking->status !== BookingStatus::Pending) {
            return redirect()->route('hotel.bookings.index')->with('error', 'Only pending bookings can be rejected.');
        }

        $booking->update([
            'status' => BookingStatus::Rejected->value,
            'remarks' => $request->validated('remarks'),
            'rejected_at' => now(),
            'rejected_by_user_id' => $user->id,
            'approved_at' => null,
            'approved_by_user_id' => null,
        ]);

        $booking->user->notify(new BookingRejectedNotification($booking));

        User::query()
            ->where('role', 'admin')
            ->get()
            ->each(fn (User $adminUser) => $adminUser->notify(new BookingRejectedNotification($booking)));

        if (app(EmailSettings::class)->enabled()) {
            $guestEmail = trim((string) ($booking->guest_email ?? ''));
            $clientEmail = trim((string) ($booking->user?->email ?? ''));
            if ($guestEmail !== '' && strtolower($guestEmail) !== strtolower($clientEmail)) {
                Notification::route('mail', $guestEmail)->notify(new BookingRejectedNotification($booking));
            }
        }

        return redirect()->route('hotel.bookings.index')->with('success', 'Booking rejected.');
    }
}
