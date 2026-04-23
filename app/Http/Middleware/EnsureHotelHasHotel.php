<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHotelHasHotel
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->role === Role::Hotel) {
            if (! $request->user()->hotel_id) {
                abort(403, 'Hotel user must be assigned to a hotel.');
            }
        }

        return $next($request);
    }
}
