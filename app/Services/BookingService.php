<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function createBooking(array $data, User $user): Booking
    {
        return DB::transaction(function () use ($data, $user) {
            // Transaction-based overlap prevention
            $overlapping = Booking::where('room_id', $data['room_id'])
                ->whereIn('status', [BookingStatus::Pending->value, BookingStatus::Confirmed->value])
                ->where(function ($query) use ($data) {
                    $query->whereBetween('check_in_date', [$data['check_in_date'], $data['check_out_date']])
                        ->orWhereBetween('check_out_date', [$data['check_in_date'], $data['check_out_date']])
                        ->orWhere(function ($q) use ($data) {
                            $q->where('check_in_date', '<=', $data['check_in_date'])
                                ->where('check_out_date', '>=', $data['check_out_date']);
                        });
                })
                ->lockForUpdate()
                ->exists();

            if ($overlapping) {
                throw ValidationException::withMessages([
                    'check_in_date' => 'The selected room is already booked for these dates.',
                ]);
            }

            $booking = Booking::create([
                'hotel_id' => $data['hotel_id'],
                'user_id' => $user->id,
                'room_id' => $data['room_id'],
                'public_id' => (string) Str::ulid(),
                'status' => BookingStatus::Pending->value,
                'check_in_date' => $data['check_in_date'],
                'check_out_date' => $data['check_out_date'],
                'guest_name' => $data['guest_name'] ?? $user->name,
                'guest_email' => $data['guest_email'] ?? $user->email,
                'guest_phone' => $data['guest_phone'] ?? null,
            ]);

            return $booking;
        });
    }
}
