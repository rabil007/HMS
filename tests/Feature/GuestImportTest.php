<?php

use App\Enums\Role;
use App\Models\Guest;
use App\Models\User;

test('it can import guests via confirmed names payload', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    expect(Guest::query()->count())->toBe(0);

    $response = $this->actingAs($admin)->post(route('guests.import'), [
        'names' => ['  John   Doe  '],
    ]);

    $response->assertRedirect(route('guests.index'));
    expect(Guest::query()->where('full_name', 'John Doe')->exists())->toBeTrue();
});

test('it skips guests that already exist', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    Guest::query()->create(['full_name' => 'Existing Guest']);

    $this->actingAs($admin)->post(route('guests.import'), [
        'names' => ['Existing Guest'],
    ])->assertRedirect(route('guests.index'));

    expect(Guest::query()->where('full_name', 'Existing Guest')->count())->toBe(1);
});
