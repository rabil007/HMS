<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Hotel;
use App\Models\User;

class HotelPolicy
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

    public function view(User $user, Hotel $hotel): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Hotel $hotel): bool
    {
        if ($user->role === Role::Hotel) {
            return $user->hotel_id === $hotel->id;
        }

        return false;
    }

    public function delete(User $user, Hotel $hotel): bool
    {
        return false;
    }
}
