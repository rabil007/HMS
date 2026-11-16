<?php

namespace App\Http\Controllers;

use App\Services\PushTestSender;
use App\Services\WebPushSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use NotificationChannels\WebPush\PushSubscription;

class PushSubscriptionController extends Controller
{
    public function store(Request $request, WebPushSettings $settings): JsonResponse
    {
        abort_unless($settings->configured(), 503, 'Push notifications are not configured.');

        $validated = $request->validate([
            'endpoint' => ['required', 'url', 'max:500'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
            'contentEncoding' => ['nullable', 'string', 'in:aesgcm,aes128gcm'],
        ]);

        $subscription = $request->user()->updatePushSubscription(
            $validated['endpoint'],
            $validated['keys']['p256dh'],
            $validated['keys']['auth'],
            $validated['contentEncoding'] ?? 'aes128gcm',
        );

        $subscription->forceFill([
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 500) ?: null,
            'last_used_at' => now(),
        ])->save();

        return response()->json(['subscribed' => true]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'string', 'max:500'],
        ]);

        $request->user()->deletePushSubscription($validated['endpoint']);

        return response()->json(['subscribed' => false]);
    }

    /**
     * Remove one of the user's devices from Settings → Notifications.
     */
    public function destroyDevice(Request $request, int $subscription): RedirectResponse
    {
        $deleted = $request->user()->pushSubscriptions()->whereKey($subscription)->delete();

        abort_if($deleted === 0, 404);

        return back()->with('success', 'Device removed. It will no longer get push notifications.');
    }

    /**
     * Send a test push now, to one device (by endpoint) or to all of the user's devices.
     */
    public function test(Request $request, WebPushSettings $settings, PushTestSender $sender): JsonResponse
    {
        if (! $settings->configured()) {
            return response()->json([
                'message' => 'Push notifications are not set up on the server yet (VAPID keys are missing).',
            ], 503);
        }

        $validated = $request->validate([
            'endpoint' => ['nullable', 'string', 'max:500'],
        ]);

        $query = $request->user()->pushSubscriptions();

        if (filled($validated['endpoint'] ?? null)) {
            $query->where('endpoint', $validated['endpoint']);
        }

        /** @var Collection<int, PushSubscription> $subscriptions */
        $subscriptions = $query->get();

        if ($subscriptions->isEmpty()) {
            return response()->json([
                'message' => filled($validated['endpoint'] ?? null)
                    ? 'This device is not registered for push. Turn push notifications off and on again here.'
                    : 'You have no devices with push notifications turned on.',
            ], 422);
        }

        $result = $sender->send($subscriptions);

        if ($result['sent'] === 0) {
            return response()->json([
                'message' => $result['errors'][0] ?? 'The test notification could not be sent.',
                ...$result,
            ], 502);
        }

        $message = $result['sent'] === 1
            ? 'Test notification sent. It should appear in a few seconds.'
            : "Test notification sent to {$result['sent']} devices.";

        if ($result['failed'] > 0) {
            $message .= " {$result['failed']} device(s) failed: ".implode(' ', $result['errors']);
        }

        return response()->json(['message' => $message, ...$result]);
    }

    public function dismissPrompt(Request $request, WebPushSettings $settings): JsonResponse
    {
        $settings->dismissPrompt($request->user());

        return response()->json(['dismissed' => true]);
    }
}
