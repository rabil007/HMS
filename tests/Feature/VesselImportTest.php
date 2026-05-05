<?php

use App\Enums\Role;
use App\Models\User;
use App\Models\Vessel;

test('it can import vessels via confirmed names payload', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);

    expect(Vessel::query()->count())->toBe(0);

    $response = $this->actingAs($admin)->post(route('admin.vessels.import'), [
        'names' => ['  ADNOC  Test  Ship  '],
    ]);

    $response->assertRedirect(route('admin.vessels.index'));
    expect(Vessel::query()->where('name', 'ADNOC Test Ship')->exists())->toBeTrue();
});

test('it skips vessels that already exist', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    Vessel::query()->create(['name' => 'Existing Vessel']);

    $this->actingAs($admin)->post(route('admin.vessels.import'), [
        'names' => ['Existing Vessel'],
    ])->assertRedirect(route('admin.vessels.index'));

    expect(Vessel::query()->where('name', 'Existing Vessel')->count())->toBe(1);
});
