<?php

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

test('notifications endpoints return unread count and list', function () {
    $user = User::factory()->createOne([
        'email_verified_at' => now(),
    ]);

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'test',
        'data' => ['title' => 'Hello', 'body' => 'World', 'url' => '/dashboard'],
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->get(route('notifications.unreadCount'))
        ->assertOk()
        ->assertJson(['unread' => 1]);

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertOk()
        ->assertJsonPath('notifications.0.data.title', 'Hello');
});

test('notifications can be marked read', function () {
    $user = User::factory()->createOne([
        'email_verified_at' => now(),
    ]);

    /** @var DatabaseNotification $notification */
    $notification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'test',
        'data' => ['title' => 'Hello'],
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('notifications.markRead', ['id' => $notification->id]))
        ->assertOk();

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('notifications can be marked all read', function () {
    $user = User::factory()->createOne([
        'email_verified_at' => now(),
    ]);

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'test',
        'data' => ['title' => 'One'],
        'read_at' => null,
    ]);

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'test',
        'data' => ['title' => 'Two'],
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('notifications.markAllRead'))
        ->assertOk();

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});

