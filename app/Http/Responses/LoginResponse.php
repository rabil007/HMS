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

        if ($user?->role === Role::Hotel) {
            $request->session()->forget('url.intended');
            return redirect($target);
        }

        return redirect()->intended($target);
    }
}

