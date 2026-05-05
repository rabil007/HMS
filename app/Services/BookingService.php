<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\User;
use App\Notifications\BookingRequestedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingService
{
    public function createBooking(array $data, User $user): Booking
    {
        return DB::transaction(function () use ($data, $user) {
            $guest = isset($data['guest_id']) ? Guest::query()->findOrFail($data['guest_id']) : null;

            $booking = Booking::create([
                'hotel_id' => $data['hotel_id'] ?? null,
                'user_id' => $user->id,
                'guest_id' => $guest?->id,
                'public_id' => (string) Str::ulid(),
                'status' => BookingStatus::Pending->value,
                'check_in_date' => $data['check_in_date'],
                'check_out_date' => $data['check_out_date'] ?? null,
                'guest_name' => $guest?->full_name ?? $user->name,
                'guest_email' => $guest?->email ?? $user->email,
                'guest_phone' => $guest?->phone,
                'client_id' => $user->client_id ?? null,
                'rank_id' => $data['rank_id'] ?? null,
                'vessel_id' => $data['vessel_id'] ?? null,
                'single_or_twin' => $data['single_or_twin'] ?? null,
            ]);

            DB::afterCommit(function () use ($booking) {
                if ($booking->hotel_id !== null) {
                    User::query()
                        ->where('role', 'hotel')
                        ->where('hotel_id', $booking->hotel_id)
                        ->get()
                        ->each(fn (User $hotelUser) => $hotelUser->notify(new BookingRequestedNotification($booking)));
                }

                User::query()
                    ->where('role', 'admin')
                    ->get()
                    ->each(fn (User $adminUser) => $adminUser->notify(new BookingRequestedNotification($booking)));
            });

            return $booking;
        });
    }

    /**
     * Apply validated booking data to an existing booking and snapshot guest fields.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateBooking(Booking $booking, array $data): Booking
    {
        return DB::transaction(function () use ($booking, $data) {
            $guest = isset($data['guest_id']) ? Guest::query()->findOrFail($data['guest_id']) : null;

            $booking->fill([
                'hotel_id' => $data['hotel_id'] ?? null,
                'check_in_date' => $data['check_in_date'],
                'check_out_date' => $data['check_out_date'] ?? null,
                'rank_id' => $data['rank_id'] ?? null,
                'vessel_id' => $data['vessel_id'] ?? null,
                'single_or_twin' => $data['single_or_twin'] ?? null,
            ]);

            if ($guest !== null) {
                $booking->fill([
                    'guest_id' => $guest->id,
                    'guest_name' => $guest->full_name,
                    'guest_email' => $guest->email,
                    'guest_phone' => $guest->phone,
                ]);
            }

            $booking->save();

            return $booking;
        });
    }
}
