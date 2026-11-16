<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Support\UserAgentLabel;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use NotificationChannels\WebPush\PushSubscription;

class NotificationSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $devices = $request->user()->pushSubscriptions()
            ->latest('updated_at')
            ->get()
            ->map(fn (PushSubscription $subscription): array => [
                'id' => $subscription->id,
                'endpoint' => $subscription->endpoint,
                ...UserAgentLabel::describe($subscription->user_agent),
                'added_at' => $subscription->created_at?->toISOString(),
                // The package model has no cast for our last_used_at column.
                'last_used_at' => Carbon::parse($subscription->last_used_at ?? $subscription->updated_at)->toISOString(),
            ])
            ->values();

        return Inertia::render('settings/notifications', [
            'pushDevices' => $devices,
        ]);
    }
}
