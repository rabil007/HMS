<?php

use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('notification center page renders for authenticated users', function () {
    $user = User::factory()->createOne([
        'email_verified_at' => now(),
    ]);

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'test',
        'data' => ['title' => 'Hello', 'body' => 'World', 'url' => '/dashboard'],
        'read_at' => null,
    ]);

    $this
        ->actingAs($user)
        ->get(route('notifications.center'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('notifications/index')
            ->has('notifications.data', 1)
            ->where('unread', 1)
        );
});

