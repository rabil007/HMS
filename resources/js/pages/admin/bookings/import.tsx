import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    CheckSquare2,
    Download,
    FileSpreadsheet,
    Loader2,
    Square,
    Upload,
    Wand2,
    X,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageLayout from '@/layouts/page-layout';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { importMethod, importPreview, importTemplate } from '@/routes/admin/bookings';
import { index as bookingsIndex } from '@/routes/bookings';

type LookupOption = { id: number; name: string };

type ParsedRow = {
    row_index: number;
    guest_name: string;
    guest_phone: string | null;
    room_type: string | null;
    check_in_date: string | null;
    check_in_time: string | null;
    check_out_date: string | null;
    check_out_time: string | null;
    is_open_checkout: boolean;
    confirmation_number: string | null;
    remarks: string | null;
    vessel_id: number | null;
    vessel_name_raw: string | null;
    rank_id: number | null;
    rank_name_raw: string | null;
    hotel_id: number | null;
    hotel_name_raw: string | null;
    status: string;
    errors: string[];
    warnings: string[];
};

type Lookups = { vessels: LookupOption[]; ranks: LookupOption[]; hotels: LookupOption[] };

const ERROR_LABELS: Record<string, string> = {
    missing_guest_name: 'Guest name missing',
    missing_room_type: 'Room type missing',
    missing_check_in: 'Check-in date missing or invalid',
    missing_vessel: 'Vessel missing',
    vessel_unmatched: 'Vessel name does not match any in the database',
};

const WARNING_LABELS: Record<string, string> = {
    rank_unmatched: 'Rank name does not match any in the database (will be saved without a rank)',
};

const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-warning/15 text-warning border-warning/20',
    confirmed: 'bg-success/15 text-success border-success/20',
    rejected: 'bg-destructive/15 text-destructive border-destructive/20',
};

const ROOM_TYPE_OPTIONS = ['SINGLE', 'TWIN', 'TRIPLE', 'DOUBLE'];

type IssueCategory = 'all' | 'vessel' | 'check_in' | 'guest_name' | 'room_type' | 'other';

const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
    all: 'All issues',
    vessel: 'Vessel',
    check_in: 'Check-in date',
    guest_name: 'Guest name',
    room_type: 'Room type',
    other: 'Other',
};

type SubmitRow = {
    row_index: number;
    guest_name: string;
    guest_phone: string | null;
    room_type: string;
    check_in_date: string;
    check_in_time: string | null;
    check_out_date: string | null;
    check_out_time: string | null;
    vessel_id: number;
    rank_id: number | null;
    hotel_id: number | null;
    confirmation_number: string | null;
    remarks: string | null;
    status: string;
};

export default function BookingImportPage({ lookups }: { lookups: Lookups }) {
    const { props } = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>();
    const flashSuccess = props.flash?.success;

    const [step, setStep] = React.useState<'upload' | 'preview'>('upload');
    const [file, setFile] = React.useState<File | null>(null);
    const [dragActive, setDragActive] = React.useState(false);
    const [previewing, setPreviewing] = React.useState(false);
    const [fileError, setFileError] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [rows, setRows] = React.useState<ParsedRow[]>([]);
    const [skipped, setSkipped] = React.useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = React.useState<'importable' | 'issues' | 'skipped'>('importable');
    const [issueCategory, setIssueCategory] = React.useState<IssueCategory>('all');
    const [tabSwitching, setTabSwitching] = React.useState(false);
    const [issueTabSwitching, setIssueTabSwitching] = React.useState(false);
    const [skipSwitching, setSkipSwitching] = React.useState(false);
    const [importing, setImporting] = React.useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setFileError(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFileError(null);
        }
    };

    const removeFile = () => {
        setFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetAll = () => {
        setRows([]);
        setSkipped(new Set());
        setActiveTab('importable');
        setIssueCategory('all');
        setFile(null);
        setFileError(null);
        setStep('upload');

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleNext = async () => {
        if (!file) {
            return;
        }

        setPreviewing(true);
        setFileError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch(toUrl(importPreview()), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                body: formData,
            });
            const raw = await res.text();
            let json: Record<string, unknown> = {};

            try {
                json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
            } catch {
                // Keep json empty and log the raw body below.
            }

            if (!res.ok) {
                const msg = typeof json.error === 'string' ? json.error : `Preview failed (HTTP ${res.status}).`;
                setFileError(msg);

                return;
            }

            const parsedRows: ParsedRow[] = Array.isArray(json.rows) ? (json.rows as ParsedRow[]) : [];
            setRows(parsedRows);
            setSkipped(new Set());
            setIssueCategory('all');
            setActiveTab(parsedRows.some((r) => r.errors.length === 0) ? 'importable' : 'issues');
            setStep('preview');
        } catch {
            setFileError('Network error. Please try again.');
        } finally {
            setPreviewing(false);
        }
    };

    const updateRow = (rowIndex: number, patch: Partial<ParsedRow>) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.row_index !== rowIndex) {
                    return row;
                }

                const next = { ...row, ...patch };

                next.errors = next.errors.filter((err) => {
                    if (err === 'vessel_unmatched' || err === 'missing_vessel') {
                        return next.vessel_id === null;
                    }

                    if (err === 'missing_check_in') {
                        return next.check_in_date === null || next.check_in_date === '';
                    }

                    if (err === 'missing_room_type') {
                        return next.room_type === null || next.room_type.trim() === '';
                    }

                    return true;
                });

                if (next.vessel_id === null && !next.errors.some((e) => e === 'missing_vessel' || e === 'vessel_unmatched')) {
                    next.errors = [...next.errors, 'missing_vessel'];
                }

                if ((next.check_in_date === null || next.check_in_date === '') && !next.errors.includes('missing_check_in')) {
                    next.errors = [...next.errors, 'missing_check_in'];
                }

                if ((next.room_type === null || next.room_type.trim() === '') && !next.errors.includes('missing_room_type')) {
                    next.errors = [...next.errors, 'missing_room_type'];
                }

                next.warnings = next.warnings.filter((w) => {
                    if (w === 'rank_unmatched') {
                        return next.rank_id === null && next.rank_name_raw !== null && next.rank_name_raw !== '';
                    }

                    return true;
                });

                return next;
            }),
        );
    };

    const toggleSkip = (rowIndex: number) => {
        setSkipSwitching(true);
        setSkipped((prev) => {
            const next = new Set(prev);

            if (next.has(rowIndex)) {
                next.delete(rowIndex);
            } else {
                next.add(rowIndex);
            }

            return next;
        });

        window.setTimeout(() => setSkipSwitching(false), 120);
    };

    const skipAllIssues = () => {
        setSkipped((prev) => {
            const next = new Set(prev);
            rows.filter((r) => r.errors.length > 0).forEach((r) => next.add(r.row_index));

            return next;
        });
    };

    const importableRows = rows.filter((r) => r.errors.length === 0 && !skipped.has(r.row_index));
    const issueRows = rows.filter((r) => r.errors.length > 0 && !skipped.has(r.row_index));
    const skippedRows = rows.filter((r) => skipped.has(r.row_index));

    const errorToCategory = (error: string): IssueCategory => {
        if (error === 'missing_vessel' || error === 'vessel_unmatched') {
            return 'vessel';
        }

        if (error === 'missing_check_in') {
            return 'check_in';
        }

        if (error === 'missing_guest_name') {
            return 'guest_name';
        }

        if (error === 'missing_room_type') {
            return 'room_type';
        }

        return 'other';
    };

    const issueCategoryCounts = React.useMemo(() => {
        const counts: Record<IssueCategory, number> = {
            all: issueRows.length,
            vessel: 0,
            check_in: 0,
            guest_name: 0,
            room_type: 0,
            other: 0,
        };

        issueRows.forEach((row) => {
            const categories = new Set<IssueCategory>(row.errors.map(errorToCategory));
            categories.forEach((category) => {
                counts[category] += 1;
            });
        });

        return counts;
    }, [issueRows]);

    const availableIssueCategories = React.useMemo(() => {
        const ordered: IssueCategory[] = ['all', 'vessel', 'check_in', 'guest_name', 'room_type', 'other'];

        return ordered.filter((category) => category === 'all' || issueCategoryCounts[category] > 0);
    }, [issueCategoryCounts]);

    const effectiveIssueCategory: IssueCategory = availableIssueCategories.includes(issueCategory) ? issueCategory : 'all';

    const filteredIssueRows = React.useMemo(() => {
        if (effectiveIssueCategory === 'all') {
            return issueRows;
        }

        return issueRows.filter((row) => row.errors.some((error) => errorToCategory(error) === effectiveIssueCategory));
    }, [issueRows, effectiveIssueCategory]);

    const visibleRows =
        activeTab === 'importable' ? importableRows : activeTab === 'issues' ? filteredIssueRows : skippedRows;

    const canSubmit = importableRows.length > 0 && issueRows.length === 0;

    const switchTabWithLoading = (nextTab: 'importable' | 'issues' | 'skipped') => {
        if (activeTab === nextTab) {
            return;
        }

        setTabSwitching(true);
        // Allow one paint for the loading state, then switch the heavy list.
        window.setTimeout(() => {
            setActiveTab(nextTab);
            window.setTimeout(() => setTabSwitching(false), 140);
        }, 0);
    };

    const switchIssueCategoryWithLoading = (nextCategory: IssueCategory) => {
        if (effectiveIssueCategory === nextCategory) {
            return;
        }

        setIssueTabSwitching(true);
        // Same UX as primary tabs: render skeleton first, then switch list.
        window.setTimeout(() => {
            setIssueCategory(nextCategory);
            window.setTimeout(() => setIssueTabSwitching(false), 140);
        }, 0);
    };

    const handleImport = () => {
        if (!canSubmit) {
            return;
        }

        const payload: SubmitRow[] = importableRows.map((row) => ({
            row_index: row.row_index,
            guest_name: row.guest_name,
            guest_phone: row.guest_phone,
            room_type: row.room_type ?? '',
            check_in_date: row.check_in_date ?? '',
            check_in_time: row.check_in_time,
            check_out_date: row.check_out_date,
            check_out_time: row.check_out_time,
            vessel_id: row.vessel_id as number,
            rank_id: row.rank_id,
            hotel_id: row.hotel_id,
            confirmation_number: row.confirmation_number,
            remarks: row.remarks,
            status: row.status,
        }));

        setImporting(true);
        router.post(toUrl(importMethod()), { rows: payload }, {
            preserveScroll: true,
            onFinish: () => setImporting(false),
            onSuccess: () => resetAll(),
        });
    };

    return (
        <PageLayout title="Import Bookings" backHref={toUrl(bookingsIndex())}>
            <Head title="Import Bookings" />

            <div className="mb-8 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <a href={toUrl(dashboard())} className="hover:underline">
                        Dashboard
                    </a>
                    <span>/</span>
                    <a href={toUrl(bookingsIndex())} className="hover:underline">
                        Bookings
                    </a>
                    <span>/</span>
                    <span className="text-foreground">Import</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Import bookings from Excel</h1>
                <p className="text-[13px] text-muted-foreground">
                    Upload the Hotel Record template. We auto-map Vessel, Rank, and Hotel by name and surface anything missing so you can fix it before importing.
                </p>
            </div>

            {flashSuccess && step === 'upload' && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                    <div className="text-[13px] text-foreground">{flashSuccess}</div>
                </div>
            )}

            {step === 'upload' && (
                <div className="grid gap-4">
                    <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 p-4">
                        <div>
                            <p className="text-[13px] font-medium text-foreground">Need the format?</p>
                            <p className="mt-0.5 text-[12px] text-muted-foreground">
                                Download a CSV template with the expected column headers.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => (window.location.href = toUrl(importTemplate()))} className="gap-2">
                            <Download className="size-3.5" /> Template
                        </Button>
                    </div>

                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={cn(
                            'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
                            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/10',
                            fileError ? 'border-destructive/50 bg-destructive/5' : '',
                        )}
                    >
                        {!file ? (
                            <>
                                <Upload className="mb-3 size-10 text-muted-foreground" />
                                <h3 className="mb-1 text-sm font-semibold">Drag and drop your Excel file here</h3>
                                <p className="mb-4 text-xs text-muted-foreground">or click to browse (XLSX, XLS, CSV)</p>
                                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    Select File
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FileSpreadsheet className="mb-3 size-10 text-primary" />
                                <p className="max-w-xs break-all text-base font-medium">{file.name}</p>
                                <p className="mt-1 mb-4 text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        Change file
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={removeFile}
                                        title="Remove file"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                    </div>

                    {fileError && <p className="text-[13px] font-medium text-destructive">{fileError}</p>}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => router.visit(toUrl(bookingsIndex()))}>
                            Cancel
                        </Button>
                        <Button onClick={handleNext} disabled={!file || previewing}>
                            {previewing ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Reading file…
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 size-4" />
                                    Map &amp; preview
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'preview' && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <SummaryStat label="Total" value={rows.length} tone="neutral" />
                        <SummaryStat
                            label="Importable"
                            value={importableRows.length}
                            tone="success"
                            selected={activeTab === 'importable'}
                            onSelect={() => switchTabWithLoading('importable')}
                            aria-pressed={activeTab === 'importable'}
                        />
                        <SummaryStat
                            label="Issues"
                            value={issueRows.length}
                            tone="warning"
                            selected={activeTab === 'issues'}
                            onSelect={() => switchTabWithLoading('issues')}
                            aria-pressed={activeTab === 'issues'}
                        />
                        <SummaryStat
                            label="Skipped"
                            value={skippedRows.length}
                            tone="muted"
                            selected={activeTab === 'skipped'}
                            onSelect={() => switchTabWithLoading('skipped')}
                            aria-pressed={activeTab === 'skipped'}
                        />
                    </div>

                    {activeTab === 'issues' && issueRows.length > 0 && (
                        <div className="space-y-3 rounded-2xl border border-warning/30 bg-warning/5 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[12px] text-foreground">
                                    Fix issues inline using the inputs below, or skip rows you can&apos;t fix right now.
                                </p>
                                <Button variant="outline" size="sm" onClick={skipAllIssues}>
                                    Skip all issues
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {availableIssueCategories.map((category) => {
                                    const selected = effectiveIssueCategory === category;
                                    const count = issueCategoryCounts[category];

                                    return (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => switchIssueCategoryWithLoading(category)}
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all',
                                                selected
                                                    ? 'border-warning/60 bg-warning/20 text-warning'
                                                    : 'border-border/50 bg-background/70 text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            <span>{ISSUE_CATEGORY_LABELS[category]}</span>
                                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {tabSwitching || issueTabSwitching || skipSwitching ? (
                            <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                                <div className="grid gap-3">
                                    <div className="h-4 w-2/5 animate-pulse rounded bg-muted/40" />
                                    <div className="h-3 w-full animate-pulse rounded bg-muted/40" />
                                    <div className="h-3 w-5/6 animate-pulse rounded bg-muted/40" />
                                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted/40" />
                                </div>
                            </div>
                        ) : visibleRows.length === 0 ? (
                            <div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-10 text-center">
                                <p className="text-[14px] font-medium text-foreground">
                                    {activeTab === 'importable'
                                        ? 'No importable rows yet. Fix rows under Issues or skip them.'
                                        : activeTab === 'issues'
                                          ? effectiveIssueCategory === 'all'
                                              ? 'No issues remaining.'
                                              : `No rows found in "${ISSUE_CATEGORY_LABELS[effectiveIssueCategory]}" issues.`
                                          : 'No rows have been skipped.'}
                                </p>
                            </div>
                        ) : (
                            visibleRows.map((row) => (
                                <RowCard
                                    key={row.row_index}
                                    row={row}
                                    lookups={lookups}
                                    isSkipped={skipped.has(row.row_index)}
                                    onUpdate={updateRow}
                                    onToggleSkip={toggleSkip}
                                />
                            ))
                        )}
                    </div>

                    <div className="sticky bottom-4 z-10 mt-2 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-[13px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{importableRows.length}</span> importable
                            {issueRows.length > 0 && (
                                <span>
                                    {' · '}
                                    <span className="font-semibold text-warning">{issueRows.length}</span> issues
                                </span>
                            )}
                            {skippedRows.length > 0 && (
                                <span>
                                    {' · '}
                                    <span className="font-semibold">{skippedRows.length}</span> skipped
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" variant="ghost" onClick={resetAll}>
                                <ArrowLeft className="size-4" /> Start over
                            </Button>
                            <Button onClick={handleImport} disabled={!canSubmit || importing}>
                                {importing ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" /> Importing…
                                    </>
                                ) : (
                                    <>Import {importableRows.length} bookings</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}

BookingImportPage.layout = (page: React.ReactNode) => page;

function SummaryStat({
    label,
    value,
    tone,
    selected = false,
    onSelect,
    'aria-pressed': ariaPressed,
}: {
    label: string;
    value: number;
    tone: 'neutral' | 'success' | 'warning' | 'muted';
    selected?: boolean;
    onSelect?: () => void;
    'aria-pressed'?: boolean | 'true' | 'false';
}) {
    const toneClass = {
        neutral: 'border-border/40 bg-muted/30 text-foreground',
        success: 'border-success/30 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        muted: 'border-border/40 bg-muted/20 text-muted-foreground',
    }[tone];

    const interactive = typeof onSelect === 'function';
    const pad = 'flex min-h-[4.5rem] w-full flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all outline-none';

    if (interactive) {
        return (
            <button
                type="button"
                onClick={onSelect}
                aria-pressed={ariaPressed}
                aria-label={`Show ${label}: ${value} rows`}
                className={cn(
                    pad,
                    toneClass,
                    selected
                        ? 'ring-2 ring-primary/50 shadow-sm ring-offset-2 ring-offset-background'
                        : 'hover:border-primary/35 hover:bg-muted/40',
                    'focus-visible:ring-[3px] focus-visible:ring-ring/50',
                )}
            >
                <span className="text-2xl font-bold tabular-nums">{value}</span>
                <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            </button>
        );
    }

    return (
        <div className={cn(pad, toneClass)}>
            <span className="text-2xl font-bold tabular-nums">{value}</span>
            <span className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
    );
}

function RowCard({
    row,
    lookups,
    isSkipped,
    onUpdate,
    onToggleSkip,
}: {
    row: ParsedRow;
    lookups: Lookups;
    isSkipped: boolean;
    onUpdate: (rowIndex: number, patch: Partial<ParsedRow>) => void;
    onToggleSkip: (rowIndex: number) => void;
}) {
    const statusClass = STATUS_BADGE[row.status] ?? 'bg-muted/40 text-muted-foreground border-border/40';
    const showVesselFix = row.errors.some((e) => e === 'vessel_unmatched' || e === 'missing_vessel');
    const showCheckInFix = row.errors.includes('missing_check_in');
    const showRoomTypeFix = row.errors.includes('missing_room_type');
    const showRankFix = row.warnings.includes('rank_unmatched');

    return (
        <div
            className={cn(
                'rounded-2xl border p-4 transition-all',
                isSkipped ? 'border-border/40 bg-muted/30 opacity-70' : row.errors.length > 0 ? 'border-warning/30 bg-warning/5' : 'border-border/60 bg-card/40',
            )}
        >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold tabular-nums text-muted-foreground">#{row.row_index}</span>
                        <span className="truncate text-[14px] font-semibold text-foreground">{row.guest_name || '—'}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {row.hotel_name_raw ?? '—'}
                        {row.vessel_name_raw && ` · ${row.vessel_name_raw}`}
                        {row.rank_name_raw && ` · ${row.rank_name_raw}`}
                    </p>
                </div>
                <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide', statusClass)}>
                    {row.status}
                </Badge>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 text-[12px] text-muted-foreground sm:grid-cols-4">
                <Field label="Check-in" value={row.check_in_date ?? '—'} />
                <Field label="Check-out" value={row.is_open_checkout ? 'OPEN' : (row.check_out_date ?? '—')} />
                <Field label="Room type" value={row.room_type ?? '—'} />
                <Field label="Confirmation" value={row.confirmation_number ?? '—'} />
            </div>

            {row.errors.length > 0 && (
                <ul className="mb-3 space-y-1">
                    {row.errors.map((err) => (
                        <li key={err} className="flex items-start gap-2 text-[12px] text-warning">
                            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                            <span>{ERROR_LABELS[err] ?? err}</span>
                        </li>
                    ))}
                </ul>
            )}

            {showVesselFix && (
                <FixField
                    label="Pick a vessel"
                    placeholder="Search vessels…"
                    options={lookups.vessels}
                    value={row.vessel_id}
                    onChange={(id) => onUpdate(row.row_index, { vessel_id: id })}
                />
            )}

            {showCheckInFix && (
                <div className="mb-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pick a check-in date</p>
                    <Input
                        type="date"
                        value={row.check_in_date ?? ''}
                        onChange={(e) => onUpdate(row.row_index, { check_in_date: e.target.value || null })}
                        className="w-full rounded-xl bg-muted/30"
                    />
                </div>
            )}

            {showRoomTypeFix && (
                <FixField
                    label="Pick room type"
                    placeholder="Select room type…"
                    options={ROOM_TYPE_OPTIONS.map((name, idx) => ({ id: idx + 1, name }))}
                    value={row.room_type && ROOM_TYPE_OPTIONS.includes(row.room_type.toUpperCase())
                        ? ROOM_TYPE_OPTIONS.indexOf(row.room_type.toUpperCase()) + 1
                        : null}
                    onChange={(id) => {
                        const value = id === null ? null : ROOM_TYPE_OPTIONS[id - 1] ?? null;
                        onUpdate(row.row_index, { room_type: value });
                    }}
                />
            )}

            {showRankFix && (
                <div className="mb-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                    <p className="mb-2 flex items-center gap-2 text-[12px] text-muted-foreground">
                        <AlertTriangle className="size-3.5" />
                        {WARNING_LABELS.rank_unmatched}
                    </p>
                    <FixField
                        label="Map a rank (optional)"
                        placeholder="Search ranks…"
                        options={lookups.ranks}
                        value={row.rank_id}
                        onChange={(id) => onUpdate(row.row_index, { rank_id: id })}
                    />
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/30 pt-3">
                <p className="text-[12px] text-muted-foreground">
                    {row.guest_phone ?? 'No phone'} {row.remarks ? ` · ${row.remarks}` : ''}
                </p>
                <Button type="button" size="sm" variant={isSkipped ? 'secondary' : 'ghost'} onClick={() => onToggleSkip(row.row_index)}>
                    {isSkipped ? (
                        <>
                            <CheckSquare2 className="size-3.5" /> Restore
                        </>
                    ) : (
                        <>
                            <Square className="size-3.5" /> Skip
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">{label}</p>
            <p className="truncate text-[13px] font-medium text-foreground">{value}</p>
        </div>
    );
}

function FixField({
    label,
    placeholder,
    options,
    value,
    onChange,
}: {
    label: string;
    placeholder: string;
    options: LookupOption[];
    value: number | null;
    onChange: (id: number | null) => void;
}) {
    return (
        <div className="mb-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <Select
                value={value !== null ? String(value) : ''}
                onValueChange={(v) => onChange(v === '' ? null : Number(v))}
            >
                <SelectTrigger className="w-full rounded-xl bg-muted/30">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((opt) => (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
