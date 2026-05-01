import { Link, usePage } from '@inertiajs/react';
import { Building2, Star, Wifi, Car, Utensils } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
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
    usePage();

    return (
        <div className="relative grid min-h-dvh flex-col items-center justify-center lg:grid-cols-2 bg-background text-foreground">
            {/* ── Left Panel (hidden on mobile) ───────────────────── */}
            <div className="relative hidden h-full flex-col lg:flex overflow-hidden">
                {/* Background image */}
                <div
                    className="absolute inset-0 bg-background bg-cover bg-center scale-105"
                    style={{ backgroundImage: "url('/images/auth-bg.png')" }}
                />

                {/* Multi-layer gradient overlays */}
                <div className="absolute inset-0 bg-linear-to-br from-black/70 via-black/40 to-slate-900/80" />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent" />

                {/* Ambient glow accents */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

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
                        href="/"
                        className="flex items-center gap-3 group w-fit"
                    >
                        <AppLogoIcon className="h-14 w-auto drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
                    </Link>

                    {/* Center badge */}
                    <div className="flex-1 flex flex-col items-start justify-center mt-8">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                                Hotel Management
                            </span>
                        </div>

                        <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-5 max-w-sm drop-shadow-lg">
                            The Art of{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary/80 to-primary">
                                Perfect
                            </span>{' '}
                            Hospitality.
                        </h2>

                        <p className="text-muted-foreground text-base leading-relaxed max-w-sm mb-8">
                            Manage your hotel operations with elegance. From bookings to guest experiences, all in one premium platform.
                        </p>

                        {/* Amenity chips */}
                        <div className="flex flex-wrap gap-3">
                            {amenities.map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2"
                                >
                                    <Icon className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-xs font-medium text-foreground tracking-wide">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom testimonial */}
                    <div className="mt-auto pt-8 border-t border-white/10">
                        <div className="flex items-start gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                            ))}
                        </div>
                        <blockquote className="max-w-sm">
                            <p className="text-[15px] font-medium leading-relaxed text-foreground italic">
                                "Experience unparalleled luxury and seamless hospitality. Your premium stay begins the moment you check in."
                            </p>
                            <footer className="mt-3 text-xs font-semibold tracking-widest text-primary/80 uppercase">
                                Overseas Marine Services
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* ── Right Panel ─────────────────────────────────────── */}
            <div className="relative w-full flex items-center justify-center min-h-dvh px-6 py-12 sm:px-10 lg:px-16 overflow-hidden bg-background">
                {/* Ambient blobs */}
                <div className="absolute top-[-15%] right-[-15%] w-[448px] h-112 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-15%] left-[-15%] w-[448px] h-112 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                {/* Card */}
                <div className="relative z-10 mx-auto w-full max-w-md">
                    {/* Mobile logo */}
                    <Link
                        href="/"
                        className="flex items-center justify-center mb-8 lg:hidden"
                    >
                        <AppLogoIcon className="h-14 w-auto drop-shadow-sm" />
                    </Link>

                    {/* Glass card */}
                    <div className="bg-card/80 backdrop-blur-2xl border border-border/60 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/50 p-8 sm:p-10">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-border/60 rounded-full px-3 py-1 mb-4">
                                <Building2 className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                                    HMS Portal
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
                                {title}
                            </h1>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>

                        {/* Slot */}
                        {children}
                    </div>

                    {/* Footer note */}
                    <p className="mt-6 text-center text-xs text-muted-foreground/70">
                        &copy; {new Date().getFullYear()} Overseas Marine Services. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
