import { Head, Link, router, usePage } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, Hash, RefreshCw, WifiOff, XCircle } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { GlassCard } from '@/components/layout/glass-card';
import { verify as scanVerify } from '@/routes/hotel/scan';

type ScanState =
    | { status: 'idle' }
    | { status: 'scanning' }
    | { status: 'success'; url: string }
    | { status: 'error'; message: string };

export default function HotelScan() {
    const page = usePage();
    const [state, setState] = React.useState<ScanState>({ status: 'idle' });
    const [manual, setManual] = React.useState('');
    const [isOnline, setIsOnline] = React.useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
    const scannerRef = React.useRef<Html5Qrcode | null>(null);

    const flashError = (page.props as any)?.flash?.error as string | undefined;

    const openConfirmation = React.useCallback((confirmationRaw: string) => {
        const confirmation = confirmationRaw.trim();

        if (!confirmation) {
            return;
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            try {
                localStorage.setItem('hotel.scan.pendingConfirmation', confirmation);
            } catch {
                void 0;
            }

            setState({
                status: 'error',
                message: 'You are offline. Reconnect to verify this booking.',
            });

            return;
        }

        router.visit(toUrl(scanVerify({ query: { confirmation } })));
    }, []);

    const stop = React.useCallback(async () => {
        const s = scannerRef.current;

        if (!s) {
return;
}

        try {
            await s.stop();
        } catch {
            void 0;
        }

        try {
            await s.clear();
        } catch {
            void 0;
        }
    }, []);

    const start = React.useCallback(async () => {
        await stop();

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setState({ status: 'error', message: 'You are offline. Please reconnect and try again.' });

            return;
        }

        setState({ status: 'scanning' });
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        try {
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 260, height: 260 } },
                async (decodedText) => {
                    await stop();
                    setState({ status: 'success', url: decodedText });
                    openConfirmation(decodedText);
                },
                () => {}
            );
        } catch (e: any) {
            const msg = String(e?.message ?? '');
            const friendly =
                msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')
                    ? 'Camera permission denied. Use manual entry or allow camera access in your browser.'
                    : msg || 'Unable to start scanner.';
            setState({ status: 'error', message: friendly });
        }
    }, [openConfirmation, stop]);

    React.useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    React.useEffect(() => {
        const on = () => setIsOnline(true);
        const off = () => setIsOnline(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);

        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
        };
    }, []);

    React.useEffect(() => {
        if (!isOnline) {
            return;
        }

        let pending = '';

        try {
            pending = localStorage.getItem('hotel.scan.pendingConfirmation') ?? '';
        } catch {
            pending = '';
        }

        if (!pending) {
            return;
        }

        try {
            localStorage.removeItem('hotel.scan.pendingConfirmation');
        } catch {
            void 0;
        }

        queueMicrotask(() => {
            openConfirmation(pending);
        });
    }, [isOnline, openConfirmation]);

    return (
        <PageLayout title="QR Scanner" backHref={toUrl(dashboard())}>
            <Head title="QR Scanner" />

            <div className="mx-auto max-w-4xl space-y-8 pb-10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-info/10">
                            <Camera className="size-6 text-info" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">QR Scanner</h2>
                            <p className="text-muted-foreground text-sm">Scan guest QR to open the booking.</p>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="rounded-full px-5">
                        <Link href={toUrl(dashboard())}>
                            <RefreshCw className="size-4 mr-2" /> Back
                        </Link>
                    </Button>
                </div>

                {!isOnline && (
                    <div className="rounded-3xl border border-warning/20 bg-warning/10 p-4">
                        <div className="flex items-center gap-2 text-warning">
                            <WifiOff className="size-4" />
                            <p className="text-sm font-semibold">You are offline</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Reconnect to verify scanned confirmations. Manual entry is available but cannot be verified offline.
                        </p>
                    </div>
                )}

                {flashError && (
                    <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-4">
                        <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="size-4" />
                            <p className="text-sm font-semibold">Verification failed</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{flashError}</p>
                    </div>
                )}

                <GlassCard className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div
                                id="qr-reader"
                                className="w-full aspect-square max-w-md rounded-3xl border border-border/50 bg-muted/20 overflow-hidden"
                            />

                            <div className="mt-5 flex items-center gap-2">
                                {state.status !== 'scanning' ? (
                                    <Button onClick={start} className="rounded-xl h-11 bg-info hover:bg-info/90 text-info-foreground">
                                        Start scanning
                                    </Button>
                                ) : (
                                    <Button onClick={stop} variant="outline" className="rounded-xl h-11">
                                        Stop
                                    </Button>
                                )}

                                {(state.status === 'success' || state.status === 'error') && (
                                    <Button
                                        onClick={() => {
                                            setState({ status: 'idle' });
                                            setManual('');
                                        }}
                                        variant="outline"
                                        className="rounded-xl h-11"
                                    >
                                        Scan again
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="w-full md:w-[320px] space-y-4">
                            <div className="rounded-3xl border border-border/50 bg-muted/20 p-5">
                                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Hash className="size-4 text-primary" /> Manual fallback
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Paste the QR link here if camera scanning is not available.
                                </p>
                                <div className="mt-4 space-y-3">
                                    <Input
                                        value={manual}
                                        onChange={(e) => setManual(e.target.value)}
                                        placeholder="Paste confirmation number…"
                                        className="h-11 rounded-xl"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (!manual.trim()) {
return;
}

                                            openConfirmation(manual);
                                        }}
                                        className="w-full rounded-xl h-11"
                                    >
                                        Open
                                    </Button>
                                </div>
                            </div>

                            {state.status === 'idle' && (
                                <div className="rounded-3xl border border-border/50 bg-background/40 p-5">
                                    <p className="text-sm text-muted-foreground">
                                        Allow camera permissions when prompted. The QR will open the verified booking page.
                                    </p>
                                </div>
                            )}

                            {state.status === 'error' && (
                                <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-5">
                                    <div className="flex items-center gap-2 text-destructive">
                                        <XCircle className="size-4" />
                                        <p className="text-sm font-semibold">Scanner error</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">{state.message}</p>
                                </div>
                            )}

                            {state.status === 'success' && (
                                <div className="rounded-3xl border border-success/20 bg-success/10 p-5">
                                    <div className="flex items-center gap-2 text-success">
                                        <CheckCircle2 className="size-4" />
                                        <p className="text-sm font-semibold">QR scanned</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 break-all">{state.url}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </PageLayout>
    );
}

HotelScan.layout = (page: React.ReactNode) => page;

