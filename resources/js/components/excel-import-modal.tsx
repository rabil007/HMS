import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckSquare2, Download, FileSpreadsheet, Loader2, Square, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface ExcelImportModalProps {
    /** Whether the modal is visible. */
    open: boolean;
    onOpenChange: (open: boolean) => void;

    /** Human-readable name shown in headings, e.g. "Vessels", "Ranks". */
    entityLabel: string;

    /**
     * POST URL that accepts a `file` field and returns JSON:
     * `{ rows: { name: string; isDuplicate: boolean }[] }`
     * or `{ error: string }` with a 4xx status.
     */
    previewUrl: string;

    /**
     * POST URL that accepts `{ names: string[] }` and redirects on success.
     */
    importUrl: string;

    /**
     * Optional GET URL to download the Excel template.
     * If omitted, the template download button is hidden.
     */
    templateUrl?: string;
}

type Step = 'upload' | 'preview';
type Tab = 'all' | 'new' | 'duplicates';

interface PreviewRow {
    name: string;
    isDuplicate: boolean;
}

/**
 * A fully generic Excel import modal with a two-step flow:
 *  1. Upload a file (drag & drop or browse)
 *  2. Preview the parsed rows (with duplicate detection) and confirm import
 *
 * Wire up module-specific URLs via props and it works for any simple "name-only" resource.
 */
export function ExcelImportModal({ open, onOpenChange, entityLabel, previewUrl, importUrl, templateUrl }: ExcelImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<Step>('upload');
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [previewing, setPreviewing] = useState(false);

    // Preview step state
    const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setStep('upload');
            setFile(null);
            setFileError(null);
            setPreviewRows([]);
            setSelectedIndices(new Set());
            setActiveTab('all');
            setImportError(null);
        }, 200);
    };

    // ── Drag & drop ──────────────────────────────────────────────────────────
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
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

    const handleRemoveFile = () => {
        setFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // ── Step 1 → Step 2: parse file, show preview ────────────────────────────
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

            const res = await fetch(previewUrl, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Inertia': 'true',
                    Accept: 'application/json',
                },
                body: formData,
            });

            const json = await res.json();

            if (!res.ok) {
                setFileError(json.error ?? 'Failed to read file.');
                return;
            }

            const rows: PreviewRow[] = json.rows ?? [];

            if (rows.length === 0) {
                setFileError(`No valid ${entityLabel.toLowerCase()} found in the file. Check that you have a "Name" header column.`);
                return;
            }

            setPreviewRows(rows);
            // Pre-select only the NEW rows (non-duplicates)
            setSelectedIndices(new Set(rows.map((r, i) => (!r.isDuplicate ? i : -1)).filter((i) => i >= 0)));
            setActiveTab('all');
            setStep('preview');
        } catch {
            setFileError('Network error. Please try again.');
        } finally {
            setPreviewing(false);
        }
    };

    // ── Checkbox helpers ──────────────────────────────────────────────────────
    const visibleRows = previewRows.reduce<{ row: PreviewRow; globalIndex: number }[]>((acc, row, i) => {
        const matches = activeTab === 'all' || (activeTab === 'new' && !row.isDuplicate) || (activeTab === 'duplicates' && row.isDuplicate);

        if (matches) {
            acc.push({ row, globalIndex: i });
        }

        return acc;
    }, []);

    const allVisibleSelected = visibleRows.length > 0 && visibleRows.every(({ globalIndex }) => selectedIndices.has(globalIndex));

    const toggleAllVisible = () => {
        setSelectedIndices((prev) => {
            const next = new Set(prev);

            if (allVisibleSelected) {
                visibleRows.forEach(({ globalIndex }) => next.delete(globalIndex));
            } else {
                visibleRows.forEach(({ globalIndex }) => next.add(globalIndex));
            }

            return next;
        });
    };

    const toggleRow = (globalIndex: number) => {
        setSelectedIndices((prev) => {
            const next = new Set(prev);

            if (next.has(globalIndex)) {
                next.delete(globalIndex);
            } else {
                next.add(globalIndex);
            }

            return next;
        });
    };

    const newCount = previewRows.filter((r) => !r.isDuplicate).length;
    const dupCount = previewRows.filter((r) => r.isDuplicate).length;

    // ── Step 2 → Import selected names ───────────────────────────────────────
    const handleImport = () => {
        const namesToImport = previewRows.filter((_, i) => selectedIndices.has(i)).map((r) => r.name);

        if (namesToImport.length === 0) {
            setImportError('Please select at least one item to import.');
            return;
        }

        setImporting(true);
        setImportError(null);

        router.post(
            importUrl,
            { names: namesToImport },
            {
                preserveScroll: true,
                onSuccess: () => handleClose(),
                onError: (errors) => {
                    setImportError(errors.names ?? errors['names.0'] ?? 'Import failed. Please try again.');
                    setImporting(false);
                },
                onFinish: () => setImporting(false),
            },
        );
    };

    // ── Tab config ────────────────────────────────────────────────────────────
    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: previewRows.length },
        { id: 'new', label: 'New', count: newCount },
        { id: 'duplicates', label: 'Duplicates', count: dupCount },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="size-5 text-muted-foreground" />
                        Import {entityLabel}
                        {step === 'preview' && (
                            <span className="ml-auto text-[11px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Step 2 of 2 — Review
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'upload'
                            ? `Upload an Excel or CSV file to bulk import ${entityLabel.toLowerCase()}.`
                            : `${previewRows.length} ${entityLabel.toLowerCase()} found. Review and select the ones you want to import.`}
                    </DialogDescription>
                </DialogHeader>

                {/* ── Step 1: Upload ─────────────────────────────────────────── */}
                {step === 'upload' && (
                    <div className="space-y-4 py-2 overflow-y-auto">
                        {templateUrl && (
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                <div className="text-sm">
                                    <p className="font-medium">Need the format?</p>
                                    <p className="text-muted-foreground text-xs mt-0.5">Download our ready-to-use template.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => (window.location.href = templateUrl)} className="gap-2">
                                    <Download className="size-3.5" />
                                    Template
                                </Button>
                            </div>
                        )}

                        <div
                            className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors text-center ${
                                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/10'
                            } ${fileError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {!file ? (
                                <>
                                    <Upload className="size-10 text-muted-foreground mb-3" />
                                    <h3 className="text-sm font-semibold mb-1">Drag and drop file here</h3>
                                    <p className="text-xs text-muted-foreground mb-4">or click to browse (XLSX, XLS, CSV)</p>
                                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        Select File
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <FileSpreadsheet className="size-10 text-primary mb-3" />
                                    <p className="text-base font-medium break-all max-w-xs">{file.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1 mb-4">{(file.size / 1024).toFixed(1)} KB</p>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            Change File
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={handleRemoveFile}
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
                    </div>
                )}

                {/* ── Step 2: Preview with tabs ──────────────────────────────── */}
                {step === 'preview' && (
                    <div className="flex flex-col min-h-0 flex-1 py-2 gap-3">
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-3 shrink-0">
                            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 border border-border/40">
                                <span className="text-2xl font-bold text-foreground">{previewRows.length}</span>
                                <span className="text-[11px] text-muted-foreground mt-0.5">Total Rows</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-2xl font-bold text-emerald-500">{newCount}</span>
                                <span className="text-[11px] text-muted-foreground mt-0.5">New</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <span className="text-2xl font-bold text-amber-500">{dupCount}</span>
                                <span className="text-[11px] text-muted-foreground mt-0.5">Duplicates</span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-muted/40 rounded-lg shrink-0">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                    <span
                                        className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                                            activeTab === tab.id
                                                ? tab.id === 'duplicates'
                                                    ? 'bg-amber-500/15 text-amber-600'
                                                    : tab.id === 'new'
                                                      ? 'bg-emerald-500/15 text-emerald-600'
                                                      : 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Select-all bar */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 rounded-lg border border-border/40 shrink-0">
                            <button
                                type="button"
                                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                                onClick={toggleAllVisible}
                            >
                                {allVisibleSelected ? (
                                    <CheckSquare2 className="size-4 text-primary" />
                                ) : (
                                    <Square className="size-4 text-muted-foreground" />
                                )}
                                {allVisibleSelected ? 'Deselect all visible' : 'Select all visible'}
                            </button>
                            <span className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">{selectedIndices.size}</span> / {previewRows.length} selected
                            </span>
                        </div>

                        {/* Scrollable row list */}
                        <div className="border border-border/60 rounded-xl overflow-hidden flex-1 min-h-0">
                            <div className="h-full overflow-y-auto">
                                {visibleRows.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <p className="text-sm font-medium text-foreground">No rows in this tab</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activeTab === 'duplicates'
                                                ? `No duplicate ${entityLabel.toLowerCase()} found — great!`
                                                : `All ${entityLabel.toLowerCase()} are duplicates.`}
                                        </p>
                                    </div>
                                ) : (
                                    visibleRows.map(({ row, globalIndex }) => {
                                        const checked = selectedIndices.has(globalIndex);

                                        return (
                                            <button
                                                key={globalIndex}
                                                type="button"
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border/30 last:border-0 hover:bg-muted/20 ${
                                                    checked ? 'bg-primary/5' : ''
                                                }`}
                                                onClick={() => toggleRow(globalIndex)}
                                            >
                                                {checked ? (
                                                    <CheckSquare2 className="size-4 text-primary shrink-0" />
                                                ) : (
                                                    <Square className="size-4 text-muted-foreground shrink-0" />
                                                )}

                                                <span
                                                    className={`flex-1 text-[13px] ${checked ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                                                >
                                                    {row.name}
                                                </span>

                                                {row.isDuplicate ? (
                                                    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 shrink-0">
                                                        <AlertTriangle className="size-3" />
                                                        Already exists
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 shrink-0">
                                                        New
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {importError && <p className="text-[13px] font-medium text-destructive shrink-0">{importError}</p>}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-2 shrink-0 border-t border-border/40 pt-4">
                    {step === 'upload' && (
                        <>
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleNext} disabled={!file || previewing}>
                                {previewing ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Reading file…
                                    </>
                                ) : (
                                    'Next →'
                                )}
                            </Button>
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            <Button type="button" variant="ghost" onClick={() => setStep('upload')} className="gap-1.5">
                                <ArrowLeft className="size-4" />
                                Back
                            </Button>
                            <Button onClick={handleImport} disabled={selectedIndices.size === 0 || importing}>
                                {importing ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Importing…
                                    </>
                                ) : (
                                    `Import ${selectedIndices.size} ${selectedIndices.size === 1 ? entityLabel.replace(/s$/, '') : entityLabel}`
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
