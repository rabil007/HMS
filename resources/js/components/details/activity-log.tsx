import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';

export function ActivityLog({ activities }: { activities?: any[] }) {
    const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

    return (
        <aside className="relative">
            <div className="sticky top-24 rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
                <div className="px-6 py-5 border-b border-border/40 bg-card/60 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                        <Activity className="size-4 text-primary" /> Activity Log
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        {(activities ?? []).length}
                    </span>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {(activities ?? []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                            <Activity className="size-8 mb-3" />
                            <p className="text-sm">No recent activity.</p>
                        </div>
                    ) : (
                        <div className="relative border-l border-border/60 ml-3 space-y-8 pb-4">
                            {(activities ?? []).map((a: any) => {
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
                                                    {Object.entries(a.changes.attributes as Record<string, any>).map(([key, next]) => {
                                                        const prev = a.changes?.old?.[key];
                                                        const from = prev === undefined ? '—' : String(prev);
                                                        const to = next === undefined ? '—' : String(next);

                                                        return (
                                                            <div key={key} className="flex flex-col gap-0.5">
                                                                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                                                    {key.replace('_', ' ')}
                                                                </span>
                                                                <div className="flex items-center gap-2 text-[12px]">
                                                                    <span className="text-muted-foreground line-through decoration-rose-500/50 truncate max-w-[45%]">
                                                                        {from}
                                                                    </span>
                                                                    <span className="text-muted-foreground/40">→</span>
                                                                    <span className="text-emerald-500 dark:text-emerald-400 font-medium truncate max-w-[45%]">
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

