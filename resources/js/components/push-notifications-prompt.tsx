import { usePage } from '@inertiajs/react';
import { BellRing } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { sendJson, usePushNotifications } from '@/hooks/use-push-notifications';

const SHOWN_THIS_SESSION_KEY = 'push-prompt-shown';

function shownThisSession(): boolean {
    try {
        return window.sessionStorage.getItem(SHOWN_THIS_SESSION_KEY) === '1';
    } catch {
        return false;
    }
}

function markShownThisSession(): void {
    try {
        window.sessionStorage.setItem(SHOWN_THIS_SESSION_KEY, '1');
    } catch {
        void 0;
    }
}

/**
 * Asks users to turn on push when they land on the dashboard and this device
 * isn't subscribed yet. "Skip" is remembered for the user on the server, so it
 * never asks again; closing the dialog only hides it until the next login.
 */
export default function PushNotificationsPrompt() {
    const promptDismissed = Boolean(
        (usePage().props as any)?.webPush?.promptDismissed ?? true,
    );
    const { status, busy, enable } = usePushNotifications();
    const [closed, setClosed] = useState(false);
    const [skipping, setSkipping] = useState(false);

    const open =
        !closed &&
        !promptDismissed &&
        status === 'disabled' &&
        !shownThisSession();

    const close = () => {
        markShownThisSession();
        setClosed(true);
    };

    const skip = async () => {
        setSkipping(true);

        try {
            await sendJson('/push-subscriptions/prompt/dismiss', 'POST', {});
        } catch {
            void 0;
        } finally {
            setSkipping(false);
            close();
        }
    };

    const turnOn = async () => {
        await enable();
        close();
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !next && close()}>
            <DialogContent className="sm:max-w-md" data-test="push-prompt">
                <DialogHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-background/30">
                        <BellRing className="size-6 text-primary" />
                    </div>
                    <DialogTitle>Turn on push notifications?</DialogTitle>
                    <DialogDescription>
                        Get booking requests, approvals, check-ins and
                        check-outs on this device, even when the app is closed.
                        If you skip, we won&apos;t ask again. You can turn them
                        on any time in Settings → Profile.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy || skipping}
                        onClick={() => void skip()}
                    >
                        Skip
                    </Button>
                    <Button
                        type="button"
                        disabled={busy || skipping}
                        onClick={() => void turnOn()}
                    >
                        Enable push notifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
