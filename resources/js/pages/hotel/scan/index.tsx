import { Head, Link, router } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, Hash, RefreshCw, XCircle } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { verify as scanVerify } from '@/routes/hotel/scan';

type ScanState =
    | { status: 'idle' }
    | { status: 'scanning' }
    | { status: 'success'; url: string }
    | { status: 'error'; message: string };

export default function HotelScan() {
    const [state, setState] = React.useState<ScanState>({ status: 'idle' });
    const [manual, setManual] = React.useState('');
    const scannerRef = React.useRef<Html5Qrcode | null>(null);

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
                    const confirmation = decodedText.trim();
                    router.visit(toUrl(scanVerify({ query: { confirmation } })));
                },
                () => {}
            );
        } catch (e: any) {
            setState({ status: 'error', message: e?.message ?? 'Unable to start scanner.' });
        }
    }, [stop]);

    React.useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return (
        <PageLayout title="QR Scanner" backHref={toUrl(dashboard())}>
            <Head title="QR Scanner" />

            <div className="max-w-[900px] mx-auto space-y-8 pb-10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10">
                            <Camera className="size-6 text-sky-500" />
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

                <div className="rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div
                                id="qr-reader"
                                className="w-full aspect-square max-w-[420px] rounded-3xl border border-border/50 bg-muted/20 overflow-hidden"
                            />

                            <div className="mt-5 flex items-center gap-2">
                                {state.status !== 'scanning' ? (
                                    <Button onClick={start} className="rounded-xl h-11 bg-sky-500 hover:bg-sky-600 text-white">
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

                                            const confirmation = manual.trim();
                                            router.visit(toUrl(scanVerify({ query: { confirmation } })));
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
                                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <XCircle className="size-4" />
                                        <p className="text-sm font-semibold">Scanner error</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">{state.message}</p>
                                </div>
                            )}

                            {state.status === 'success' && (
                                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <CheckCircle2 className="size-4" />
                                        <p className="text-sm font-semibold">QR scanned</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 break-all">{state.url}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

HotelScan.layout = (page: React.ReactNode) => page;

