import { Link, usePage } from '@inertiajs/react';
import { Building2, Star, Wifi, Car, Utensils } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const amenities = [
    { icon: Wifi, label: 'High-Speed WiFi' },
    { icon: Car, label: 'Valet Parking' },
    { icon: Utensils, label: 'Fine Dining' },
];

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid min-h-dvh flex-col items-center justify-center lg:grid-cols-2 bg-background text-foreground">
            {/* ── Left Panel (hidden on mobile) ───────────────────── */}
            <div className="relative hidden h-full flex-col lg:flex overflow-hidden">
                {/* Background image */}
                <div
                    className="absolute inset-0 bg-zinc-900 bg-cover bg-center scale-105"
                    style={{ backgroundImage: "url('/images/auth-bg.png')" }}
                />

                {/* Multi-layer gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-slate-900/80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                {/* Ambient glow accents */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none" />

                {/* Decorative grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />

                {/* Content */}
                <div className="relative z-20 flex flex-col h-full p-10">
                    {/* Logo */}
                    <Link
                        href={home()}
                        className="flex items-center gap-3 group w-fit"
                    >
                        <AppLogoIcon className="h-14 w-auto drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-105" />
                    </Link>

                    {/* Center badge */}
                    <div className="flex-1 flex flex-col items-start justify-center mt-8">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                            <Building2 className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-xs font-semibold tracking-widest text-amber-300 uppercase">
                                Hotel Management
                            </span>
                        </div>

                        <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-5 max-w-sm drop-shadow-lg">
                            The Art of{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                                Perfect
                            </span>{' '}
                            Hospitality.
                        </h2>

                        <p className="text-zinc-300 text-base leading-relaxed max-w-sm mb-8">
                            Manage your hotel operations with elegance. From bookings to guest experiences, all in one premium platform.
                        </p>

                        {/* Amenity chips */}
                        <div className="flex flex-wrap gap-3">
                            {amenities.map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2"
                                >
                                    <Icon className="h-3.5 w-3.5 text-amber-300" />
                                    <span className="text-xs font-medium text-zinc-200 tracking-wide">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom testimonial */}
                    <div className="mt-auto pt-8 border-t border-white/10">
                        <div className="flex items-start gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <blockquote className="max-w-sm">
                            <p className="text-[15px] font-medium leading-relaxed text-zinc-100 italic">
                                "Experience unparalleled luxury and seamless hospitality. Your premium stay begins the moment you check in."
                            </p>
                            <footer className="mt-3 text-xs font-semibold tracking-widest text-amber-400/80 uppercase">
                                Overseas Marine Services
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* ── Right Panel ─────────────────────────────────────── */}
            <div className="relative w-full flex items-center justify-center min-h-dvh px-6 py-12 sm:px-10 lg:px-16 overflow-hidden bg-zinc-50 dark:bg-[#0B0F19]">
                {/* Ambient blobs */}
                <div className="absolute top-[-15%] right-[-15%] w-[28rem] h-[28rem] bg-blue-500/8 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-15%] left-[-15%] w-[28rem] h-[28rem] bg-indigo-500/8 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] h-[20rem] bg-amber-500/4 dark:bg-amber-500/6 rounded-full blur-[100px] pointer-events-none" />

                {/* Card */}
                <div className="relative z-10 mx-auto w-full max-w-[420px]">
                    {/* Mobile logo */}
                    <Link
                        href={home()}
                        className="flex items-center justify-center mb-8 lg:hidden"
                    >
                        <AppLogoIcon className="h-14 w-auto drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                    </Link>

                    {/* Glass card */}
                    <div className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-700/50 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/50 p-8 sm:p-10">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full px-3 py-1 mb-4">
                                <Building2 className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                <span className="text-[10px] font-bold tracking-widest text-amber-700 dark:text-amber-400 uppercase">
                                    HMS Portal
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                                {title}
                            </h1>
                            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                                {description}
                            </p>
                        </div>

                        {/* Slot */}
                        {children}
                    </div>

                    {/* Footer note */}
                    <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
                        &copy; {new Date().getFullYear()} Overseas Marine Services. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
