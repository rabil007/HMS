<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Room;
use App\Models\User;

class RoomPolicy
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
        return $user->role === Role::Hotel;
    }

    public function view(User $user, Room $room): bool
    {
        if ($user->role === Role::Hotel) {
            return $user->hotel_id === $room->hotel_id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->role === Role::Hotel;
    }

    public function update(User $user, Room $room): bool
    {
        return $user->role === Role::Hotel && $user->hotel_id === $room->hotel_id;
    }

    public function delete(User $user, Room $room): bool
    {
        return $user->role === Role::Hotel && $user->hotel_id === $room->hotel_id;
    }
}
