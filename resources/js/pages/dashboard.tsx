import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck, Bed, Users,
    UserCircle, SlidersHorizontal, ShieldCheck, LayoutDashboard,
    ChevronRight,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { toUrl } from '@/lib/utils';
import { index as bookingsIndex } from '@/routes/bookings';
import { index as roleIndex } from '@/routes/role';

const modules = [
    {
        name: 'Overview',
        description: 'Analytics & KPIs',
        icon: LayoutDashboard,
        color: 'from-slate-600 to-slate-800',
        glow: 'rgba(100,116,139,0.35)',
        href: '#',
    },
    {
        name: 'Bookings',
        description: 'Reservations',
        icon: CalendarCheck,
        color: 'from-blue-600 to-indigo-700',
        glow: 'rgba(59,130,246,0.35)',
        href: bookingsIndex(),
    },
    {
        name: 'Rooms',
        description: 'Inventory',
        icon: Bed,
        color: 'from-sky-500 to-cyan-600',
        glow: 'rgba(14,165,233,0.35)',
        href: '#',
    },
    {
        name: 'Guests',
        description: 'Guest profiles',
        icon: Users,
        color: 'from-violet-500 to-purple-700',
        glow: 'rgba(139,92,246,0.35)',
        href: '#',
    },
    {
        name: 'Staff',
        description: 'Team management',
        icon: UserCircle,
        color: 'from-fuchsia-600 to-purple-700',
        glow: 'rgba(192,38,211,0.35)',
        href: '#',
    },
    {
        name: 'Role',
        description: 'Access control',
        icon: ShieldCheck,
        color: 'from-rose-600 to-red-700',
        glow: 'rgba(225,29,72,0.35)',
        href: roleIndex(),
    },
    {
        name: 'Settings',
        description: 'Preferences',
        icon: SlidersHorizontal,
        color: 'from-zinc-600 to-zinc-800',
        glow: 'rgba(113,113,122,0.35)',
        href: '#',
    },
];

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard() {
    const { auth } = usePage().props as any;
    const getInitials = useInitials();
    const user = auth.user as any;
    const firstName = user.name.split(' ')[0];

    return (
        <div className="relative min-h-screen w-full bg-[#080C15] text-white overflow-hidden flex flex-col font-sans selection:bg-blue-500/30">
            <Head title="Dashboard" />

            {/* Ambient background lighting */}
            <div className="absolute top-[-10%] left-[20%] w-[50rem] h-[50rem] bg-blue-900/15 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[15%] w-[40rem] h-[40rem] bg-indigo-900/15 rounded-full blur-[110px] pointer-events-none" />
            <div className="absolute top-[40%] left-[-5%] w-[25rem] h-[25rem] bg-violet-900/10 rounded-full blur-[90px] pointer-events-none" />

            {/* ── Header ────────────────────────────────────────── */}
            <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-4 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                <Link href="/" className="flex items-center gap-3 select-none group">
                    <AppLogoIcon className="h-9 w-auto transition-transform duration-300 group-hover:scale-105" />
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none flex items-center gap-2.5 rounded-full hover:bg-white/6 transition-all duration-200 px-3 py-1.5 cursor-pointer border border-transparent hover:border-white/10 group">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[13px] font-semibold text-zinc-100 leading-tight">{user.name}</span>
                            <span className="text-[11px] text-zinc-500 leading-tight">Administrator</span>
                        </div>
                        <Avatar className="h-8 w-8 border border-white/15 shadow-md ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
                        <UserMenuContent user={user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* ── Main Content ─────────────────────────────────── */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 py-12">
                {/* Greeting */}
                <div className="text-center mb-14">
                    <p className="text-sm font-medium text-zinc-500 tracking-widest uppercase mb-2">
                        {getGreeting()}
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        Welcome back,{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            {firstName}
                        </span>
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        Select a module to get started
                    </p>
                </div>

                {/* Module grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 w-full max-w-3xl">
                    {modules.map((module, index) => (
                        <Link
                            key={index}
                            href={toUrl(module.href)}
                            className="group relative flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] p-5 sm:p-6 transition-all duration-300 ease-out hover:border-white/[0.14] hover:shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                            style={{
                                boxShadow: `0 0 0 0 ${module.glow}`,
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px -8px ${module.glow}`;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${module.glow}`;
                            }}
                        >
                            {/* Icon */}
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${module.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                            >
                                <module.icon className="size-6 text-white/90 stroke-[1.5]" />
                            </div>

                            {/* Text */}
                            <div className="flex-1">
                                <p className="text-[14px] font-semibold text-zinc-100 group-hover:text-white transition-colors leading-tight">
                                    {module.name}
                                </p>
                                <p className="text-[12px] text-zinc-500 mt-0.5 group-hover:text-zinc-400 transition-colors">
                                    {module.description}
                                </p>
                            </div>

                            {/* Arrow */}
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all duration-200" />
                        </Link>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-5 border-t border-white/[0.04]">
                <p className="text-[11px] text-zinc-700 tracking-wide">
                    &copy; {new Date().getFullYear()} Overseas Marine Services &mdash; Hotel Management System
                </p>
            </footer>
        </div>
    );
}
