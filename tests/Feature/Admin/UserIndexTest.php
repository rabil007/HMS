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
        ->has('users')
        ->where('users', fn ($users) => collect($users)->pluck('id')->contains($admin->id) === false)
        ->where('users', fn ($users) => collect($users)->pluck('id')->contains($clientUser->id) === true)
    );
});

