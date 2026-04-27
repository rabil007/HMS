<?php

use App\Enums\Role;
use App\Models\User;

it('renders overview with analytics props', function () {
    $admin = User::factory()->create(['role' => Role::Admin->value]);

    $this->actingAs($admin)
        ->get(route('overview'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboards/admin')
            ->has('viewerRole')
            ->has('stats.totalBookings')
            ->has('stats.pendingBookings')
            ->has('stats.confirmedBookings')
            ->has('stats.rejectedBookings')
            ->has('stats.bookingsThisMonth')
            ->has('stats.bookingsLastMonth')
            ->has('stats.approvalRate')
            ->has('stats.pendingOver48h')
            ->has('chartData')
            ->has('stay.scheduled.arrivalsToday')
            ->has('stay.scheduled.departuresToday')
            ->has('stay.scheduled.inHouse')
            ->has('stay.actual.arrivalsToday')
            ->has('stay.actual.departuresToday')
            ->has('stay.actual.inHouse')
            ->has('series.requests')
            ->has('series.scheduledArrivals')
            ->has('series.actualArrivals')
            ->has('recentBookings')
            ->has('recentChanges')
            ->has('analytics.statusDistribution')
            ->has('analytics.roomDistribution')
            ->has('analytics.topHotels')
            ->has('analytics.topClients')
            ->has('analytics.topUsers')
        );
});
