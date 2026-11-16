import { BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import type { PushStatus } from '@/hooks/use-push-notifications';

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

export default function PushNotificationsToggle() {
    const { status, busy, error, enable, disable } = usePushNotifications();

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/40 p-5 sm:flex-row sm:items-center sm:justify-between">
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
                    {HINTS[status]}
                </div>
                {error && (
                    <div className="text-xs text-destructive">{error}</div>
                )}
            </div>

            {status === 'enabled' ? (
                <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void disable()}
                >
                    Turn off
                </Button>
            ) : status === 'disabled' ? (
                <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void enable()}
                    data-test="enable-push-button"
                >
                    Enable push notifications
                </Button>
            ) : null}
        </div>
    );
}
