<?php

namespace App\Http\Controllers;

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

        // Get basic counts based on role
        if ($user->role === 'admin') {
            $totalBookings = Booking::count();
            $pendingBookings = Booking::where('status', 'pending')->count();
            $confirmedBookings = Booking::where('status', 'confirmed')->count();
            $cancelledBookings = Booking::where('status', 'cancelled')->count();
            $totalUsers = User::count();
            $totalHotels = Hotel::count();
            $totalClients = Client::count();

            // Monthly bookings chart data (last 6 months)
            $chartData = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $bookingsCount = Booking::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $chartData[] = [
                    'name' => $month->format('M Y'),
                    'bookings' => $bookingsCount,
                ];
            }

            $thisMonth = Carbon::now()->startOfMonth();
            $lastMonth = Carbon::now()->subMonthNoOverflow()->startOfMonth();

            $bookingsThisMonth = Booking::where('created_at', '>=', $thisMonth)->count();
            $bookingsLastMonth = Booking::whereBetween('created_at', [$lastMonth, $thisMonth])->count();

            $decided = max($confirmedBookings + $cancelledBookings, 0);
            $approvalRate = $decided > 0 ? round(($confirmedBookings / $decided) * 100, 1) : null;

            $pendingOver48h = Booking::where('status', 'pending')
                ->where('created_at', '<=', Carbon::now()->subHours(48))
                ->count();
        } else {
            $totalBookings = Booking::where('user_id', $user->id)->count();
            $pendingBookings = Booking::where('user_id', $user->id)->where('status', 'pending')->count();
            $confirmedBookings = Booking::where('user_id', $user->id)->where('status', 'confirmed')->count();
            $cancelledBookings = Booking::where('user_id', $user->id)->where('status', 'cancelled')->count();
            $totalUsers = 0;
            $totalHotels = 0;
            $totalClients = 0;

            // Monthly bookings chart data (last 6 months)
            $chartData = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $bookingsCount = Booking::where('user_id', $user->id)
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $chartData[] = [
                    'name' => $month->format('M Y'),
                    'bookings' => $bookingsCount,
                ];
            }

            $thisMonth = Carbon::now()->startOfMonth();
            $lastMonth = Carbon::now()->subMonthNoOverflow()->startOfMonth();

            $bookingsThisMonth = Booking::where('user_id', $user->id)->where('created_at', '>=', $thisMonth)->count();
            $bookingsLastMonth = Booking::where('user_id', $user->id)->whereBetween('created_at', [$lastMonth, $thisMonth])->count();

            $decided = max($confirmedBookings + $cancelledBookings, 0);
            $approvalRate = $decided > 0 ? round(($confirmedBookings / $decided) * 100, 1) : null;

            $pendingOver48h = Booking::where('user_id', $user->id)
                ->where('status', 'pending')
                ->where('created_at', '<=', Carbon::now()->subHours(48))
                ->count();
        }

        // Recent Activity
        $recentBookings = Booking::with(['hotel', 'user'])
            ->when($user->role !== 'admin', fn ($q) => $q->where('user_id', $user->id))
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
            ->when($user->role !== 'admin', fn ($q) => $q->where('user_id', $user->id))
            ->groupBy('status')
            ->get()
            ->map(fn ($item) => [
                'name' => ucfirst($item->status->value ?? $item->status),
                'value' => $item->value,
                'status' => $item->status->value ?? $item->status,
            ]);

        // Analytics: Room Type Distribution
        $roomDistribution = Booking::select('single_or_twin', DB::raw('count(*) as value'))
            ->when($user->role !== 'admin', fn ($q) => $q->where('user_id', $user->id))
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
            ->when($user->role !== 'admin', fn ($q) => $q->where('user_id', $user->id))
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
            ->when($user->role !== 'admin', fn ($q) => $q->where('user_id', $user->id))
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
            ->when($user->role !== 'admin', fn ($q) => $q->where('user_id', $user->id))
            ->groupBy('user_id')
            ->orderByDesc('value')
            ->limit(4)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->user ? str($item->user->name)->limit(15)->toString() : 'Unknown',
                'value' => $item->value,
            ]);

        $recentChanges = $user->role === 'admin'
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

        return Inertia::render('overview', [
            'stats' => [
                'totalBookings' => $totalBookings,
                'pendingBookings' => $pendingBookings,
                'confirmedBookings' => $confirmedBookings,
                'cancelledBookings' => $cancelledBookings,
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
