import { router } from '@inertiajs/react';
import { ArrowLeft, CheckSquare2, Download, FileSpreadsheet, Loader2, Square, Upload, X } from 'lucide-react';
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
import { toUrl } from '@/lib/utils';
import { importMethod as importVessels, importPreview, importTemplate } from '@/routes/admin/vessels';

interface VesselImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview';

export function VesselImportModal({ open, onOpenChange }: VesselImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<Step>('upload');
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [previewing, setPreviewing] = useState(false);

    // Preview step state
    const [previewNames, setPreviewNames] = useState<string[]>([]);
    const [selectedNames, setSelectedNames] = useState<Set<number>>(new Set());
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const handleClose = () => {
        onOpenChange(false);
        // Reset all state
        setTimeout(() => {
            setStep('upload');
            setFile(null);
            setFileError(null);
            setPreviewNames([]);
            setSelectedNames(new Set());
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

    // ── Step 1 → Step 2: parse file, show preview ─────────────────────────
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

            const names: string[] = json.names ?? [];

            if (names.length === 0) {
                setFileError('No valid vessel names found in the file. Check that you have a "Name" header column.');
                return;
            }

            setPreviewNames(names);
            setSelectedNames(new Set(names.map((_, i) => i)));
            setStep('preview');
        } catch {
            setFileError('Network error. Please try again.');
        } finally {
            setPreviewing(false);
        }
    };

    // ── Checkbox helpers ──────────────────────────────────────────────────
    const allSelected = selectedNames.size === previewNames.length;

    const toggleAll = () => {
        if (allSelected) {
            setSelectedNames(new Set());
        } else {
            setSelectedNames(new Set(previewNames.map((_, i) => i)));
        }
    };

    const toggleRow = (index: number) => {
        setSelectedNames((prev) => {
            const next = new Set(prev);

            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }

            return next;
        });
    };

    // ── Step 2 → Import selected names ───────────────────────────────────
    const handleImport = () => {
        const namesToImport = previewNames.filter((_, i) => selectedNames.has(i));

        if (namesToImport.length === 0) {
            setImportError('Please select at least one vessel to import.');
            return;
        }

        setImporting(true);
        setImportError(null);

        router.post(
            toUrl(importVessels()),
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

    const downloadTemplate = () => {
        window.location.href = toUrl(importTemplate());
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="size-5 text-muted-foreground" />
                        Import Vessels
                        {step === 'preview' && (
                            <span className="ml-auto text-[11px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Step 2 of 2 — Review
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'upload'
                            ? 'Upload an Excel or CSV file to bulk import vessels.'
                            : `${previewNames.length} vessel${previewNames.length !== 1 ? 's' : ''} found. Select the ones you want to import.`}
                    </DialogDescription>
                </DialogHeader>

                {/* ── Step 1: Upload ─────────────────────────────────────────── */}
                {step === 'upload' && (
                    <div className="space-y-4 py-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                            <div className="text-sm">
                                <p className="font-medium">Need the format?</p>
                                <p className="text-muted-foreground text-xs mt-0.5">Download our ready-to-use template.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                                <Download className="size-3.5" />
                                Template
                            </Button>
                        </div>

                        <div
                            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors text-center ${
                                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/10'
                            } ${fileError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {!file ? (
                                <>
                                    <Upload className="size-8 text-muted-foreground mb-3" />
                                    <h3 className="text-sm font-semibold mb-1">Drag and drop file here</h3>
                                    <p className="text-xs text-muted-foreground mb-4">or click to browse (XLSX, XLS, CSV)</p>
                                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        Select File
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <FileSpreadsheet className="size-8 text-primary mb-3" />
                                    <p className="text-sm font-medium break-all max-w-[250px]">{file.name}</p>
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

                {/* ── Step 2: Preview checklist ──────────────────────────────── */}
                {step === 'preview' && (
                    <div className="py-2 space-y-3">
                        {/* Select all bar */}
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
                            <button
                                type="button"
                                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                                onClick={toggleAll}
                            >
                                {allSelected ? (
                                    <CheckSquare2 className="size-4 text-primary" />
                                ) : (
                                    <Square className="size-4 text-muted-foreground" />
                                )}
                                {allSelected ? 'Deselect all' : 'Select all'}
                            </button>
                            <span className="text-xs text-muted-foreground">
                                {selectedNames.size} / {previewNames.length} selected
                            </span>
                        </div>

                        {/* Scrollable list */}
                        <div className="border border-border/60 rounded-xl overflow-hidden">
                            <div className="max-h-60 overflow-y-auto">
                                {previewNames.map((name, index) => {
                                    const checked = selectedNames.has(index);

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors border-b border-border/30 last:border-0 hover:bg-muted/20 ${
                                                checked ? 'bg-primary/5' : ''
                                            }`}
                                            onClick={() => toggleRow(index)}
                                        >
                                            {checked ? (
                                                <CheckSquare2 className="size-4 text-primary shrink-0" />
                                            ) : (
                                                <Square className="size-4 text-muted-foreground shrink-0" />
                                            )}
                                            <span className={checked ? 'font-medium' : 'text-muted-foreground'}>{name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {importError && <p className="text-[13px] font-medium text-destructive">{importError}</p>}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-2">
                    {step === 'upload' && (
                        <>
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleNext} disabled={!file || previewing}>
                                {previewing ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Reading…
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
                            <Button onClick={handleImport} disabled={selectedNames.size === 0 || importing}>
                                {importing ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Importing…
                                    </>
                                ) : (
                                    `Import ${selectedNames.size} Vessel${selectedNames.size !== 1 ? 's' : ''}`
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
