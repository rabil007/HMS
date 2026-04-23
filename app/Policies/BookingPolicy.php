<?php

namespace App\Policies;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role === Role::Admin) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Booking $booking): bool
    {
        if ($user->role === Role::Staff) {
            return $user->hotel_id === $booking->hotel_id;
        }

        return $user->id === $booking->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Booking $booking): bool
    {
        if ($user->role === Role::Staff) {
            return $user->hotel_id === $booking->hotel_id;
        }

        return false;
    }

    public function delete(User $user, Booking $booking): bool
    {
        if ($user->role === Role::Staff) {
            return $user->hotel_id === $booking->hotel_id;
        }

        return $user->id === $booking->user_id && $booking->status === BookingStatus::Pending->value;
    }
}
