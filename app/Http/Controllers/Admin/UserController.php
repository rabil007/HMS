<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->where('role', '!=', Role::Admin->value)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'role', 'hotel_id', 'client_id']);

        return Inertia::render('admin/users/index', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/create', [
            'roles' => [Role::Admin->value, Role::Hotel->value, Role::Client->value],
            'hotels' => Hotel::query()->orderBy('name')->get(['id', 'name']),
            'clients' => Client::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();

        $role = $data['role'];
        $data['hotel_id'] = $role === Role::Hotel->value ? ($data['hotel_id'] ?? null) : null;
        $data['client_id'] = $role === Role::Client->value ? ($data['client_id'] ?? null) : null;

        $data['password'] = Hash::make($data['password']);

        User::query()->create($data);

        return redirect()->route('admin.users.index')->with('success', 'User created.');
    }

    public function edit(User $user)
    {
        return Inertia::render('admin/users/edit', [
            'user' => $user->only(['id', 'name', 'email', 'role', 'hotel_id', 'client_id']),
            'roles' => [Role::Admin->value, Role::Hotel->value, Role::Client->value],
            'hotels' => Hotel::query()->orderBy('name')->get(['id', 'name']),
            'clients' => Client::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        $role = $data['role'];
        $data['hotel_id'] = $role === Role::Hotel->value ? ($data['hotel_id'] ?? null) : null;
        $data['client_id'] = $role === Role::Client->value ? ($data['client_id'] ?? null) : null;

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return redirect()->route('admin.users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }
}

