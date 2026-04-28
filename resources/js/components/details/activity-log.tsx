import { Activity, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import React from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function ActivityLog({ activities }: { activities?: any[] }) {
    const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});
    const [showFilters, setShowFilters] = React.useState(false);
    const [eventFilter, setEventFilter] = React.useState<string>('all');
    const [causerFilter, setCauserFilter] = React.useState<string>('all');
    const [fieldFilter, setFieldFilter] = React.useState<string>('all');
    const [textFilter, setTextFilter] = React.useState<string>('');

    const allActivities = React.useMemo(() => activities ?? [], [activities]);

    const causers = React.useMemo(() => {
        const uniq = new Set<string>();

        for (const a of allActivities) {
            if (a?.causer) {
                uniq.add(String(a.causer));
            }
        }

        return Array.from(uniq).sort((a, b) => a.localeCompare(b));
    }, [allActivities]);

    const fields = React.useMemo(() => {
        const uniq = new Set<string>();

        for (const a of allActivities) {
            const attrs = a?.changes?.attributes as Record<string, any> | undefined;

            if (!attrs) {
                continue;
            }

            Object.keys(attrs).forEach((k) => uniq.add(String(k)));
        }

        return Array.from(uniq).sort((a, b) => a.localeCompare(b));
    }, [allActivities]);

    const filtered = React.useMemo(() => {
        const q = textFilter.trim().toLowerCase();

        return allActivities.filter((a: any) => {
            if (eventFilter !== 'all' && String(a?.event ?? '') !== eventFilter) {
                return false;
            }

            const causer = a?.causer ? String(a.causer) : 'System';

            if (causerFilter !== 'all' && causer !== causerFilter) {
                return false;
            }

            const attrs = a?.changes?.attributes as Record<string, any> | undefined;

            if (fieldFilter !== 'all') {
                if (!attrs || !Object.prototype.hasOwnProperty.call(attrs, fieldFilter)) {
                    return false;
                }
            }

            if (q) {
                const hay = [
                    String(a?.description ?? ''),
                    String(a?.event ?? ''),
                    causer,
                ]
                    .join(' ')
                    .toLowerCase();

                if (!hay.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [allActivities, causerFilter, eventFilter, fieldFilter, textFilter]);

    const formatValue = (v: any) => {
        if (v === null || v === undefined) {
            return '—';
        }

        if (typeof v === 'string') {
            return v === '' ? '—' : v;
        }

        if (typeof v === 'number' || typeof v === 'boolean') {
            return String(v);
        }

        try {
            return JSON.stringify(v);
        } catch {
            return String(v);
        }
    };

    const labelField = (k: string) =>
        k
            .split('_')
            .filter(Boolean)
            .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1))
            .join(' ');

    return (
        <aside className="relative">
            <div className="sticky top-24 rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
                <div className="px-6 py-5 border-b border-border/40 bg-card/60 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                        <Activity className="size-4 text-primary" /> Activity Log
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-[12px] font-semibold text-foreground hover:bg-muted"
                        >
                            <Filter className="size-4 text-primary" />
                            Filters
                        </button>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            {filtered.length}
                        </span>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {showFilters && (
                        <div className="mb-5 rounded-2xl border border-border/50 bg-background/40 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Filter activity
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEventFilter('all');
                                        setCauserFilter('all');
                                        setFieldFilter('all');
                                        setTextFilter('');
                                    }}
                                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                    Reset
                                </button>
                            </div>

                            <Input
                                value={textFilter}
                                onChange={(e) => setTextFilter(e.target.value)}
                                placeholder="Search activity…"
                                className="h-10 rounded-xl"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Select value={eventFilter} onValueChange={setEventFilter}>
                                    <SelectTrigger className="w-full rounded-xl h-10">
                                        <SelectValue placeholder="Event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All events</SelectItem>
                                        <SelectItem value="created">Created</SelectItem>
                                        <SelectItem value="updated">Updated</SelectItem>
                                        <SelectItem value="deleted">Deleted</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={causerFilter} onValueChange={setCauserFilter}>
                                    <SelectTrigger className="w-full rounded-xl h-10">
                                        <SelectValue placeholder="User" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All users</SelectItem>
                                        <SelectItem value="System">System</SelectItem>
                                        {causers.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={fieldFilter} onValueChange={setFieldFilter}>
                                    <SelectTrigger className="w-full rounded-xl h-10">
                                        <SelectValue placeholder="Field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All fields</SelectItem>
                                        {fields.map((f) => (
                                            <SelectItem key={f} value={f}>
                                                {labelField(f)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                            <Activity className="size-8 mb-3" />
                            <p className="text-sm">No recent activity.</p>
                        </div>
                    ) : (
                        <div className="relative border-l border-border/60 ml-3 space-y-8 pb-4">
                            {filtered.map((a: any) => {
                                const isExpanded = expanded[a.id];
                                const hasChanges = a.changes?.attributes && Object.keys(a.changes.attributes).length > 0;

                                return (
                                    <div key={a.id} className="relative pl-6 group">
                                        <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-[14px] font-semibold text-foreground capitalize">
                                                    {a.description || a.event}
                                                </span>
                                                <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                                                    {new Date(a.created_at).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>

                                            <div className="text-[12px] text-muted-foreground flex items-center justify-between">
                                                <span>
                                                    By <strong className="text-foreground/80 font-medium">{a.causer || 'System'}</strong>
                                                </span>

                                                {hasChanges && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpanded((p) => ({ ...p, [a.id]: !p[a.id] }))}
                                                        className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                                                    >
                                                        {isExpanded ? 'Hide changes' : 'View changes'}
                                                        {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {hasChanges && isExpanded && (
                                            <div className="mt-3 rounded-xl border border-border/40 bg-background/50 p-3 shadow-inner">
                                                <div className="space-y-2">
                                                    {Object.entries(a.changes.attributes as Record<string, any>)
                                                        .filter(([key]) => fieldFilter === 'all' || key === fieldFilter)
                                                        .map(([key, next]) => {
                                                        const prev = a.changes?.old?.[key];
                                                        const from = formatValue(prev);
                                                        const to = formatValue(next);

                                                        return (
                                                            <div key={key} className="flex flex-col gap-0.5">
                                                                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                                                    {labelField(String(key))}
                                                                </span>
                                                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[12px]">
                                                                    <span className="text-muted-foreground line-through decoration-rose-500/50 truncate">
                                                                        {from}
                                                                    </span>
                                                                    <span className="text-muted-foreground/40">→</span>
                                                                    <span className="text-emerald-500 dark:text-emerald-400 font-medium truncate">
                                                                        {to}
                                                                    </span>
                                                                </div>
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
                    )}
                </div>
            </div>
        </aside>
    );
}

