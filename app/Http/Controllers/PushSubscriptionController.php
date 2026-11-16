<?php

namespace App\Http\Controllers;

use App\Services\WebPushSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $request->user()->updatePushSubscription(
            $validated['endpoint'],
            $validated['keys']['p256dh'],
            $validated['keys']['auth'],
            $validated['contentEncoding'] ?? 'aes128gcm',
        );

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

    public function dismissPrompt(Request $request, WebPushSettings $settings): JsonResponse
    {
        $settings->dismissPrompt($request->user());

        return response()->json(['dismissed' => true]);
    }
}
