<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\DashboardIconSizeSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardIconSizeController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'size' => ['required', 'in:sm,md,lg'],
        ]);

        app(DashboardIconSizeSettings::class)->setForUser($request->user(), $validated['size']);

        return back()->with('success', 'Dashboard icon size updated.');
    }
}

