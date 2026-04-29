<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->trim()->toString();
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $perPage = $request->integer('per_page') ?: 15;
        $perPage = in_array($perPage, [15, 30, 50, 100], true) ? $perPage : 15;

        $allowedSorts = [
            'name' => 'name',
            'created_at' => 'created_at',
        ];
        $sort = array_key_exists($sort, $allowedSorts) ? $sort : 'name';

        $query = Client::query()
            ->when($q !== '', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->orderBy($allowedSorts[$sort], $dir);

        $clients = $query
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/clients/index', [
            'clients' => $clients,
            'filters' => [
                'q' => $q,
                'sort' => $sort,
                'dir' => $dir,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/clients/create');
    }

    public function show(Client $client)
    {
        $activitiesRaw = $client->activities()
            ->with('causer')
            ->latest()
            ->get();

        $userIds = $activitiesRaw
            ->flatMap(function ($a) {
                $changes = $a->attribute_changes?->toArray() ?? [];
                if (! isset($changes['old']) && ! isset($changes['attributes'])) {
                    $changes = [
                        'old' => $a->properties['old'] ?? null,
                        'attributes' => $a->properties['attributes'] ?? null,
                    ];
                }

                $attrs = is_array($changes['attributes'] ?? null) ? $changes['attributes'] : [];
                $old = is_array($changes['old'] ?? null) ? $changes['old'] : [];

                return collect([$attrs, $old])
                    ->flatMap(fn (array $arr) => collect($arr)->filter(fn ($v, $k) => $k === 'user_id' || str_ends_with((string) $k, '_user_id'))->values());
            })
            ->filter(fn ($v) => is_numeric($v))
            ->map(fn ($v) => (int) $v)
            ->unique()
            ->values();

        return Inertia::render('admin/clients/show', [
            'client' => $client->loadCount(['users', 'bookings'])->only(['id', 'name', 'created_at', 'users_count', 'bookings_count']),
            'activities' => $activitiesRaw->map(function ($a) {
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
            'activityLookups' => [
                'users' => User::query()->whereIn('id', $userIds)->pluck('name', 'id'),
            ],
        ]);
    }

    public function store(StoreClientRequest $request)
    {
        Client::query()->create($request->validated());

        return redirect()->route('admin.clients.index')->with('success', 'Client created.');
    }

    public function edit(Client $client)
    {
        return Inertia::render('admin/clients/edit', [
            'client' => $client->only(['id', 'name']),
        ]);
    }

    public function update(UpdateClientRequest $request, Client $client)
    {
        $client->update($request->validated());

        return redirect()->route('admin.clients.index')->with('success', 'Client updated.');
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->route('admin.clients.index')->with('success', 'Client deleted.');
    }
}
