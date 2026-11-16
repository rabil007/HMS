<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\EmailSettings;
use App\Services\MailSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class EmailSettingsController extends Controller
{
    public function edit(Request $request, EmailSettings $emails, MailSettings $mail): Response
    {
        return Inertia::render('settings/email', [
            'emailNotificationsEnabled' => $emails->enabled(),
            'mailSettings' => $mail->forForm(),
        ]);
    }

    public function update(Request $request, MailSettings $mail): RedirectResponse
    {
        $smtp = $request->input('mailer') === 'smtp';

        $validated = $request->validate([
            'mailer' => ['required', Rule::in(MailSettings::MAILERS)],
            'host' => [Rule::requiredIf($smtp), 'nullable', 'string', 'max:255'],
            'port' => [Rule::requiredIf($smtp), 'nullable', 'integer', 'between:1,65535'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
            'encryption' => ['required', Rule::in(MailSettings::ENCRYPTIONS)],
            'from_address' => ['required', 'email', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:255'],
        ]);

        $mail->save($validated);

        return back()->with('success', 'Email settings saved.');
    }

    public function destroy(MailSettings $mail): RedirectResponse
    {
        $mail->reset();

        return back()->with('success', 'Email settings reset. The server .env values are used again.');
    }

    /**
     * Send a test email right away (not queued), using the saved settings.
     */
    public function test(Request $request, MailSettings $mail): RedirectResponse
    {
        $validated = $request->validate([
            'to' => ['nullable', 'email', 'max:255'],
        ]);

        $to = $validated['to'] ?? $request->user()->email;

        $mail->apply(refreshMailers: true);

        try {
            Mail::raw(
                'This is a test email from '.config('app.name').'. If you can read this, your email settings work.',
                fn ($message) => $message->to($to)->subject('Test email from '.config('app.name')),
            );
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Test email failed: '.$e->getMessage());
        }

        $note = config('mail.default') === 'log'
            ? ' The mail driver is "log", so it was written to the log file instead of being delivered.'
            : '';

        return back()->with('success', "Test email sent to {$to}.{$note}");
    }
}
