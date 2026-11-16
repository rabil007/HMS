import { Form, Head, router } from '@inertiajs/react';
import { Mail, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MailSettings = {
    source: 'env' | 'database';
    mailer: 'smtp' | 'sendmail' | 'log';
    host: string;
    port: number | null;
    username: string;
    encryption: 'tls' | 'ssl' | 'none';
    from_address: string;
    from_name: string;
    password_set: boolean;
};

const selectClass =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs';

export default function EmailSettings({
    emailNotificationsEnabled,
    mailSettings,
}: {
    emailNotificationsEnabled: boolean;
    mailSettings: MailSettings;
}) {
    const [mailer, setMailer] = useState(mailSettings.mailer);
    const smtp = mailer === 'smtp';

    return (
        <>
            <Head title="Email settings" />

            <h1 className="sr-only">Email settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Email notifications"
                    description="Enable or disable sending emails from the system"
                />

                <Form
                    action="/settings/email-notifications"
                    method="put"
                    options={{ preserveScroll: true }}
                    className="space-y-4"
                >
                    {({ processing }) => (
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/40 p-5">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-foreground">
                                    Send emails
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    When disabled, booking emails will not be
                                    sent.
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        name="enabled"
                                        defaultChecked={
                                            emailNotificationsEnabled
                                        }
                                    />
                                    Enabled
                                </label>
                                <Button type="submit" disabled={processing}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Heading
                        variant="small"
                        title="Mail server"
                        description="The server used to send emails. Saved here, these override the .env file."
                    />
                    <Badge
                        variant={
                            mailSettings.source === 'database'
                                ? 'default'
                                : 'secondary'
                        }
                    >
                        {mailSettings.source === 'database'
                            ? 'Using saved settings'
                            : 'Using .env values'}
                    </Badge>
                </div>

                <Form
                    action="/settings/email"
                    method="put"
                    options={{ preserveScroll: true }}
                    resetOnSuccess={['password']}
                    className="space-y-5 rounded-2xl border border-border/50 bg-card/40 p-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="mailer">Mail driver</Label>
                                <select
                                    id="mailer"
                                    name="mailer"
                                    value={mailer}
                                    onChange={(e) =>
                                        setMailer(
                                            e.target
                                                .value as MailSettings['mailer'],
                                        )
                                    }
                                    className={selectClass}
                                >
                                    <option value="smtp">SMTP</option>
                                    <option value="sendmail">Sendmail</option>
                                    <option value="log">
                                        Log only (no emails sent)
                                    </option>
                                </select>
                                <InputError message={errors.mailer} />
                            </div>

                            <div className={smtp ? 'space-y-5' : 'hidden'}>
                                <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                                    <div className="grid gap-2">
                                        <Label htmlFor="host">Host</Label>
                                        <Input
                                            id="host"
                                            name="host"
                                            defaultValue={mailSettings.host}
                                            placeholder="smtp.example.com"
                                            autoComplete="off"
                                        />
                                        <InputError message={errors.host} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="port">Port</Label>
                                        <Input
                                            id="port"
                                            name="port"
                                            type="number"
                                            min={1}
                                            max={65535}
                                            defaultValue={
                                                mailSettings.port ?? ''
                                            }
                                            placeholder="587"
                                        />
                                        <InputError message={errors.port} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="encryption">
                                        Encryption
                                    </Label>
                                    <select
                                        id="encryption"
                                        name="encryption"
                                        defaultValue={mailSettings.encryption}
                                        className={selectClass}
                                    >
                                        <option value="tls">
                                            TLS / STARTTLS (usually port 587)
                                        </option>
                                        <option value="ssl">
                                            SSL (usually port 465)
                                        </option>
                                        <option value="none">None</option>
                                    </select>
                                    <InputError message={errors.encryption} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="username">
                                            Username
                                        </Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            defaultValue={mailSettings.username}
                                            autoComplete="off"
                                        />
                                        <InputError message={errors.username} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder={
                                                mailSettings.password_set
                                                    ? '•••••••• (saved)'
                                                    : 'Not set'
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {mailSettings.password_set
                                                ? 'Leave blank to keep the current password.'
                                                : 'Stored encrypted.'}
                                        </p>
                                        <InputError message={errors.password} />
                                    </div>
                                </div>
                            </div>

                            {!smtp && (
                                <input
                                    type="hidden"
                                    name="encryption"
                                    value={mailSettings.encryption}
                                />
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="from_address">
                                        From address
                                    </Label>
                                    <Input
                                        id="from_address"
                                        name="from_address"
                                        type="email"
                                        required
                                        defaultValue={mailSettings.from_address}
                                        placeholder="bookings@example.com"
                                    />
                                    <InputError message={errors.from_address} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="from_name">From name</Label>
                                    <Input
                                        id="from_name"
                                        name="from_name"
                                        defaultValue={mailSettings.from_name}
                                    />
                                    <InputError message={errors.from_name} />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    data-test="save-mail-settings"
                                >
                                    Save email settings
                                </Button>

                                {mailSettings.source === 'database' && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            router.delete('/settings/email', {
                                                preserveScroll: true,
                                            })
                                        }
                                    >
                                        <RotateCcw className="size-4" />
                                        Reset to .env values
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Send a test email"
                    description="Sends right away with the saved settings, so save any changes first"
                />

                <Form
                    action="/settings/email/test"
                    method="post"
                    options={{ preserveScroll: true }}
                    className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/40 p-5 sm:flex-row sm:items-start"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="test_to" className="sr-only">
                                    Send test email to
                                </Label>
                                <Input
                                    id="test_to"
                                    name="to"
                                    type="email"
                                    placeholder="Your account email"
                                />
                                <InputError message={errors.to} />
                            </div>
                            <Button
                                type="submit"
                                variant="secondary"
                                disabled={processing}
                                data-test="send-test-email"
                            >
                                <Mail className="size-4" />
                                {processing ? 'Sending…' : 'Send test email'}
                            </Button>
                        </>
                    )}
                </Form>
                {!emailNotificationsEnabled && (
                    <p className="text-xs text-muted-foreground">
                        "Send emails" is off, so booking emails are not sent.
                        The test email is still sent.
                    </p>
                )}
            </div>
        </>
    );
}

EmailSettings.layout = {
    breadcrumbs: [
        {
            title: 'Email settings',
            href: '/settings/email',
        },
    ],
};
