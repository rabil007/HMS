<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->trim()->toString();
        $role = $request->string('role')->toString();
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $perPage = $request->integer('per_page') ?: 15;
        $perPage = in_array($perPage, [15, 30, 50, 100], true) ? $perPage : 15;

        $allowedSorts = [
            'name' => 'name',
            'email' => 'email',
            'role' => 'role',
            'created_at' => 'created_at',
        ];

        $query = User::query()
            ->where('role', '!=', Role::Admin->value)
            ->when(in_array($role, [Role::Hotel->value, Role::Client->value], true), fn ($query) => $query->where('role', $role))
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner
                        ->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->orderBy($allowedSorts[$sort] ?? 'created_at', $dir);

        $users = $query
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'q' => $q,
                'role' => $role,
                'sort' => $sort,
                'dir' => $dir,
                'per_page' => $perPage,
            ],
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

    public function show(User $user)
    {
        if ($user->role === Role::Admin->value) {
            abort(404);
        }

        return Inertia::render('admin/users/show', [
            'user' => $user->load(['hotel:id,name', 'client:id,name'])->only([
                'id',
                'name',
                'email',
                'role',
                'created_at',
                'hotel_id',
                'client_id',
                'hotel',
                'client',
            ]),
            'activities' => $user->activities()
                ->with('causer')
                ->latest()
                ->get()
                ->map(function ($a) {
                    $changes = $a->attribute_changes?->toArray() ?? [];
                    if (! isset($changes['old']) && ! isset($changes['attributes'])) {
                        $changes = [
                            'old' => $a->properties['old'] ?? null,
                            'attributes' => $a->properties['attributes'] ?? null,
                        ];
                    }

                    return [
                        'id' => $a->id,
                        'event' => $a->event,
                        'description' => $a->description,
                        'causer' => $a->causer?->name,
                        'changes' => [
                            'old' => $changes['old'] ?? null,
                            'attributes' => $changes['attributes'] ?? null,
                        ],
                        'created_at' => $a->created_at->toISOString(),
                    ];
                }),
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
