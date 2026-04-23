<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('roles')->upsert([
            ['name' => 'admin', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'client', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'hotel', 'created_at' => $now, 'updated_at' => $now],
        ], ['name'], ['updated_at']);
    }
}

