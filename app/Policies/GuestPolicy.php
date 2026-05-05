<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Guest;
use App\Models\User;

class GuestPolicy
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
        return $user->role === Role::Client;
    }

    public function view(User $user, Guest $guest): bool
    {
        return $user->role === Role::Client;
    }

    public function create(User $user): bool
    {
        return $user->role === Role::Client;
    }

    public function update(User $user, Guest $guest): bool
    {
        return $user->role === Role::Client;
    }

    public function delete(User $user, Guest $guest): bool
    {
        return $user->role === Role::Client;
    }
}
