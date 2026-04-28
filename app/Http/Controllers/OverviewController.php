<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class OverviewController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $scope = function ($query) use ($user) {
            if ($user->role === Role::Admin) {
                return $query;
            }

            if ($user->role === Role::Hotel) {
                return $query->where('hotel_id', $user->hotel_id);
            }

            return $query->where('user_id', $user->id);
        };

        $baseBookings = $scope(Booking::query());

        $statusCounts = (clone $baseBookings)
            ->select('status', DB::raw('count(*) as aggregate'))
            ->groupBy('status')
            ->pluck('aggregate', 'status')
            ->all();

        $totalBookings = array_sum($statusCounts);
        $pendingBookings = (int) ($statusCounts[BookingStatus::Pending->value] ?? 0);
        $confirmedBookings = (int) ($statusCounts[BookingStatus::Confirmed->value] ?? 0);
        $rejectedBookings = (int) ($statusCounts[BookingStatus::Rejected->value] ?? 0);

        $totalUsers = $user->role === Role::Admin ? User::count() : 0;
        $totalHotels = $user->role === Role::Admin ? Hotel::count() : 0;
        $totalClients = $user->role === Role::Admin ? Client::count() : 0;

        $monthStart = Carbon::now()->startOfMonth();
        $chartStart = (clone $monthStart)->subMonthsNoOverflow(5)->startOfMonth();
        $chartEnd = (clone $monthStart)->endOfMonth();

        $driver = DB::connection()->getDriverName();
        $monthKeyExpression = match ($driver) {
            'sqlite' => "strftime('%Y-%m', created_at)",
            default => "DATE_FORMAT(created_at, '%Y-%m')",
        };

        $bookingsByMonth = (clone $baseBookings)
            ->select(DB::raw("{$monthKeyExpression} as ym"), DB::raw('count(*) as aggregate'))
            ->whereBetween('created_at', [$chartStart, $chartEnd])
            ->groupBy('ym')
            ->pluck('aggregate', 'ym')
            ->all();

        $chartData = collect(range(5, 0))
            ->map(function (int $i) use ($monthStart, $bookingsByMonth) {
                $m = (clone $monthStart)->subMonthsNoOverflow($i);
                $ym = $m->format('Y-m');

                return [
                    'name' => $m->format('M Y'),
                    'bookings' => (int) ($bookingsByMonth[$ym] ?? 0),
                ];
            })
            ->values()
            ->all();

        $bookingsThisMonth = (int) ($bookingsByMonth[$monthStart->format('Y-m')] ?? 0);
        $bookingsLastMonth = (int) ($bookingsByMonth[(clone $monthStart)->subMonthNoOverflow()->format('Y-m')] ?? 0);

        $decided = max($confirmedBookings + $rejectedBookings, 0);
        $approvalRate = $decided > 0 ? round(($confirmedBookings / $decided) * 100, 1) : null;

        $pendingOver48h = (clone $baseBookings)
            ->where('status', BookingStatus::Pending->value)
            ->where('created_at', '<=', Carbon::now()->subHours(48))
            ->count();

        $today = Carbon::today();

        // Recent Activity
        $recentBookings = Booking::with(['hotel', 'user'])
            ->when($user->role !== Role::Admin, function ($q) use ($user) {
                if ($user->role === Role::Hotel) {
                    $q->where('hotel_id', $user->hotel_id);

                    return;
                }

                $q->where('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'public_id' => $b->public_id,
                'hotel' => $b->hotel?->name ?? 'Unknown',
                'status' => $b->status->value ?? $b->status,
                'guest' => $b->guest_name ?? $b->user?->name,
                'time' => $b->created_at->diffForHumans(),
            ]);

        // Analytics: Status Distribution
        $statusDistribution = Booking::select('status', DB::raw('count(*) as value'))
            ->when($user->role !== Role::Admin, function ($q) use ($user) {
                if ($user->role === Role::Hotel) {
                    $q->where('hotel_id', $user->hotel_id);

                    return;
                }

                $q->where('user_id', $user->id);
            })
            ->groupBy('status')
            ->get()
            ->map(fn ($item) => [
                'name' => ucfirst($item->status->value ?? $item->status),
                'value' => $item->value,
                'status' => $item->status->value ?? $item->status,
            ]);

        // Analytics: Room Type Distribution
        $roomDistribution = Booking::select('single_or_twin', DB::raw('count(*) as value'))
            ->when($user->role !== Role::Admin, function ($q) use ($user) {
                if ($user->role === Role::Hotel) {
                    $q->where('hotel_id', $user->hotel_id);

                    return;
                }

                $q->where('user_id', $user->id);
            })
            ->whereNotNull('single_or_twin')
            ->groupBy('single_or_twin')
            ->get()
            ->map(fn ($item) => [
                'name' => ucfirst($item->single_or_twin),
                'value' => $item->value,
            ]);

        // Analytics: Top Hotels
        $topHotels = Booking::with('hotel')
            ->select('hotel_id', DB::raw('count(*) as value'))
            ->when($user->role !== Role::Admin, function ($q) use ($user) {
                if ($user->role === Role::Hotel) {
                    $q->where('hotel_id', $user->hotel_id);

                    return;
                }

                $q->where('user_id', $user->id);
            })
            ->groupBy('hotel_id')
            ->orderByDesc('value')
            ->limit(4)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->hotel ? str($item->hotel->name)->limit(15)->toString() : 'Unknown',
                'value' => $item->value,
            ]);

        $topClients = Booking::with('client')
            ->select('client_id', DB::raw('count(*) as value'))
            ->when($user->role !== Role::Admin, function ($q) use ($user) {
                if ($user->role === Role::Hotel) {
                    $q->where('hotel_id', $user->hotel_id);

                    return;
                }

                $q->where('user_id', $user->id);
            })
            ->whereNotNull('client_id')
            ->groupBy('client_id')
            ->orderByDesc('value')
            ->limit(4)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->client ? str($item->client->name)->limit(15)->toString() : 'Unknown',
                'value' => $item->value,
            ]);

        $topUsers = Booking::with('user')
            ->select('user_id', DB::raw('count(*) as value'))
            ->when($user->role !== Role::Admin, function ($q) use ($user) {
                if ($user->role === Role::Hotel) {
                    $q->where('hotel_id', $user->hotel_id);

                    return;
                }

                $q->where('user_id', $user->id);
            })
            ->groupBy('user_id')
            ->orderByDesc('value')
            ->limit(4)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->user ? str($item->user->name)->limit(15)->toString() : 'Unknown',
                'value' => $item->value,
            ]);

        $recentChanges = $user->role === Role::Admin
            ? Activity::query()
                ->with('causer')
                ->latest()
                ->limit(10)
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
                        'subject_type' => class_basename((string) $a->subject_type),
                        'changes' => [
                            'old' => $changes['old'] ?? null,
                            'attributes' => $changes['attributes'] ?? null,
                        ],
                        'created_at' => $a->created_at->toISOString(),
                    ];
                })
            : collect();

        $component = match ($user->role) {
            Role::Admin => 'dashboards/admin',
            Role::Hotel => 'dashboards/hotel',
            default => 'dashboards/client',
        };

        return Inertia::render($component, [
            'viewerRole' => $user->role->value,
            'stats' => [
                'totalBookings' => $totalBookings,
                'pendingBookings' => $pendingBookings,
                'confirmedBookings' => $confirmedBookings,
                'rejectedBookings' => $rejectedBookings,
                'totalUsers' => $totalUsers,
                'totalHotels' => $totalHotels,
                'totalClients' => $totalClients,
                'bookingsThisMonth' => $bookingsThisMonth,
                'bookingsLastMonth' => $bookingsLastMonth,
                'approvalRate' => $approvalRate,
                'pendingOver48h' => $pendingOver48h,
            ],
            'chartData' => $chartData,
            'recentBookings' => $recentBookings,
            'recentChanges' => $recentChanges,
            'analytics' => [
                'statusDistribution' => $statusDistribution,
                'roomDistribution' => $roomDistribution,
                'topHotels' => $topHotels,
                'topClients' => $topClients,
                'topUsers' => $topUsers,
            ],
        ]);
    }
}
