<?php

use App\Enums\Role;
use App\Models\Rank;
use App\Models\User;

test('it can import ranks via confirmed names payload', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    expect(Rank::query()->count())->toBe(0);

    $response = $this->actingAs($admin)->post(route('admin.ranks.import'), [
        'names' => ['  WELDER/FITTER  '],
    ]);

    $response->assertRedirect(route('admin.ranks.index'));
    expect(Rank::query()->where('name', 'WELDER/FITTER')->exists())->toBeTrue();
});

test('it skips duplicate rank names within the same import payload', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    $this->actingAs($admin)
        ->post(route('admin.ranks.import'), [
            'names' => ['WELDER/FITTER', 'WELDER/FITTER'],
        ])
        ->assertRedirect(route('admin.ranks.index'));

    expect(Rank::query()->where('name', 'WELDER/FITTER')->count())->toBe(1);
});

test('it treats rank names with spaces and special chars as duplicates', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    $this->actingAs($admin)
        ->post(route('admin.ranks.import'), [
            'names' => ['WELDER/FITTER', 'welder fitter', 'WELDER - FITTER'],
        ])
        ->assertRedirect(route('admin.ranks.index'));

    expect(Rank::query()->where('name', 'WELDER/FITTER')->count())->toBe(1)
        ->and(Rank::query()->count())->toBe(1);
});
