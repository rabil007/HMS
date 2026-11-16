import { Head, router } from '@inertiajs/react';
import { Laptop, Send, Smartphone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import {
    PushDeviceCard,
    TestResult,
    useTestPush,
} from '@/components/push-notifications-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

type PushDevice = {
    id: number;
    endpoint: string;
    browser: string;
    platform: string;
    added_at: string | null;
    last_used_at: string | null;
};

const MOBILE = ['iPhone', 'iPad', 'Android'];

function formatDate(value: string | null, withTime = false): string {
    if (!value) {
        return 'unknown';
    }

    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        ...(withTime ? { timeStyle: 'short' as const } : {}),
    });
}

export default function NotificationSettings({
    pushDevices,
}: {
    pushDevices: PushDevice[];
}) {
    const push = usePushNotifications();
    const testAll = useTestPush();
    const [removingId, setRemovingId] = useState<number | null>(null);

    const reloadDevices = () => router.reload({ only: ['pushDevices'] });

    const remove = async (device: PushDevice) => {
        setRemovingId(device.id);

        if (device.endpoint === push.endpoint) {
            // This device: also unsubscribe in the browser.
            await push.disable();
            reloadDevices();
            setRemovingId(null);

            return;
        }

        router.delete(`/push-subscriptions/${device.id}`, {
            preserveScroll: true,
            onFinish: () => setRemovingId(null),
        });
    };

    return (
        <>
            <Head title="Notification settings" />

            <h1 className="sr-only">Notification settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Push notifications"
                    description="Booking alerts on your browser or phone, including when the app is closed"
                />

                <PushDeviceCard
                    push={push}
                    registeredEndpoints={pushDevices.map((d) => d.endpoint)}
                    onChange={reloadDevices}
                />
            </div>

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <Heading
                        variant="small"
                        title="Your devices"
                        description="Every browser or phone where you turned push on gets your alerts"
                    />

                    {pushDevices.length > 1 && (
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={testAll.testing}
                            onClick={() => void testAll.run(null)}
                            data-test="test-push-all-button"
                        >
                            <Send className="size-4" />
                            {testAll.testing
                                ? 'Sending…'
                                : 'Send test to all devices'}
                        </Button>
                    )}
                </div>

                <TestResult result={testAll.result} />

                {pushDevices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground">
                        No devices yet. Turn push on above to add this one.
                    </div>
                ) : (
                    <ul className="divide-y divide-border/50 rounded-2xl border border-border/50 bg-card/40">
                        {pushDevices.map((device) => {
                            const current = device.endpoint === push.endpoint;
                            const Icon = MOBILE.includes(device.platform)
                                ? Smartphone
                                : Laptop;

                            return (
                                <li
                                    key={device.id}
                                    className="flex items-center justify-between gap-4 p-4"
                                    data-test="push-device"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 space-y-0.5">
                                            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                                {device.browser} on{' '}
                                                {device.platform}
                                                {current && (
                                                    <Badge variant="secondary">
                                                        This device
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Added{' '}
                                                {formatDate(device.added_at)}
                                                {' · '}Last active{' '}
                                                {formatDate(
                                                    device.last_used_at,
                                                    true,
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={removingId === device.id}
                                        onClick={() => void remove(device)}
                                        aria-label={`Remove ${device.browser} on ${device.platform}`}
                                    >
                                        <Trash2 className="size-4" />
                                        Remove
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </>
    );
}

NotificationSettings.layout = {
    breadcrumbs: [
        {
            title: 'Notification settings',
            href: '/settings/notifications',
        },
    ],
};
