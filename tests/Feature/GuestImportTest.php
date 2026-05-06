<?php

use App\Enums\Role;
use App\Models\Guest;
use App\Models\User;

test('it can import guests with optional email and phone', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    expect(Guest::query()->count())->toBe(0);

    $response = $this->actingAs($admin)->post(route('guests.import'), [
        'rows' => [[
            'name' => '  John   Doe  ',
            'email' => 'john@example.com',
            'phone' => '+971500000001',
        ]],
    ]);

    $response->assertRedirect(route('guests.index'));
    expect(Guest::query()->where('full_name', 'John Doe')->exists())->toBeTrue()
        ->and(Guest::query()->where('full_name', 'John Doe')->value('email'))->toBe('john@example.com')
        ->and(Guest::query()->where('full_name', 'John Doe')->value('phone'))->toBe('+971500000001');
});

test('it skips guests that already exist', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    Guest::query()->create(['full_name' => 'Existing Guest']);

    $this->actingAs($admin)->post(route('guests.import'), [
        'rows' => [[
            'name' => 'Existing Guest',
            'email' => 'existing@example.com',
            'phone' => '+971500000002',
        ]],
    ])->assertRedirect(route('guests.index'));

    expect(Guest::query()->where('full_name', 'Existing Guest')->count())->toBe(1);
});
