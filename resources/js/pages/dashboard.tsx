import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    LayoutDashboard,
    Anchor,
    Building2,
    Hotel as HotelIcon,
    Users as UsersIcon,
    UserRoundCog,
} from 'lucide-react';
import AppNavbar from '@/components/app-navbar';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as bookingsIndex } from '@/routes/bookings';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as hotelsIndex } from '@/routes/admin/hotels';
import { index as ranksIndex } from '@/routes/admin/ranks';
import { index as usersIndex } from '@/routes/admin/users';
import { index as vesselsIndex } from '@/routes/admin/vessels';
import { index as hotelBookingsIndex } from '@/routes/hotel/bookings';

export default function Dashboard() {
    const { auth } = usePage().props as any;
    const user = auth.user as any;
    const modules = [
        { name: 'Overview', icon: LayoutDashboard, color: 'from-slate-600 to-slate-700',      href: dashboard() },
        ...(user.role !== 'hotel'
            ? [{ name: 'Bookings', icon: CalendarCheck, color: 'from-blue-600 to-indigo-700', href: bookingsIndex() }]
            : []),
        ...(user.role === 'hotel'
            ? [{ name: 'Inbox', icon: CalendarCheck, color: 'from-amber-500 to-orange-600', href: hotelBookingsIndex() }]
            : []),
        ...(user.role === 'admin'
            ? [
                { name: 'Users',   icon: UsersIcon,     color: 'from-slate-500 to-slate-700',    href: usersIndex() },
                { name: 'Hotels',  icon: HotelIcon,     color: 'from-orange-500 to-amber-600',   href: hotelsIndex() },
                { name: 'Clients', icon: UserRoundCog, color: 'from-emerald-500 to-teal-600',   href: clientsIndex() },
                { name: 'Ranks',   icon: Building2,    color: 'from-violet-600 to-purple-700',  href: ranksIndex() },
                { name: 'Vessels', icon: Anchor,        color: 'from-cyan-500 to-sky-600',       href: vesselsIndex() },
            ]
            : []),
    ];

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground overflow-hidden flex flex-col font-sans">
            <Head title="Dashboard" />

            {/* Ambient blobs */}
            <div className="absolute top-[-15%] left-[25%] w-[40rem] h-[40rem] bg-blue-500/10 dark:bg-blue-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[20%] w-[35rem] h-[35rem] bg-indigo-500/10 dark:bg-indigo-900/15 rounded-full blur-[100px] pointer-events-none" />

            <AppNavbar showClock />

            {/* App drawer grid */}
            <main className="flex-1 flex items-center justify-center relative z-10 px-6 py-10">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-6 gap-y-10 sm:gap-x-10 sm:gap-y-14 w-full max-w-2xl justify-items-center">
                    {modules.map((module, index) => (
                        <Link
                            key={index}
                            href={toUrl(module.href)}
                            className="group flex flex-col items-center gap-3 outline-none"
                        >
                            {/* Icon tile */}
                            <div
                                className={[
                                    'flex items-center justify-center rounded-[1.25rem] sm:rounded-[1.5rem]',
                                    'h-[4.5rem] w-[4.5rem] sm:h-[5.5rem] sm:w-[5.5rem]',
                                    'bg-gradient-to-br', module.color,
                                    'shadow-xl shadow-black/10 dark:shadow-black/50 border border-border/60',
                                    'transition-all duration-200 ease-out',
                                    'group-hover:scale-[1.08] group-hover:shadow-2xl group-hover:border-white/20',
                                    'group-active:scale-95',
                                    'group-focus-visible:ring-4 group-focus-visible:ring-ring/30 group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-background',
                                ].join(' ')}
                            >
                                <module.icon className="size-8 sm:size-10 text-white/90 stroke-[1.3]" />
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
