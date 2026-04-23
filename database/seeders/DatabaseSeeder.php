<?php

namespace Database\Seeders;

use App\Models\Hotel;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Platform Admin',
            'email' => 'admin@example.com',
        ]);

        $hotels = Hotel::factory(3)->create();

        foreach ($hotels as $hotel) {
            Room::factory(10)->create([
                'hotel_id' => $hotel->id,
            ]);

            User::factory()->staff()->create([
                'name' => $hotel->name.' Staff',
                'email' => 'staff'.$hotel->id.'@example.com',
                'hotel_id' => $hotel->id,
            ]);
        }

        User::factory(5)->create(); // Guests
    }
}
