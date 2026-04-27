<?php

namespace App\Http\Controllers\Settings;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Services\EmailSettings;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class EmailNotificationsController extends Controller
{
    public function update(Request $request, EmailSettings $settings): RedirectResponse
    {
        if (($request->user()?->role ?? null) !== Role::Admin->value) {
            abort(403);
        }

        $enabled = (bool) $request->boolean('enabled');
        $settings->setEnabled($enabled);

        return back()->with('success', $enabled ? 'Emails enabled.' : 'Emails disabled.');
    }
}

