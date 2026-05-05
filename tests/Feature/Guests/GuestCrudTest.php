<?php

use App\Enums\Role;
use App\Models\Guest;
use App\Models\User;

use function Pest\Laravel\actingAs;

it('allows admin to manage guests', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    actingAs($admin)
        ->post(route('guests.store'), [
            'full_name' => 'John Guest',
            'email' => 'john@example.com',
            'phone' => '+971501234500',
            'notes' => 'VIP',
        ])
        ->assertRedirect(route('guests.index'));

    $guest = Guest::query()->where('email', 'john@example.com')->firstOrFail();

    actingAs($admin)
        ->put(route('guests.update', $guest), [
            'full_name' => 'John Guest Updated',
            'email' => 'john.updated@example.com',
            'phone' => '+971501234501',
            'notes' => 'Updated',
        ])
        ->assertRedirect(route('guests.index'));

    expect($guest->fresh()->full_name)->toBe('John Guest Updated');

    actingAs($admin)
        ->delete(route('guests.destroy', $guest))
        ->assertRedirect(route('guests.index'));

    expect($guest->fresh()->deleted_at)->not->toBeNull();
});

it('allows client users to manage guests and forbids hotel users', function () {
    $client = User::factory()->createOne(['role' => Role::Client->value]);
    $hotel = User::factory()->createOne(['role' => Role::Hotel->value]);

    actingAs($client)
        ->post(route('guests.store'), [
            'full_name' => 'Client Guest',
            'email' => 'client.guest@example.com',
            'phone' => '+971501234510',
        ])
        ->assertRedirect(route('guests.index'));

    actingAs($hotel)
        ->get(route('guests.index'))
        ->assertForbidden();
});

it('enforces unique email and phone while allowing duplicate full names', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    Guest::query()->create([
        'full_name' => 'Duplicate Name',
        'email' => 'dup@example.com',
        'phone' => '+971501234520',
        'created_by_user_id' => $admin->id,
    ]);

    actingAs($admin)
        ->post(route('guests.store'), [
            'full_name' => 'Duplicate Name',
            'email' => 'dup@example.com',
            'phone' => '+971501234521',
        ])
        ->assertSessionHasErrors(['email']);

    actingAs($admin)
        ->post(route('guests.store'), [
            'full_name' => 'Duplicate Name',
            'email' => 'dup2@example.com',
            'phone' => '+971501234520',
        ])
        ->assertSessionHasErrors(['phone']);

    actingAs($admin)
        ->post(route('guests.store'), [
            'full_name' => 'Duplicate Name',
            'email' => 'dup3@example.com',
            'phone' => '+971501234522',
        ])
        ->assertRedirect(route('guests.index'));
});
