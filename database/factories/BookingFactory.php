<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hotel_id' => Hotel::factory(),
            'user_id' => User::factory(),
            'room_id' => Room::factory(),
            'public_id' => (string) str()->ulid(),
            'status' => BookingStatus::Pending->value,
            'check_in_date' => now()->addDays(1)->toDateString(),
            'check_out_date' => now()->addDays(3)->toDateString(),
            'guest_name' => fake()->name(),
            'guest_email' => fake()->safeEmail(),
            'guest_phone' => fake()->phoneNumber(),
        ];
    }
}
