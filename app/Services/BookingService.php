<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingRequestedNotification;
use App\Services\EmailSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingService
{
    public function createBooking(array $data, User $user): Booking
    {
        return DB::transaction(function () use ($data, $user) {
            $booking = Booking::create([
                'hotel_id' => $data['hotel_id'],
                'user_id' => $user->id,
                'public_id' => (string) Str::ulid(),
                'status' => BookingStatus::Pending->value,
                'check_in_date' => $data['check_in_date'],
                'check_out_date' => $data['check_out_date'] ?? null,
                'guest_name' => $data['guest_name'] ?? $user->name,
                'guest_email' => $data['guest_email'] ?? $user->email,
                'guest_phone' => $data['guest_phone'] ?? null,
                'client_id' => $user->client_id ?? null,
                'rank_id' => $data['rank_id'] ?? null,
                'vessel_id' => $data['vessel_id'] ?? null,
                'single_or_twin' => $data['single_or_twin'] ?? null,
            ]);

            DB::afterCommit(function () use ($booking) {
                if (! app(EmailSettings::class)->enabled()) {
                    return;
                }

                User::query()
                    ->where('role', 'hotel')
                    ->where('hotel_id', $booking->hotel_id)
                    ->get()
                    ->each(fn (User $hotelUser) => $hotelUser->notify(new BookingRequestedNotification($booking)));

                User::query()
                    ->where('role', 'admin')
                    ->get()
                    ->each(fn (User $adminUser) => $adminUser->notify(new BookingRequestedNotification($booking)));
            });

            return $booking;
        });
    }
}
