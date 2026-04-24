<?php

use App\Enums\Role;
use App\Models\User;

it('does not list admin users in the admin users index', function () {
    $admin = User::factory()->admin()->create();
    $clientUser = User::factory()->create(['role' => Role::Client->value]);

    $response = $this->actingAs($admin)->get(route('admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->has('users.data')
        ->where('users.data', fn ($users) => collect($users)->pluck('id')->contains($admin->id) === false)
        ->where('users.data', fn ($users) => collect($users)->pluck('id')->contains($clientUser->id) === true)
    );
});

it('supports searching users and per-page in the admin users index', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 20) as $i) {
        User::factory()->create([
            'role' => Role::Client->value,
            'name' => "User {$i}",
            'email' => "user{$i}@example.com",
        ]);
    }

    $needle = User::factory()->create([
        'role' => Role::Client->value,
        'name' => 'Needle User',
        'email' => 'needle@example.com',
    ]);

    $hotelUser = User::factory()->create([
        'role' => Role::Hotel->value,
        'name' => 'Hotel User',
        'email' => 'hotel@example.com',
    ]);

    $response = $this->actingAs($admin)->get(route('admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->has('users.data', 15)
        ->where('filters.per_page', 15)
    );

    $response = $this->actingAs($admin)->get(route('admin.users.index', ['q' => 'needle']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->has('users.data', 1)
        ->where('users.data.0.id', $needle->id)
    );

    $response = $this->actingAs($admin)->get(route('admin.users.index', ['per_page' => 30]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->has('users.data', 22)
        ->where('filters.per_page', 30)
    );

    $response = $this->actingAs($admin)->get(route('admin.users.index', ['role' => Role::Hotel->value]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->where('filters.role', Role::Hotel->value)
        ->where('users.data', fn ($users) => collect($users)->pluck('id')->contains($hotelUser->id) === true)
        ->where('users.data', fn ($users) => collect($users)->pluck('id')->contains($needle->id) === false)
    );
});
