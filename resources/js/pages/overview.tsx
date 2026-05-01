import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3 as BarChartIcon,
    BriefcaseBusiness,
    CalendarCheck,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Hotel,
    LayoutDashboard,
    PieChart as PieChartIcon,
    Activity,
    TrendingUp,
    User,
    Users,
    XCircle,
} from 'lucide-react';
import React from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import PageLayout from '@/layouts/page-layout';

import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { show as showBooking } from '@/routes/bookings';

const themeVar = (name: string) => `var(--${name})`;

const STATUS_COLORS = {
    pending: themeVar('status-pending'),
    confirmed: themeVar('status-confirmed'),
    rejected: themeVar('status-rejected'),
} as const;

const ROOM_COLORS = [
    themeVar('chart-1'),
    themeVar('chart-2'),
    themeVar('chart-3'),
    themeVar('chart-4'),
] as const;

export default function Overview({ stats, chartData, title, viewerRole, recentBookings, recentChanges, analytics }: { 
    stats: any; 
    chartData: any[]; 
    title?: string;
    viewerRole?: 'admin' | 'hotel' | 'client' | string;
    recentBookings: any[];
    recentChanges?: any[];
    analytics?: {
        statusDistribution: any[];
        roomDistribution: any[];
        topHotels: any[];
        topClients?: any[];
        topUsers?: any[];
    };
}) {
    const toArray = <T,>(value: unknown): T[] => {
        if (Array.isArray(value)) {
            return value as T[];
        }

        if (value && typeof value === 'object') {
            return Object.values(value as Record<string, T>);
        }

        return [];
    };

    const chartDataList = toArray<any>(chartData);
    const recentBookingsList = toArray<any>(recentBookings);
    const recentChangesList = toArray<any>(recentChanges);
    const statusDistribution = toArray<any>(analytics?.statusDistribution);
    const roomDistribution = toArray<any>(analytics?.roomDistribution);
    const topHotels = toArray<any>(analytics?.topHotels);
    const topClients = toArray<any>(analytics?.topClients);
    const topUsers = toArray<any>(analytics?.topUsers);
    const sortedChartData = [...chartDataList].reverse();
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
    const isAdmin = viewerRole === 'admin';
    const isHotel = viewerRole === 'hotel';
    const monthDelta = (() => {
        const current = Number(stats.bookingsThisMonth ?? 0);
        const prev = Number(stats.bookingsLastMonth ?? 0);

        if (prev <= 0) {
            return null;
        }

        return Math.round(((current - prev) / prev) * 100);
    })();

    return (
        <PageLayout title="Overview" backHref={toUrl(dashboard())}>
            <Head title={title ?? 'Overview Analytics'} />

            <div className="mx-auto max-w-6xl space-y-8 pb-10">
                {/* ── HEADER ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                            <LayoutDashboard className="size-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">{title ?? 'Overview'}</h2>
                            <p className="text-muted-foreground text-sm">Key analytics and recent activity</p>
                        </div>
                    </div>
                </div>

                {/* ── STAT CARDS ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Bookings" 
                        value={stats.totalBookings} 
                        icon={CalendarCheck} 
                        color="text-primary" 
                        bg="bg-primary/10" 
                    />
                    <StatCard 
                        title="Pending Bookings" 
                        value={stats.pendingBookings} 
                        icon={Clock} 
                        color="text-warning" 
                        bg="bg-warning/10" 
                    />
                    <StatCard 
                        title="Confirmed" 
                        value={stats.confirmedBookings ?? 0} 
                        icon={CheckCircle2} 
                        color="text-success" 
                        bg="bg-success/10" 
                    />
                    <StatCard 
                        title="Rejected" 
                        value={stats.rejectedBookings ?? 0} 
                        icon={XCircle} 
                        color="text-destructive" 
                        bg="bg-destructive/10" 
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="This Month"
                        value={stats.bookingsThisMonth ?? 0}
                        icon={TrendingUp}
                        color="text-primary"
                        bg="bg-primary/10"
                        helper={monthDelta === null ? undefined : `${monthDelta >= 0 ? '+' : ''}${monthDelta}% vs last month`}
                    />
                    <StatCard
                        title="Approval Rate"
                        value={stats.approvalRate === null || stats.approvalRate === undefined ? '—' : `${stats.approvalRate}%`}
                        icon={CheckCircle2}
                        color="text-success"
                        bg="bg-success/10"
                    />
                    <StatCard
                        title="Pending > 48h"
                        value={stats.pendingOver48h ?? 0}
                        icon={Clock}
                        color="text-warning"
                        bg="bg-warning/10"
                        helper="Needs attention"
                    />
                    {stats.totalUsers > 0 && (
                        <StatCard 
                            title="Total Users" 
                            value={stats.totalUsers} 
                            icon={Users} 
                            color="text-success" 
                            bg="bg-success/10" 
                        />
                    )}
                    {stats.totalHotels > 0 && (
                        <StatCard 
                            title="Registered Hotels" 
                            value={stats.totalHotels} 
                            icon={Hotel} 
                            color="text-primary" 
                            bg="bg-primary/10" 
                        />
                    )}
                    {stats.totalClients > 0 && (
                        <StatCard
                            title="Clients"
                            value={stats.totalClients}
                            icon={BriefcaseBusiness}
                            color="text-info"
                            bg="bg-info/10"
                        />
                    )}
                </div>

                {/* ── MAIN CONTENT GRID ───────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* CHART SECTION (Left 2/3) */}
                    <div className="lg:col-span-2 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Bookings Trend</h3>
                                <p className="text-sm text-muted-foreground">Monthly booking volume over the last 6 months</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-semibold">
                                <TrendingUp className="size-4" />
                                {chartDataList[0]?.bookings > 0 ? '+ Active' : 'Stable'}
                            </div>
                        </div>

                        <div className="h-80 w-full mt-auto min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={80}>
                                <AreaChart data={sortedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={themeVar('primary')} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={themeVar('primary')} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeVar('border')} opacity={0.5} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: themeVar('muted-foreground'), fontSize: 12 }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: themeVar('muted-foreground'), fontSize: 12 }} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: themeVar('card'), 
                                            borderColor: themeVar('border'),
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: themeVar('foreground'), fontWeight: 600 }}
                                        labelStyle={{ color: themeVar('muted-foreground'), marginBottom: '4px' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="bookings" 
                                        stroke={themeVar('primary')} 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorBookings)" 
                                        activeDot={{ r: 6, strokeWidth: 0, fill: themeVar('primary') }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* RECENT ACTIVITY SECTION (Right 1/3) */}
                    <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden h-112">
                        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-card/60 shrink-0">
                            <h3 className="text-base font-bold text-foreground">Recent Bookings</h3>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                            {recentBookingsList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 h-full text-center opacity-60">
                                    <CalendarCheck className="size-10 mb-3 text-muted-foreground" />
                                    <p className="text-sm">No recent bookings found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentBookingsList.map((b) => (
                                        <Link 
                                            key={b.id} 
                                            href={toUrl(showBooking({ booking: b.id }))}
                                            className="group flex flex-col gap-2 p-4 rounded-2xl border border-border/40 bg-background/50 hover:bg-muted/50 transition-all hover:border-primary/30"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="font-semibold text-sm text-foreground truncate">
                                                    {b.hotel}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                                    ${b.status === 'pending' ? 'bg-warning/10 text-warning' : 
                                                      b.status === 'confirmed' ? 'bg-success/10 text-success' : 
                                                      'bg-destructive/10 text-destructive'}
                                                `}>
                                                    {b.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <User className="size-3.5" />
                                                    <span className="truncate max-w-32">{b.guest}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 group-hover:text-primary transition-colors">
                                                    {b.time} <ArrowRight className="size-3" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* ── ADVANCED ANALYTICS ROW ────────────────────────────── */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Status Distribution */}
                        <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <PieChartIcon className="size-5 text-muted-foreground" />
                                <h3 className="text-base font-bold text-foreground">Status Breakdown</h3>
                            </div>
                            <div className="h-56 w-full min-w-0 flex items-center justify-center">
                                {statusDistribution.length === 0 ? (
                                    <span className="text-sm text-muted-foreground">No data</span>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={80}>
                                        <PieChart>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: `1px solid ${themeVar('border')}`, backgroundColor: themeVar('card') }}
                                                itemStyle={{ color: themeVar('foreground'), fontWeight: 600 }}
                                            />
                                            <Pie
                                                data={statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] ?? themeVar('muted-foreground')} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="flex justify-center gap-4 mt-2 flex-wrap">
                                {statusDistribution.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] ?? themeVar('muted-foreground') }} />
                                        {s.name} ({s.value})
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Room Types */}
                        <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <PieChartIcon className="size-5 text-muted-foreground" />
                                <h3 className="text-base font-bold text-foreground">Room Types</h3>
                            </div>
                            <div className="h-56 w-full min-w-0 flex items-center justify-center">
                                {roomDistribution.length === 0 ? (
                                    <span className="text-sm text-muted-foreground">No data</span>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={80}>
                                        <PieChart>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: `1px solid ${themeVar('border')}`, backgroundColor: themeVar('card') }}
                                                itemStyle={{ color: themeVar('foreground'), fontWeight: 600 }}
                                            />
                                            <Pie
                                                data={roomDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {roomDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="flex justify-center gap-4 mt-2 flex-wrap">
                                {roomDistribution.map((r, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ROOM_COLORS[i % ROOM_COLORS.length] }} />
                                        {r.name} ({r.value})
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!isHotel && (
                            <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg flex flex-col">
                                <div className="flex items-center gap-2 mb-6">
                                    <BarChartIcon className="size-5 text-muted-foreground" />
                                    <h3 className="text-base font-bold text-foreground">Top Hotels</h3>
                                </div>
                                <div className="h-60 w-full min-w-0">
                                    {topHotels.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <span className="text-sm text-muted-foreground">No data</span>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={80}>
                                            <BarChart data={topHotels} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={themeVar('border')} opacity={0.5} />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: themeVar('muted-foreground'), fontSize: 11 }} />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: themeVar('muted-foreground'), fontSize: 11 }} width={100} />
                                                <Tooltip
                                                    cursor={{ fill: themeVar('muted'), opacity: 0.4 }}
                                                    contentStyle={{ borderRadius: '12px', border: `1px solid ${themeVar('border')}`, backgroundColor: themeVar('card') }}
                                                    itemStyle={{ color: themeVar('primary'), fontWeight: 600 }}
                                                />
                                                <Bar dataKey="value" fill={themeVar('primary')} radius={[0, 4, 4, 0]} barSize={20}>
                                                    {topHotels.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isAdmin && (topClients.length > 0 || topUsers.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <BarChartIcon className="size-5 text-muted-foreground" />
                                <h3 className="text-base font-bold text-foreground">Top Clients</h3>
                            </div>
                            <div className="h-60 w-full min-w-0">
                                {topClients.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">
                                        <span className="text-sm text-muted-foreground">No data</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={80}>
                                        <BarChart data={topClients} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={themeVar('border')} opacity={0.5} />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: themeVar('muted-foreground'), fontSize: 11 }} />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: themeVar('muted-foreground'), fontSize: 11 }} width={100} />
                                            <Tooltip
                                                cursor={{ fill: themeVar('muted'), opacity: 0.4 }}
                                                contentStyle={{ borderRadius: '12px', border: `1px solid ${themeVar('border')}`, backgroundColor: themeVar('card') }}
                                                itemStyle={{ color: themeVar('primary'), fontWeight: 600 }}
                                            />
                                            <Bar dataKey="value" fill={themeVar('primary')} radius={[0, 4, 4, 0]} barSize={20}>
                                                {topClients.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <BarChartIcon className="size-5 text-muted-foreground" />
                                <h3 className="text-base font-bold text-foreground">Top Users</h3>
                            </div>
                            <div className="h-60 w-full min-w-0">
                                {topUsers.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">
                                        <span className="text-sm text-muted-foreground">No data</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={80}>
                                        <BarChart data={topUsers} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={themeVar('border')} opacity={0.5} />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: themeVar('muted-foreground'), fontSize: 11 }} />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: themeVar('muted-foreground'), fontSize: 11 }} width={100} />
                                            <Tooltip
                                                cursor={{ fill: themeVar('muted'), opacity: 0.4 }}
                                                contentStyle={{ borderRadius: '12px', border: `1px solid ${themeVar('border')}`, backgroundColor: themeVar('card') }}
                                                itemStyle={{ color: themeVar('primary'), fontWeight: 600 }}
                                            />
                                            <Bar dataKey="value" fill={themeVar('primary')} radius={[0, 4, 4, 0]} barSize={20}>
                                                {topUsers.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isAdmin && recentChangesList.length > 0 && (
                    <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden">
                        <div className="px-6 py-5 border-b border-border/40 bg-card/60 flex items-center justify-between">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Activity className="size-4 text-primary" /> Recent Changes
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                                {recentChangesList.length}
                            </span>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                            <div className="space-y-3">
                                {recentChangesList.map((a: any) => {
                                    const isExpanded = expanded[a.id];
                                    const hasChanges = a.changes?.attributes && Object.keys(a.changes.attributes).length > 0;

                                    return (
                                        <div key={a.id} className="rounded-2xl border border-border/40 bg-background/50 p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {a.description || a.event}
                                                    </div>
                                                    <div className="text-[12px] text-muted-foreground">
                                                        {a.subject_type}{a.causer ? ` • by ${a.causer}` : ''} • {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                {hasChanges && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpanded((p: Record<string, boolean>) => ({ ...p, [a.id]: !p[a.id] }))}
                                                        className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
                                                    >
                                                        {isExpanded ? 'Hide' : 'View'}
                                                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                    </button>
                                                )}
                                            </div>

                                            {hasChanges && isExpanded && (
                                                <div className="mt-3 rounded-xl border border-border/40 bg-background/50 p-3">
                                                    <div className="space-y-2">
                                                        {Object.entries(a.changes.attributes as Record<string, any>).map(([key, next]) => {
                                                            const prev = a.changes?.old?.[key];

                                                            return (
                                                                <div key={key} className="flex items-center justify-between gap-4">
                                                                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                                                                        {key.replace('_', ' ')}
                                                                    </span>
                                                                    <span className="text-[12px] text-muted-foreground truncate max-w-[75%]">
                                                                        {String(prev ?? '—')} → <span className="text-foreground font-medium">{String(next ?? '—')}</span>
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, helper }: { title: string; value: number | string; icon: any; color: string; bg: string; helper?: string }) {
    return (
        <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 flex items-center gap-5 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
                <Icon className={`size-7 ${color}`} />
            </div>
            <div>
                <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
                <h3 className="text-3xl font-black text-foreground tracking-tight">{value}</h3>
                {helper && <p className="text-[12px] text-muted-foreground mt-1">{helper}</p>}
            </div>
        </div>
    );
}

Overview.layout = (page: React.ReactNode) => page;
