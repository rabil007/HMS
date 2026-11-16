import { BellOff, BellRing, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    sendTestPush,
    usePushNotifications,
} from '@/hooks/use-push-notifications';
import type {
    PushStatus,
    PushTestResult,
} from '@/hooks/use-push-notifications';
import { cn } from '@/lib/utils';

const HINTS: Record<PushStatus, string> = {
    loading: 'Checking this device…',
    unsupported: 'This browser does not support push notifications.',
    'needs-install':
        'On iPhone or iPad, tap Share and then "Add to Home Screen", open the app from there, and turn notifications on.',
    unconfigured: 'Push notifications are not set up on the server yet.',
    denied: 'Notifications are blocked for this site. Allow them in your browser settings, then reload this page.',
    enabled: 'This device gets booking alerts even when the app is closed.',
    disabled: 'Get booking alerts on this device even when the app is closed.',
};

export type PushState = ReturnType<typeof usePushNotifications>;

/**
 * Shows the result of a test push next to the button, and as a toast.
 */
export function useTestPush() {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<PushTestResult | null>(null);

    const run = async (endpoint: string | null) => {
        setTesting(true);
        setResult(null);

        const res = await sendTestPush(endpoint);

        setResult(res);
        setTesting(false);

        if (res.ok) {
            toast.success(res.message);
        } else {
            toast.error(res.message);
        }

        return res;
    };

    return { testing, result, run };
}

export function TestResult({ result }: { result: PushTestResult | null }) {
    if (!result) {
        return null;
    }

    return (
        <div
            role="status"
            className={cn(
                'text-xs',
                result.ok ? 'text-success' : 'text-destructive',
            )}
        >
            {result.message}
        </div>
    );
}

/**
 * Push on/off for the device you are using now, with a test button.
 * When `registeredEndpoints` is given (the user's devices saved on the server)
 * and this device is not among them, it is shown as off so it can be re-enabled.
 */
export function PushDeviceCard({
    push,
    registeredEndpoints,
    onChange,
}: {
    push: PushState;
    registeredEndpoints?: string[];
    onChange?: () => void;
}) {
    const { busy, error, endpoint, enable, disable } = push;
    const test = useTestPush();

    const removedOnServer =
        push.status === 'enabled' &&
        registeredEndpoints !== undefined &&
        (endpoint === null || !registeredEndpoints.includes(endpoint));
    const status: PushStatus = removedOnServer ? 'disabled' : push.status;

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/40 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {status === 'enabled' ? (
                            <BellRing className="size-4" />
                        ) : (
                            <BellOff className="size-4" />
                        )}
                        Push notifications on this device
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {removedOnServer
                            ? 'This device was removed from your account. Turn push on again to get alerts here.'
                            : HINTS[status]}
                    </div>
                    {error && (
                        <div className="text-xs text-destructive">{error}</div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {status === 'enabled' && (
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={busy || test.testing}
                            onClick={() => void test.run(endpoint)}
                            data-test="test-push-button"
                        >
                            <Send className="size-4" />
                            {test.testing
                                ? 'Sending…'
                                : 'Send test notification'}
                        </Button>
                    )}
                    {status === 'enabled' ? (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                                void disable().then(() => onChange?.())
                            }
                        >
                            Turn off
                        </Button>
                    ) : status === 'disabled' ? (
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                                void enable().then(() => onChange?.())
                            }
                            data-test="enable-push-button"
                        >
                            Enable push notifications
                        </Button>
                    ) : null}
                </div>
            </div>

            <TestResult result={test.result} />
        </div>
    );
}

export default function PushNotificationsToggle() {
    const push = usePushNotifications();

    return <PushDeviceCard push={push} />;
}
