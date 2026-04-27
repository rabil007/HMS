import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    LayoutDashboard,
    Anchor,
    Building2,
    Hotel as HotelIcon,
    Users as UsersIcon,
    UserRoundCog,
    Globe,
    Settings,
} from 'lucide-react';
import React from 'react';
import AppNavbar from '@/components/app-navbar';
import { toUrl } from '@/lib/utils';
import { dashboard, overview } from '@/routes';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as countriesIndex } from '@/routes/admin/countries';
import { index as hotelsIndex } from '@/routes/admin/hotels';
import { index as ranksIndex } from '@/routes/admin/ranks';
import { index as usersIndex } from '@/routes/admin/users';
import { index as vesselsIndex } from '@/routes/admin/vessels';
import { index as bookingsIndex } from '@/routes/bookings';
import { index as hotelBookingsIndex } from '@/routes/hotel/bookings';
import { edit as settingsProfileEdit } from '@/routes/profile';

type DashboardModule = {
    id: string;
    name: string;
    icon: any;
    color: string;
    href: any;
};

export default function Dashboard() {
    const { auth, pendingInboxCount, pendingBookingsCount } = usePage().props as any;
    const user = auth.user as any;
    const baseModules: DashboardModule[] = [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard, color: 'from-slate-600 to-slate-700', href: overview() },
        ...(user.role !== 'hotel'
            ? [{ id: 'bookings', name: 'Bookings', icon: CalendarCheck, color: 'from-blue-600 to-indigo-700', href: bookingsIndex() }]
            : []),
        ...(user.role === 'hotel'
            ? [{ id: 'inbox', name: 'Inbox', icon: CalendarCheck, color: 'from-amber-500 to-orange-600', href: hotelBookingsIndex() }]
            : []),
        ...(user.role === 'admin'
            ? [
                { id: 'users', name: 'Users', icon: UsersIcon, color: 'from-slate-500 to-slate-700', href: usersIndex() },
                { id: 'hotels', name: 'Hotels', icon: HotelIcon, color: 'from-orange-500 to-amber-600', href: hotelsIndex() },
                { id: 'clients', name: 'Clients', icon: UserRoundCog, color: 'from-emerald-500 to-teal-600', href: clientsIndex() },
                { id: 'countries', name: 'Countries', icon: Globe, color: 'from-fuchsia-600 to-pink-700', href: countriesIndex() },
                { id: 'ranks', name: 'Ranks', icon: Building2, color: 'from-violet-600 to-purple-700', href: ranksIndex() },
                { id: 'vessels', name: 'Vessels', icon: Anchor, color: 'from-cyan-500 to-sky-600', href: vesselsIndex() },
            ]
            : []),
        { id: 'settings', name: 'Settings', icon: Settings, color: 'from-zinc-600 to-neutral-800', href: settingsProfileEdit() },
    ];

    const storageKey = `dashboard:order:${String(user?.id ?? 'guest')}`;
    const [modules, setModules] = React.useState<DashboardModule[]>(baseModules);

    React.useEffect(() => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            const order = raw ? (JSON.parse(raw) as string[]) : null;

            if (order && Array.isArray(order) && order.length > 0) {
                const map = new Map(baseModules.map((m) => [m.id, m] as const));
                const ordered = order.map((id) => map.get(id)).filter(Boolean) as DashboardModule[];
                const leftovers = baseModules.filter((m) => !order.includes(m.id));
                setModules([...ordered, ...leftovers]);

                return;
            }
        } catch {}

        setModules((prev) => {
            const prevIds = new Set(prev.map((m) => m.id));
            const nextIds = new Set(baseModules.map((m) => m.id));
            const same =
                prev.length === baseModules.length && [...prevIds].every((id) => nextIds.has(id));

            if (same) {
                return prev;
            }

            const map = new Map(baseModules.map((m) => [m.id, m] as const));
            const ordered = prev.map((m) => map.get(m.id)).filter(Boolean) as DashboardModule[];
            const leftovers = baseModules.filter((m) => !prevIds.has(m.id));

            return [...ordered, ...leftovers];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    const [draggingId, setDraggingId] = React.useState<string | null>(null);

    const persistOrder = (next: DashboardModule[]) => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(next.map((m) => m.id)));
        } catch {}
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
        <div className="relative min-h-screen w-full bg-background text-foreground overflow-hidden flex flex-col font-sans">
            <Head title="Dashboard" />

            {/* Ambient blobs */}
            <div className="absolute top-[-15%] left-[25%] w-160 h-160 bg-blue-500/10 dark:bg-blue-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[20%] w-140 h-140 bg-indigo-500/10 dark:bg-indigo-900/15 rounded-full blur-[100px] pointer-events-none" />

            <AppNavbar showClock />

            {/* App drawer grid */}
            <main className="flex-1 flex items-center justify-center relative z-10 px-6 py-10">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-6 gap-y-10 sm:gap-x-10 sm:gap-y-14 w-full max-w-2xl justify-items-center">
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
                                const activeId = e.dataTransfer.getData('text/plain');

                                if (!activeId) {
                                    return;
                                }

                                move(activeId, module.id);
                                setDraggingId(null);
                            }}
                            className="group flex flex-col items-center gap-3 outline-none"
                        >
                            {/* Icon tile */}
                            <div
                                className={[
                                    'flex items-center justify-center rounded-[1.25rem] sm:rounded-3xl',
                                    'relative',
                                    'h-18 w-18 sm:h-22 sm:w-22',
                                    'bg-linear-to-br', module.color,
                                    'shadow-xl shadow-black/10 dark:shadow-black/50 border border-border/60',
                                    'transition-all duration-200 ease-out',
                                    'group-hover:scale-[1.08] group-hover:shadow-2xl group-hover:border-white/20',
                                    'group-active:scale-95',
                                    'group-focus-visible:ring-4 group-focus-visible:ring-ring/30 group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-background',
                                    draggingId && draggingId === module.id ? 'opacity-70 scale-95' : '',
                                ].join(' ')}
                            >
                                <module.icon className="size-8 sm:size-10 text-white/90 stroke-[1.3]" />

                                {module.id === 'inbox' && user.role === 'hotel' && Number(pendingInboxCount ?? 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-background">
                                        {Number(pendingInboxCount)}
                                    </span>
                                )}

                                {module.id === 'bookings' && (user.role === 'client' || user.role === 'admin') && Number(pendingBookingsCount ?? 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-background">
                                        {Number(pendingBookingsCount)}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center tracking-wide">
                                {module.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
