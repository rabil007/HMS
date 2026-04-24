<?php

use App\Models\Client;
use App\Models\User;

it('lists clients with pagination and supports search and per-page', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 20) as $i) {
        Client::query()->create(['name' => "Client {$i}"]);
    }

    Client::query()->create(['name' => 'Needle Client']);

    $response = $this->actingAs($admin)->get(route('admin.clients.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/clients/index')
        ->has('clients.data', 15)
        ->where('filters.per_page', 15)
    );

    $response = $this->actingAs($admin)->get(route('admin.clients.index', ['q' => 'Needle']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/clients/index')
        ->has('clients.data', 1)
        ->where('clients.data.0.name', 'Needle Client')
    );

    $response = $this->actingAs($admin)->get(route('admin.clients.index', ['per_page' => 30]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/clients/index')
        ->has('clients.data', 21)
        ->where('filters.per_page', 30)
    );
});
