<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    public const SESSION_KEY = 'impersonator_id';

    /**
     * Let an admin sign in as a hotel or client user to test their portal.
     */
    public function start(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();

        if ($user->role === Role::Admin || $user->is($admin)) {
            return back()->with('error', 'You can only log in as a hotel or client user.');
        }

        if ($user->role === Role::Hotel && ! $user->hotel_id) {
            return back()->with('error', 'Assign this hotel user to a hotel before logging in as them.');
        }

        $request->session()->put(self::SESSION_KEY, $admin->id);
        Auth::guard('web')->login($user);

        return redirect()->route('dashboard')->with('success', "You are now viewing the app as {$user->name}.");
    }

    /**
     * Return to the admin account that started the impersonation.
     */
    public function leave(Request $request): RedirectResponse
    {
        $adminId = $request->session()->pull(self::SESSION_KEY);
        $admin = $adminId ? User::query()->find($adminId) : null;

        if (! $admin || $admin->role !== Role::Admin) {
            return redirect()->route('dashboard');
        }

        Auth::guard('web')->login($admin);

        return redirect()->route('admin.users.index')->with('success', 'Welcome back to the admin portal.');
    }
}
