<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationCenterController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (DatabaseNotification $n) => [
                'id' => $n->id,
                'read_at' => $n->read_at?->toISOString(),
                'created_at' => $n->created_at?->toISOString(),
                'data' => $n->data,
            ]);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'unread' => $user->unreadNotifications()->count(),
        ]);
    }
}

