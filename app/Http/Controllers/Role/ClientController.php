<?php

namespace App\Http\Controllers\Role;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index()
    {
        $clients = Client::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('role/clients/index', [
            'clients' => $clients,
        ]);
    }

    public function create()
    {
        return Inertia::render('role/clients/create');
    }

    public function store(StoreClientRequest $request)
    {
        Client::query()->create($request->validated());

        return redirect()->route('role.clients.index');
    }

    public function edit(Client $client)
    {
        return Inertia::render('role/clients/edit', [
            'client' => $client->only(['id', 'name']),
        ]);
    }

    public function update(UpdateClientRequest $request, Client $client)
    {
        $client->update($request->validated());

        return redirect()->route('role.clients.index');
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->route('role.clients.index');
    }
}
