<?php

namespace App\Http\Controllers\Admin\Reports;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Exports\Admin\BookingReportExport;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\Vessel;
use App\Services\BookingIndexQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class BookingReportController
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
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $perPage = $this->bookingIndexQuery->perPage($request);

        $base = $this->reportQuery($request, $q, $filters)
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNotNull('guest_check_in');

        $allowedSorts = [
            'created_at' => 'created_at',
            'check_in_date' => 'check_in_date',
            'check_out_date' => 'check_out_date',
            'guest_name' => 'guest_name',
            'guest_email' => 'guest_email',
        ];

        $bookings = $base
            ->orderBy($allowedSorts[$sort] ?? 'check_in_date', $dir)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/reports/bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'q' => $q,
                'column' => $filters,
                'sort' => $sort,
                'dir' => $dir,
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
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = [
            'created_at' => 'created_at',
            'check_in_date' => 'check_in_date',
            'check_out_date' => 'check_out_date',
            'guest_name' => 'guest_name',
            'guest_email' => 'guest_email',
        ];

        $query = $this->reportQuery($request, $q, $filters)
            ->where('status', BookingStatus::Confirmed->value)
            ->whereNotNull('guest_check_in')
            ->orderBy($allowedSorts[$sort] ?? 'check_in_date', $dir);

        return Excel::download(
            new BookingReportExport($query),
            'bookings-report.xlsx'
        );
    }

    protected function reportQuery(Request $request, string $q, array $filters): Builder
    {
        $dateFrom = is_string($filters['check_in_from'] ?? null) ? $filters['check_in_from'] : null;
        $dateTo = is_string($filters['check_in_to'] ?? null) ? $filters['check_in_to'] : null;

        $dateFrom = $dateFrom && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom) ? $dateFrom : null;
        $dateTo = $dateTo && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo) ? $dateTo : null;

        $query = Booking::query()
            ->with(['hotel', 'client', 'rank', 'vessel'])
            ->when($dateFrom !== null, fn (Builder $query) => $query->whereDate('check_in_date', '>=', Carbon::parse($dateFrom)->toDateString()))
            ->when($dateTo !== null, fn (Builder $query) => $query->whereDate('check_in_date', '<=', Carbon::parse($dateTo)->toDateString()))
            ->when(($filters['hotel_id'] ?? null) !== null && $filters['hotel_id'] !== '', fn (Builder $query) => $query->where('hotel_id', $filters['hotel_id']))
            ->when(($filters['client_id'] ?? null) !== null && $filters['client_id'] !== '', fn (Builder $query) => $query->where('client_id', $filters['client_id']))
            ->when(($filters['rank_id'] ?? null) !== null && $filters['rank_id'] !== '', fn (Builder $query) => $query->where('rank_id', $filters['rank_id']))
            ->when(($filters['vessel_id'] ?? null) !== null && $filters['vessel_id'] !== '', fn (Builder $query) => $query->where('vessel_id', $filters['vessel_id']));

        return $this->bookingIndexQuery->applyTextSearch(
            $query,
            $q,
            ['public_id', 'guest_name', 'guest_email', 'guest_phone', 'confirmation_number'],
            false
        );
    }
}
