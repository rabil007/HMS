<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OverviewController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        // Get basic counts based on role
        if ($user->role === 'admin') {
            $totalBookings = Booking::count();
            $pendingBookings = Booking::where('status', 'pending')->count();
            $totalUsers = User::count();
            $totalHotels = Hotel::count();

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
        } else {
            $totalBookings = Booking::where('user_id', $user->id)->count();
            $pendingBookings = Booking::where('user_id', $user->id)->where('status', 'pending')->count();
            $totalUsers = 0;
            $totalHotels = 0;

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
        }

        // Recent Activity
        $recentBookings = Booking::with(['hotel', 'user'])
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'public_id' => $b->public_id,
                'hotel' => $b->hotel?->name ?? 'Unknown',
                'status' => $b->status->value ?? $b->status,
                'guest' => $b->guest_name ?? $b->user?->name,
                'time' => $b->created_at->diffForHumans(),
            ]);

        // Analytics: Status Distribution
        $statusDistribution = Booking::select('status', \DB::raw('count(*) as value'))
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
            ->groupBy('status')
            ->get()
            ->map(fn($item) => [
                'name' => ucfirst($item->status->value ?? $item->status),
                'value' => $item->value,
                'status' => $item->status->value ?? $item->status,
            ]);

        // Analytics: Room Type Distribution
        $roomDistribution = Booking::select('single_or_twin', \DB::raw('count(*) as value'))
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
            ->whereNotNull('single_or_twin')
            ->groupBy('single_or_twin')
            ->get()
            ->map(fn($item) => [
                'name' => ucfirst($item->single_or_twin),
                'value' => $item->value,
            ]);

        // Analytics: Top Hotels
        $topHotels = Booking::with('hotel')
            ->select('hotel_id', \DB::raw('count(*) as value'))
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
            ->groupBy('hotel_id')
            ->orderByDesc('value')
            ->limit(4)
            ->get()
            ->map(fn($item) => [
                'name' => $item->hotel ? str($item->hotel->name)->limit(15)->toString() : 'Unknown',
                'value' => $item->value,
            ]);

        return Inertia::render('overview', [
            'stats' => [
                'totalBookings' => $totalBookings,
                'pendingBookings' => $pendingBookings,
                'totalUsers' => $totalUsers,
                'totalHotels' => $totalHotels,
            ],
            'chartData' => $chartData,
            'recentBookings' => $recentBookings,
            'analytics' => [
                'statusDistribution' => $statusDistribution,
                'roomDistribution' => $roomDistribution,
                'topHotels' => $topHotels,
            ]
        ]);
    }
}
