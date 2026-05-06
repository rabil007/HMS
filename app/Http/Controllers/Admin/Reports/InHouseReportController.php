<?php

namespace App\Http\Controllers\Admin\Reports;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Exports\Admin\InHouseReportExport;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use App\Services\BookingIndexQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class InHouseReportController
{
    public function __construct(private BookingIndexQuery $bookingIndexQuery) {}

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role !== Role::Admin) {
            abort(403);
        }

        $q = $request->string('q')->trim()->toString();
        $filters = (array) $request->input('filters', []);
        $perPage = $this->bookingIndexQuery->perPage($request);

        $base = $this->inHouseQuery($q, $filters);

        $inHouseCount = $base->count();

        $bookings = (clone $base)
            ->orderBy('guest_check_in', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/reports/in-house/index', [
            'bookings' => $bookings,
            'inHouseCount' => $inHouseCount,
            'filters' => [
                'q' => $q,
                'column' => $filters,
                'per_page' => $perPage,
            ],
            'options' => [
                'hotels' => Hotel::query()->orderBy('name')->get(['id', 'name']),
                'clients' => Client::query()->orderBy('name')->get(['id', 'name']),
                'ranks' => Rank::query()->orderBy('name')->get(['id', 'name']),
                'vessels' => Vessel::query()->orderBy('name')->get(['id', 'name']),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $user = $request->user();

        if ($user->role !== Role::Admin) {
            abort(403);
        }

        $q = $request->string('q')->trim()->toString();
        $filters = (array) $request->input('filters', []);

        $query = $this->inHouseQuery($q, $filters)
            ->orderBy('guest_check_in', 'asc');

        return Excel::download(
            new InHouseReportExport($query),
            'in-house-guests.xlsx'
        );
    }

    /**
     * Base query: confirmed bookings currently checked in (check-in recorded, no check-out yet).
     *
     * @param  array<string, mixed>  $filters
     */
    private function inHouseQuery(string $q, array $filters): Builder
    {
        $dateFrom = is_string($filters['check_in_from'] ?? null) ? $filters['check_in_from'] : null;
        $dateTo = is_string($filters['check_in_to'] ?? null) ? $filters['check_in_to'] : null;

        $dateFrom = $dateFrom && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom) ? $dateFrom : null;
        $dateTo = $dateTo && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo) ? $dateTo : null;

        $query = Booking::query()
            ->with(['hotel', 'client', 'rank', 'vessel', 'guest'])
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNotNull('guest_check_in')
            ->whereNull('guest_check_out')
            ->when($dateFrom !== null, fn (Builder $q) => $q->whereRaw('DATE(guest_check_in) >= ?', [$dateFrom]))
            ->when($dateTo !== null, fn (Builder $q) => $q->whereRaw('DATE(guest_check_in) <= ?', [$dateTo]))
            ->when(
                ($filters['hotel_id'] ?? null) !== null && $filters['hotel_id'] !== '',
                fn (Builder $q) => $q->where('hotel_id', $filters['hotel_id'])
            )
            ->when(
                ($filters['client_id'] ?? null) !== null && $filters['client_id'] !== '',
                fn (Builder $q) => $q->where('client_id', $filters['client_id'])
            )
            ->when(
                ($filters['rank_id'] ?? null) !== null && $filters['rank_id'] !== '',
                fn (Builder $q) => $q->where('rank_id', $filters['rank_id'])
            )
            ->when(
                ($filters['vessel_id'] ?? null) !== null && $filters['vessel_id'] !== '',
                fn (Builder $q) => $q->where('vessel_id', $filters['vessel_id'])
            );

        return $query->when($q !== '', function (Builder $search) use ($q) {
            $search->where(function (Builder $inner) use ($q) {
                $inner->where('public_id', 'like', "%{$q}%")
                    ->orWhere('confirmation_number', 'like', "%{$q}%")
                    ->orWhereHas('guest', function (Builder $guest) use ($q) {
                        $guest->where('full_name', 'like', "%{$q}%")
                            ->orWhere('email', 'like', "%{$q}%")
                            ->orWhere('phone', 'like', "%{$q}%");
                    });
            });
        });
    }
}
