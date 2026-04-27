<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(CountrySeeder::class);

        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Platform Admin', 'role' => 'admin']
        );
    }
}
