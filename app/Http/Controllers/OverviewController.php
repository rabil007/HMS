<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\User;
use App\Models\Vessel;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class OverviewController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $cachePrefix = match ($user->role) {
            Role::Admin => 'admin',
            Role::Hotel => 'hotel:'.$user->hotel_id,
            default => 'user:'.$user->id,
        };
        $cacheTtl = now()->addSeconds(60);

        $scope = function ($query) use ($user) {
            if ($user->role === Role::Admin) {
                return $query;
            }

            if ($user->role === Role::Hotel) {
                return $query->where('hotel_id', $user->hotel_id);
            }

            if ($user->client_id !== null) {
                return $query->where('client_id', $user->client_id);
            }

            return $query->where('user_id', $user->id);
        };

        $metrics = Cache::remember("overview:metrics:{$cachePrefix}", $cacheTtl, function () use ($scope, $user) {
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
            $currentInHouseBase = (clone $baseBookings)
                ->where('status', BookingStatus::Confirmed->value)
                ->whereNotNull('guest_check_in')
                ->whereNull('guest_check_out');

            $currentlyInHouse = (clone $currentInHouseBase)->count();
            $dueCheckOutToday = (clone $currentInHouseBase)
                ->whereDate('check_out_date', $today)
                ->count();
            $overstays = (clone $currentInHouseBase)
                ->whereDate('check_out_date', '<', $today)
                ->count();

            $expectedCheckInsToday = (clone $baseBookings)
                ->where('status', BookingStatus::Confirmed->value)
                ->whereDate('check_in_date', $today)
                ->count();
            $checkedInToday = (clone $baseBookings)
                ->where('status', BookingStatus::Confirmed->value)
                ->whereDate('check_in_date', $today)
                ->whereNotNull('guest_check_in')
                ->count();
            $dueCheckInToday = max($expectedCheckInsToday - $checkedInToday, 0);
            $checkInCompletionRateToday = $expectedCheckInsToday > 0
                ? round(($checkedInToday / $expectedCheckInsToday) * 100, 1)
                : null;

            $expectedCheckOutToday = (clone $baseBookings)
                ->whereNotNull('guest_check_in')
                ->whereDate('check_out_date', $today)
                ->count();
            $checkedOutToday = (clone $baseBookings)
                ->whereNotNull('guest_check_out')
                ->whereDate('guest_check_out', $today)
                ->count();
            $checkOutCompletionRateToday = $expectedCheckOutToday > 0
                ? round(($checkedOutToday / $expectedCheckOutToday) * 100, 1)
                : null;

            $openInHouseWithoutRoom = (clone $currentInHouseBase)
                ->where(function ($query) {
                    $query->whereNull('room_number')
                        ->orWhere('room_number', '');
                })
                ->count();

            $averageStayExpr = match ($driver) {
                'sqlite' => '(julianday(guest_check_out) - julianday(guest_check_in))',
                default => 'TIMESTAMPDIFF(HOUR, guest_check_in, guest_check_out) / 24',
            };
            $averageStayNights = (clone $baseBookings)
                ->whereNotNull('guest_check_in')
                ->whereNotNull('guest_check_out')
                ->selectRaw("AVG({$averageStayExpr}) as avg_nights")
                ->value('avg_nights');
            $averageStayNights = $averageStayNights !== null ? round((float) $averageStayNights, 1) : null;

            return [
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
                    'currentlyInHouse' => $currentlyInHouse,
                    'dueCheckInToday' => $dueCheckInToday,
                    'dueCheckOutToday' => $dueCheckOutToday,
                    'overstays' => $overstays,
                    'checkInCompletionRateToday' => $checkInCompletionRateToday,
                    'checkOutCompletionRateToday' => $checkOutCompletionRateToday,
                    'checkedInToday' => $checkedInToday,
                    'checkedOutToday' => $checkedOutToday,
                    'openInHouseWithoutRoom' => $openInHouseWithoutRoom,
                    'averageStayNights' => $averageStayNights,
                ],
                'chartData' => $chartData,
            ];
        });

        // Recent Activity
        $recentBookings = Cache::remember("overview:recent-bookings:{$cachePrefix}", $cacheTtl, function () use ($user) {
            return Booking::with(['hotel', 'user', 'guest'])
                ->when($user->role !== Role::Admin, function ($q) use ($user) {
                    if ($user->role === Role::Hotel) {
                        $q->where('hotel_id', $user->hotel_id);

                        return;
                    }

                    if ($user->client_id !== null) {
                        $q->where('client_id', $user->client_id);

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
                ])
                ->values()
                ->all();
        });

        // Analytics: Status Distribution
        $analytics = Cache::remember("overview:analytics:{$cachePrefix}", $cacheTtl, function () use ($user) {
            $statusDistribution = Booking::select('status', DB::raw('count(*) as value'))
                ->when($user->role !== Role::Admin, function ($q) use ($user) {
                    if ($user->role === Role::Hotel) {
                        $q->where('hotel_id', $user->hotel_id);

                        return;
                    }

                    if ($user->client_id !== null) {
                        $q->where('client_id', $user->client_id);

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
                ])
                ->values()
                ->all();

            $roomDistribution = Booking::select('single_or_twin', DB::raw('count(*) as value'))
                ->when($user->role !== Role::Admin, function ($q) use ($user) {
                    if ($user->role === Role::Hotel) {
                        $q->where('hotel_id', $user->hotel_id);

                        return;
                    }

                    if ($user->client_id !== null) {
                        $q->where('client_id', $user->client_id);

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
                ])
                ->values()
                ->all();

            $topHotels = Booking::with('hotel')
                ->select('hotel_id', DB::raw('count(*) as value'))
                ->when($user->role !== Role::Admin, function ($q) use ($user) {
                    if ($user->role === Role::Hotel) {
                        $q->where('hotel_id', $user->hotel_id);

                        return;
                    }

                    if ($user->client_id !== null) {
                        $q->where('client_id', $user->client_id);

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
                ])
                ->values()
                ->all();

            $topClients = Booking::with('client')
                ->select('client_id', DB::raw('count(*) as value'))
                ->when($user->role !== Role::Admin, function ($q) use ($user) {
                    if ($user->role === Role::Hotel) {
                        $q->where('hotel_id', $user->hotel_id);

                        return;
                    }

                    if ($user->client_id !== null) {
                        $q->where('client_id', $user->client_id);

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
                ])
                ->values()
                ->all();

            $topUsers = Booking::with('user')
                ->select('user_id', DB::raw('count(*) as value'))
                ->when($user->role !== Role::Admin, function ($q) use ($user) {
                    if ($user->role === Role::Hotel) {
                        $q->where('hotel_id', $user->hotel_id);

                        return;
                    }

                    if ($user->client_id !== null) {
                        $q->where('client_id', $user->client_id);

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
                ])
                ->values()
                ->all();

            return [
                'statusDistribution' => $statusDistribution,
                'roomDistribution' => $roomDistribution,
                'topHotels' => $topHotels,
                'topClients' => $topClients,
                'topUsers' => $topUsers,
            ];
        });

        $recentChanges = $user->role === Role::Admin
            ? Cache::remember("overview:recent-changes:{$cachePrefix}", $cacheTtl, function () {
                return Activity::query()
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
                    ->values()
                    ->all();
            })
            : [];

        $component = match ($user->role) {
            Role::Admin => 'dashboards/admin',
            Role::Hotel => 'dashboards/hotel',
            default => 'dashboards/client',
        };

        return Inertia::render($component, [
            'viewerRole' => $user->role->value,
            'stats' => $metrics['stats'],
            'chartData' => $metrics['chartData'],
            'recentBookings' => $recentBookings,
            'recentChanges' => $recentChanges,
            'analytics' => $analytics,
        ]);
    }

    public function metric(Request $request, string $metric)
    {
        $user = $request->user();
        $perPage = in_array($request->integer('per_page'), [15, 30, 50, 100], true)
            ? $request->integer('per_page')
            : 15;
        $q = $request->string('q')->trim()->toString();
        $status = $request->string('status')->toString();
        $hotelId = $request->integer('hotel_id') ?: null;
        $clientId = $request->integer('client_id') ?: null;
        $vesselId = $request->integer('vessel_id') ?: null;
        $rankId = $request->integer('rank_id') ?: null;
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        $baseQuery = $this->scopedBookingsQuery($user);
        $query = (clone $baseQuery)->with(['hotel:id,name', 'client:id,name', 'user:id,name', 'vessel:id,name', 'rank:id,name', 'guest:id,full_name,email,phone']);
        $today = Carbon::today();

        $title = match ($metric) {
            'in-house' => 'In House',
            'checkin-due' => 'Check-in Due',
            'checkout-due' => 'Check-out Due',
            'overstay' => 'Overstay',
            'total' => 'Total Bookings',
            'pending' => 'Pending Bookings',
            'confirmed' => 'Confirmed Bookings',
            'rejected' => 'Rejected Bookings',
            'checked-in-today' => 'Checked In Today',
            'checked-out-today' => 'Checked Out Today',
            'no-room' => 'In-House Without Room',
            'this-month' => 'This Month Bookings',
            default => null,
        };

        if ($title === null) {
            abort(404);
        }

        $query = match ($metric) {
            'in-house' => $query
                ->where('status', BookingStatus::Confirmed->value)
                ->whereNotNull('guest_check_in')
                ->whereNull('guest_check_out'),
            'checkin-due' => $query
                ->where('status', BookingStatus::Confirmed->value)
                ->whereDate('check_in_date', $today)
                ->whereNull('guest_check_in'),
            'checkout-due' => $query
                ->whereNotNull('guest_check_in')
                ->whereNull('guest_check_out')
                ->whereDate('check_out_date', $today),
            'overstay' => $query
                ->whereNotNull('guest_check_in')
                ->whereNull('guest_check_out')
                ->whereDate('check_out_date', '<', $today),
            'pending' => $query->where('status', BookingStatus::Pending->value),
            'confirmed' => $query->where('status', BookingStatus::Confirmed->value),
            'rejected' => $query->where('status', BookingStatus::Rejected->value),
            'checked-in-today' => $query->whereDate('guest_check_in', $today),
            'checked-out-today' => $query->whereDate('guest_check_out', $today),
            'no-room' => $query
                ->where('status', BookingStatus::Confirmed->value)
                ->whereNotNull('guest_check_in')
                ->whereNull('guest_check_out')
                ->where(function (Builder $inner) {
                    $inner->whereNull('room_number')->orWhere('room_number', '');
                }),
            'this-month' => $query->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()]),
            default => $query,
        };

        if ($q !== '') {
            $query->where(function (Builder $inner) use ($q) {
                $inner->where('public_id', 'like', "%{$q}%")
                    ->orWhere('confirmation_number', 'like', "%{$q}%")
                    ->orWhereHas('guest', function (Builder $guest) use ($q) {
                        $guest->where('full_name', 'like', "%{$q}%")
                            ->orWhere('email', 'like', "%{$q}%")
                            ->orWhere('phone', 'like', "%{$q}%");
                    });
            });
        }
        if ($status !== '') {
            $query->where('status', $status);
        }
        if ($hotelId !== null) {
            $query->where('hotel_id', $hotelId);
        }
        if ($clientId !== null) {
            $query->where('client_id', $clientId);
        }
        if ($vesselId !== null) {
            $query->where('vessel_id', $vesselId);
        }
        if ($rankId !== null) {
            $query->where('rank_id', $rankId);
        }
        if ($dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $query->whereDate('check_in_date', '>=', $dateFrom);
        }
        if ($dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $query->whereDate('check_in_date', '<=', $dateTo);
        }

        $bookings = $query->orderByDesc('created_at')->paginate($perPage)->withQueryString();

        $hotelIds = (clone $baseQuery)->whereNotNull('hotel_id')->distinct()->pluck('hotel_id');
        $clientIds = (clone $baseQuery)->whereNotNull('client_id')->distinct()->pluck('client_id');
        $vesselIds = (clone $baseQuery)->whereNotNull('vessel_id')->distinct()->pluck('vessel_id');
        $rankIds = (clone $baseQuery)->whereNotNull('rank_id')->distinct()->pluck('rank_id');

        return Inertia::render('overview-metric', [
            'metric' => $metric,
            'title' => $title,
            'bookings' => $bookings,
            'lookups' => [
                'hotels' => Hotel::query()->whereIn('id', $hotelIds)->orderBy('name')->get(['id', 'name']),
                'clients' => Client::query()->whereIn('id', $clientIds)->orderBy('name')->get(['id', 'name']),
                'vessels' => Vessel::query()->whereIn('id', $vesselIds)->orderBy('name')->get(['id', 'name']),
                'ranks' => Rank::query()->whereIn('id', $rankIds)->orderBy('name')->get(['id', 'name']),
            ],
            'filters' => [
                'q' => $q,
                'status' => $status,
                'hotel_id' => $hotelId,
                'client_id' => $clientId,
                'vessel_id' => $vesselId,
                'rank_id' => $rankId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'per_page' => $perPage,
            ],
        ]);
    }

    private function scopedBookingsQuery(User $user): Builder
    {
        return Booking::query()->when(true, function (Builder $query) use ($user) {
            if ($user->role === Role::Admin) {
                return;
            }

            if ($user->role === Role::Hotel) {
                $query->where('hotel_id', $user->hotel_id);

                return;
            }

            if ($user->client_id !== null) {
                $query->where('client_id', $user->client_id);

                return;
            }

            $query->where('user_id', $user->id);
        });
    }
}
