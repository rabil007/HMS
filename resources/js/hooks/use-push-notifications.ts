import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

export type PushStatus =
    | 'loading'
    | 'unsupported'
    | 'needs-install'
    | 'unconfigured'
    | 'denied'
    | 'enabled'
    | 'disabled';

const SERVICE_WORKER_URL = '/sw.js';

function csrfToken(): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? null
    );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const raw = window.atob(base64);
    const output = new Uint8Array(new ArrayBuffer(raw.length));

    for (let i = 0; i < raw.length; i++) {
        output[i] = raw.charCodeAt(i);
    }

    return output;
}

function isIos(): boolean {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean })
            .standalone === true
    );
}

function browserSupportsPush(): boolean {
    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

async function sendJson(
    url: string,
    method: 'POST' | 'DELETE',
    body: unknown,
): Promise<void> {
    const token = csrfToken();
    const res = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'X-CSRF-TOKEN': token } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
    }
}

export function usePushNotifications() {
    const publicKey = ((usePage().props as any)?.webPush?.publicKey ?? null) as
        | string
        | null;
    const [status, setStatus] = useState<PushStatus>('loading');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!browserSupportsPush()) {
            setStatus(
                isIos() && !isStandalone() ? 'needs-install' : 'unsupported',
            );

            return;
        }

        if (!publicKey) {
            setStatus('unconfigured');

            return;
        }

        if (Notification.permission === 'denied') {
            setStatus('denied');

            return;
        }

        const registration =
            await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
        const subscription = await registration?.pushManager.getSubscription();

        setStatus(
            subscription && Notification.permission === 'granted'
                ? 'enabled'
                : 'disabled',
        );
    }, [publicKey]);

    useEffect(() => {
        queueMicrotask(() => {
            void refresh();
        });
    }, [refresh]);

    const enable = useCallback(async () => {
        if (!publicKey) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setStatus(permission === 'denied' ? 'denied' : 'disabled');

                return;
            }

            const registration = await navigator.serviceWorker.register(
                SERVICE_WORKER_URL,
                { scope: '/' },
            );
            await navigator.serviceWorker.ready;

            const subscription =
                (await registration.pushManager.getSubscription()) ??
                (await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey),
                }));

            const json = subscription.toJSON();
            const encodings =
                (
                    PushManager as unknown as {
                        supportedContentEncodings?: string[];
                    }
                ).supportedContentEncodings ?? [];

            await sendJson('/push-subscriptions', 'POST', {
                endpoint: json.endpoint,
                keys: json.keys,
                contentEncoding:
                    encodings.includes('aes128gcm') || encodings.length === 0
                        ? 'aes128gcm'
                        : 'aesgcm',
            });

            setStatus('enabled');
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Could not turn on push notifications.',
            );
            await refresh();
        } finally {
            setBusy(false);
        }
    }, [publicKey, refresh]);

    const disable = useCallback(async () => {
        setBusy(true);
        setError(null);

        try {
            const registration =
                await navigator.serviceWorker.getRegistration(
                    SERVICE_WORKER_URL,
                );
            const subscription =
                await registration?.pushManager.getSubscription();

            if (subscription) {
                await sendJson('/push-subscriptions', 'DELETE', {
                    endpoint: subscription.endpoint,
                });
                await subscription.unsubscribe();
            }

            setStatus('disabled');
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Could not turn off push notifications.',
            );
        } finally {
            setBusy(false);
        }
    }, []);

    return { status, busy, error, enable, disable };
}
