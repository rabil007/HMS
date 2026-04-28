import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    CalendarDays,
    LayoutDashboard,
    Anchor,
    BarChart3,
    Building2,
    Hotel as HotelIcon,
    Users as UsersIcon,
    UserRoundCog,
    Globe,
    Settings,
    ClipboardCheck,
} from 'lucide-react';
import React from 'react';
import AppNavbar from '@/components/app-navbar';
import AppWallpaper from '@/components/app-wallpaper';
import { toUrl } from '@/lib/utils';
import { overview } from '@/routes';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as countriesIndex } from '@/routes/admin/countries';
import { index as hotelsIndex } from '@/routes/admin/hotels';
import { index as ranksIndex } from '@/routes/admin/ranks';
import { index as bookingReportIndex } from '@/routes/admin/reports/bookings';
import { index as usersIndex } from '@/routes/admin/users';
import { index as vesselsIndex } from '@/routes/admin/vessels';
import { calendar as bookingsCalendar, index as bookingsIndex } from '@/routes/bookings';
import { scan as hotelScan } from '@/routes/hotel';
import { index as hotelBookingsIndex } from '@/routes/hotel/bookings';
import { index as hotelStaysIndex } from '@/routes/hotel/stays';
import { edit as settingsProfileEdit } from '@/routes/profile';

type DashboardModule = {
    id: string;
    name: string;
    icon: any;
    color: string;
    href: any;
};

function glassColor(gradientClass: string): { bg: string; icon: string } {
    const map: Record<string, { bg: string; icon: string }> = {
        'from-blue-600 to-indigo-700': {
            bg: 'color-mix(in oklch, var(--chart-3), transparent 82%)',
            icon: 'var(--chart-2)',
        },
        'from-amber-500 to-orange-600': {
            bg: 'color-mix(in oklch, var(--status-pending), transparent 82%)',
            icon: 'var(--status-pending)',
        },
        'from-emerald-500 to-teal-600': {
            bg: 'color-mix(in oklch, var(--status-confirmed), transparent 82%)',
            icon: 'var(--status-confirmed)',
        },
        'from-sky-500 to-indigo-600': {
            bg: 'color-mix(in oklch, var(--chart-2), transparent 82%)',
            icon: 'var(--chart-2)',
        },
        'from-slate-500 to-slate-700': {
            bg: 'color-mix(in oklch, var(--muted-foreground), transparent 86%)',
            icon: 'var(--foreground)',
        },
        'from-slate-600 to-slate-700': {
            bg: 'color-mix(in oklch, var(--muted-foreground), transparent 84%)',
            icon: 'var(--foreground)',
        },
        'from-orange-500 to-amber-600': {
            bg: 'color-mix(in oklch, var(--status-pending), transparent 82%)',
            icon: 'var(--status-pending)',
        },
        'from-fuchsia-600 to-pink-700': {
            bg: 'color-mix(in oklch, var(--chart-4), transparent 82%)',
            icon: 'var(--chart-4)',
        },
        'from-violet-600 to-purple-700': {
            bg: 'color-mix(in oklch, var(--chart-1), transparent 82%)',
            icon: 'var(--chart-1)',
        },
        'from-cyan-500 to-sky-600': {
            bg: 'color-mix(in oklch, var(--chart-2), transparent 82%)',
            icon: 'var(--chart-2)',
        },
        'from-blue-500 to-indigo-600': {
            bg: 'color-mix(in oklch, var(--primary), transparent 80%)',
            icon: 'var(--primary)',
        },
        'from-zinc-600 to-neutral-800': {
            bg: 'color-mix(in oklch, var(--muted-foreground), transparent 86%)',
            icon: 'var(--foreground)',
        },
    };

    return (
        map[gradientClass] ?? { bg: 'color-mix(in oklch, var(--foreground), transparent 90%)', icon: 'var(--foreground)' }
    );
}

export default function Dashboard() {
    const { auth, pendingInboxCount, pendingBookingsCount, dashboardIconSize } = usePage()
        .props as any;
    const user = auth.user as any;
    const iconSize: 'sm' | 'md' | 'lg' =
        dashboardIconSize === 'sm' || dashboardIconSize === 'lg'
            ? dashboardIconSize
            : 'md';

    const tileSizeClass =
        iconSize === 'sm'
            ? 'h-16 w-16 sm:h-[64px] sm:w-[64px]'
            : iconSize === 'lg'
              ? 'h-22 w-22 sm:h-[88px] sm:w-[88px]'
              : 'h-18 w-18 sm:h-[72px] sm:w-[72px]';

    const iconClass =
        iconSize === 'sm'
            ? 'size-7 sm:size-8'
            : iconSize === 'lg'
              ? 'size-9 sm:size-10'
              : 'size-8 sm:size-9';
    const baseModules: DashboardModule[] = [
        {
            id: 'overview',
            name: 'Overview',
            icon: LayoutDashboard,
            color: 'from-slate-600 to-slate-700',
            href: overview(),
        },
        ...(user.role !== 'hotel'
            ? [
                  {
                      id: 'bookings',
                      name: 'Bookings',
                      icon: CalendarCheck,
                      color: 'from-blue-600 to-indigo-700',
                      href: bookingsIndex(),
                  },
                  ...(user.role === 'client'
                      ? [
                            {
                                id: 'inhouse-calendar',
                                name: 'In-House',
                                icon: CalendarDays,
                                color: 'from-emerald-500 to-teal-600',
                                href: bookingsCalendar(),
                            },
                        ]
                      : []),
              ]
            : []),
        ...(user.role === 'hotel'
            ? [
                  {
                      id: 'inbox',
                      name: 'Inbox',
                      icon: CalendarCheck,
                      color: 'from-amber-500 to-orange-600',
                      href: hotelBookingsIndex(),
                  },
                  {
                      id: 'scan',
                      name: 'Scan QR',
                      icon: ClipboardCheck,
                      color: 'from-emerald-500 to-teal-600',
                      href: hotelScan(),
                  },
                  {
                      id: 'stays',
                      name: 'Check-in/out',
                      icon: ClipboardCheck,
                      color: 'from-sky-500 to-indigo-600',
                      href: hotelStaysIndex(),
                  },
              ]
            : []),
        ...(user.role === 'admin'
            ? [
                  {
                      id: 'users',
                      name: 'Users',
                      icon: UsersIcon,
                      color: 'from-slate-500 to-slate-700',
                      href: usersIndex(),
                  },
                  {
                      id: 'hotels',
                      name: 'Hotels',
                      icon: HotelIcon,
                      color: 'from-orange-500 to-amber-600',
                      href: hotelsIndex(),
                  },
                  {
                      id: 'clients',
                      name: 'Clients',
                      icon: UserRoundCog,
                      color: 'from-emerald-500 to-teal-600',
                      href: clientsIndex(),
                  },
                  {
                      id: 'countries',
                      name: 'Countries',
                      icon: Globe,
                      color: 'from-fuchsia-600 to-pink-700',
                      href: countriesIndex(),
                  },
                  {
                      id: 'ranks',
                      name: 'Ranks',
                      icon: Building2,
                      color: 'from-violet-600 to-purple-700',
                      href: ranksIndex(),
                  },
                  {
                      id: 'vessels',
                      name: 'Vessels',
                      icon: Anchor,
                      color: 'from-cyan-500 to-sky-600',
                      href: vesselsIndex(),
                  },
                  {
                      id: 'booking-report',
                      name: 'Check in / out Report',
                      icon: BarChart3,
                      color: 'from-blue-500 to-indigo-600',
                      href: bookingReportIndex(),
                  },
              ]
            : []),
        {
            id: 'settings',
            name: 'Settings',
            icon: Settings,
            color: 'from-zinc-600 to-neutral-800',
            href: settingsProfileEdit(),
        },
    ];

    const storageKey = `dashboard:order:${String(user?.id ?? 'guest')}`;
    const [modules, setModules] =
        React.useState<DashboardModule[]>(baseModules);

    React.useEffect(() => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            const order = raw ? (JSON.parse(raw) as string[]) : null;

            if (order && Array.isArray(order) && order.length > 0) {
                const map = new Map(baseModules.map((m) => [m.id, m] as const));
                const ordered = order
                    .map((id) => map.get(id))
                    .filter(Boolean) as DashboardModule[];
                const leftovers = baseModules.filter(
                    (m) => !order.includes(m.id),
                );
                queueMicrotask(() => setModules([...ordered, ...leftovers]));

                return;
            }
        } catch {
            void 0;
        }

        queueMicrotask(() => {
            setModules((prev) => {
                const prevIds = new Set(prev.map((m) => m.id));
                const nextIds = new Set(baseModules.map((m) => m.id));
                const same =
                    prev.length === baseModules.length &&
                    [...prevIds].every((id) => nextIds.has(id));

                if (same) {
                    return prev;
                }

                const map = new Map(baseModules.map((m) => [m.id, m] as const));
                const ordered = prev
                    .map((m) => map.get(m.id))
                    .filter(Boolean) as DashboardModule[];
                const leftovers = baseModules.filter((m) => !prevIds.has(m.id));

                return [...ordered, ...leftovers];
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    const [draggingId, setDraggingId] = React.useState<string | null>(null);

    const persistOrder = (next: DashboardModule[]) => {
        try {
            window.localStorage.setItem(
                storageKey,
                JSON.stringify(next.map((m) => m.id)),
            );
        } catch {
            void 0;
        }
    };

    const move = (activeId: string, overId: string) => {
        if (activeId === overId) {
            return;
        }

        setModules((current) => {
            const from = current.findIndex((m) => m.id === activeId);
            const to = current.findIndex((m) => m.id === overId);

            if (from === -1 || to === -1) {
                return current;
            }

            const next = current.slice();
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            persistOrder(next);

            return next;
        });
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden font-sans text-foreground">
            <Head title="Dashboard" />

            <AppWallpaper />

            <AppNavbar showClock />

            {/* App drawer grid */}
            <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
                <div className="grid w-full max-w-2xl grid-cols-3 justify-items-center gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-10 sm:gap-y-14 md:grid-cols-5">
                    {modules.map((module, index) => (
                        <Link
                            key={index}
                            href={toUrl(module.href)}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', module.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggingId(module.id);
                            }}
                            onDragEnd={() => setDraggingId(null)}
                            onDragOver={(e) => {
                                if (!draggingId || draggingId === module.id) {
                                    return;
                                }

                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const activeId =
                                    e.dataTransfer.getData('text/plain');

                                if (!activeId) {
                                    return;
                                }

                                move(activeId, module.id);
                                setDraggingId(null);
                            }}
                            className="group flex flex-col items-center gap-3 outline-none"
                        >
                            {/* Icon tile */}
                            <div className="relative">
                                <div
                                    className={[
                                        'flex items-center justify-center',
                                        'relative isolate overflow-hidden',
                                        tileSizeClass,
                                        'rounded-3xl',
                                        'transition-all duration-200 ease-out',
                                        'group-hover:-translate-y-0.5 group-hover:scale-[1.10]',
                                        'group-hover:shadow-2xl',
                                        'group-active:scale-95',
                                        'group-focus-visible:ring-4 group-focus-visible:ring-ring/30',
                                        draggingId && draggingId === module.id
                                            ? 'scale-95 opacity-70'
                                            : '',
                                    ].join(' ')}
                                    style={{
                                        background: glassColor(module.color).bg,
                                        backdropFilter:
                                            'blur(20px) saturate(1.4)',
                                        WebkitBackdropFilter:
                                            'blur(20px) saturate(1.4)',
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        boxShadow:
                                            '0 8px 32px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    <span
                                        className="pointer-events-none absolute top-0 left-0 z-1 h-[55%] w-[65%]"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 60%, transparent 100%)',
                                            borderRadius: '22px 22px 60% 0',
                                        }}
                                    />

                                    <span className="pointer-events-none absolute -inset-px z-3 rounded-3xl border border-white/0 transition-all duration-200 group-hover:border-white/30" />

                                    <module.icon
                                        className={[
                                            'relative z-2 stroke-[1.4]',
                                            iconClass,
                                        ].join(' ')}
                                        style={{
                                            color: glassColor(module.color)
                                                .icon,
                                            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.3))',
                                        }}
                                    />
                                </div>

                                {module.id === 'inbox' &&
                                    user.role === 'hotel' &&
                                    Number(pendingInboxCount ?? 0) > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-destructive px-1.5 text-[11px] font-black text-destructive-foreground shadow-lg">
                                            {Number(pendingInboxCount)}
                                        </span>
                                    )}

                                {module.id === 'bookings' &&
                                    (user.role === 'client' ||
                                        user.role === 'admin') &&
                                    Number(pendingBookingsCount ?? 0) > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-destructive px-1.5 text-[11px] font-black text-destructive-foreground shadow-lg">
                                            {Number(pendingBookingsCount)}
                                        </span>
                                    )}
                            </div>

                            {/* Label */}
                            <span className="text-center text-[12px] font-semibold tracking-wide text-muted-foreground transition-colors group-hover:text-foreground sm:text-[13px]">
                                {module.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
