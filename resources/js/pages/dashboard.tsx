import { Head, Link, usePage } from '@inertiajs/react';
import { 
    CalendarCheck, Bed, ClipboardCheck, Users, 
    UserCircle, Ship, LineChart, SlidersHorizontal,
    MessageSquare, FileSpreadsheet, FolderOpen, ShieldCheck, LayoutDashboard
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { UserMenuContent } from '@/components/user-menu-content';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { PageProps, User } from '@/types';

const modules = [
    { name: 'Overview', icon: LayoutDashboard, color: 'from-slate-700 to-slate-800', href: '#' },
    { name: 'Bookings', icon: CalendarCheck, color: 'from-blue-600 to-indigo-700', href: '#' },
    { name: 'Rooms', icon: Bed, color: 'from-sky-500 to-cyan-600', href: '#' },
    { name: 'Check-In', icon: ClipboardCheck, color: 'from-emerald-500 to-teal-600', href: '#' },
    { name: 'Vessels', icon: Ship, color: 'from-cyan-700 to-blue-800', href: '#' },
    { name: 'Guests', icon: Users, color: 'from-violet-500 to-purple-600', href: '#' },
    { name: 'Staff', icon: UserCircle, color: 'from-fuchsia-600 to-purple-700', href: '#' },
    { name: 'Invoices', icon: FileSpreadsheet, color: 'from-teal-600 to-emerald-700', href: '#' },
    { name: 'Reports', icon: LineChart, color: 'from-indigo-500 to-blue-600', href: '#' },
    { name: 'Documents', icon: FolderOpen, color: 'from-amber-600 to-orange-700', href: '#' },
    { name: 'Admin', icon: ShieldCheck, color: 'from-rose-600 to-red-700', href: '#' },
    { name: 'Settings', icon: SlidersHorizontal, color: 'from-zinc-700 to-zinc-900', href: '#' },
];

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    const getInitials = useInitials();
    const user = auth.user as User;

    return (
        <div className="relative min-h-screen w-full bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-[#0B0F19] to-black text-white overflow-hidden flex flex-col font-sans selection:bg-primary/30">
            <Head title="Dashboard" />
            
            {/* Minimalist Top Navigation Bar */}
            <header className="flex items-center justify-between px-8 py-5 relative z-20 bg-gradient-to-b from-black/40 to-transparent">
                <div className="flex items-center gap-4 select-none">
                    <AppLogoIcon className="h-7 w-auto opacity-90" />
                    <span className="text-[17px] font-semibold tracking-wide text-zinc-100 hidden sm:block">
                        Overseas Marine
                    </span>
                </div>
                
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none flex items-center gap-3 rounded-full hover:bg-white/5 transition px-3 py-1.5 cursor-pointer border border-transparent hover:border-white/10">
                            <span className="text-[13px] font-medium hidden sm:block tracking-wide text-zinc-200">{user.name}</span>
                            <Avatar className="h-8 w-8 border border-white/10 shadow-sm opacity-90">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="bg-primary/80 text-white font-semibold text-xs">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
                            <UserMenuContent user={user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Premium, Sleek App Launcher Grid */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 w-full max-w-[900px] mx-auto mt-[-4rem]">
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-x-8 gap-y-12 justify-items-center w-full">
                    {modules.map((module, index) => (
                        <Link 
                            key={index} 
                            href={module.href}
                            className="group flex flex-col items-center gap-3 outline-none"
                        >
                            <div className={`
                                flex h-[4.2rem] w-[4.2rem] items-center justify-center 
                                rounded-[14px] shadow-lg shadow-black/50 border border-white/10
                                bg-gradient-to-br ${module.color}
                                transition-all duration-300 ease-out
                                group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:border-white/20
                                group-focus-visible:ring-2 group-focus-visible:ring-white/30 group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-[#0B0F19]
                            `}>
                                <module.icon className="size-[22px] text-white/90 drop-shadow-sm stroke-[1.5]" />
                            </div>
                            <span className="text-[12px] font-medium text-zinc-400 tracking-wide text-center group-hover:text-zinc-100 transition-colors">
                                {module.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </main>
            
            {/* Sophisticated, subtle ambient lighting */}
            <div className="absolute top-[10%] left-[30%] w-[35rem] h-[35rem] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[20%] right-[30%] w-[35rem] h-[35rem] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
        </div>
    );
}
