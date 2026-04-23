<?php

namespace App\Http\Responses;

use App\Enums\Role;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        $target = match ($user?->role) {
            Role::Hotel => route('hotel.bookings.index'),
            Role::Client => route('bookings.index'),
            default => route('dashboard'),
        };

        return redirect()->intended($target);
    }
}

