import { useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
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
import { importMethod as importVessels, importTemplate } from '@/routes/admin/vessels';

interface VesselImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VesselImportModal({ open, onOpenChange }: VesselImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{ file: File | null }>({
        file: null,
    });

    const handleClose = () => {
        onOpenChange(false);
        reset();
        clearErrors();
    };

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
            setData('file', e.dataTransfer.files[0]);
            clearErrors('file');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (e.target.files && e.target.files[0]) {
            setData('file', e.target.files[0]);
            clearErrors('file');
        }
    };

    const handleRemoveFile = () => {
        setData('file', null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = () => {
        post(toUrl(importVessels()), {
            preserveScroll: true,
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const downloadTemplate = () => {
        window.location.href = toUrl(importTemplate());
    };

    return (
        <Dialog open={open} onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="size-5 text-muted-foreground" />
                        Import Vessels
                    </DialogTitle>
                    <DialogDescription>
                        Upload an Excel or CSV file to bulk import vessels.
                    </DialogDescription>
                </DialogHeader>

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
                        } ${errors.file ? 'border-destructive/50 bg-destructive/5' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {!data.file ? (
                            <>
                                <Upload className="size-8 text-muted-foreground mb-3" />
                                <h3 className="text-sm font-semibold mb-1">Drag and drop file here</h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                    or click to browse your files (XLSX, CSV)
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Select File
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FileSpreadsheet className="size-8 text-primary mb-3" />
                                <p className="text-sm font-medium break-all max-w-[250px]">{data.file.name}</p>
                                <p className="text-xs text-muted-foreground mt-1 mb-4">
                                    {(data.file.size / 1024).toFixed(1)} KB
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
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

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={handleChange}
                        />
                    </div>
                    {errors.file && <p className="text-[13px] font-medium text-destructive mt-1">{errors.file}</p>}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!data.file || processing}>
                        {processing ? 'Importing...' : 'Upload & Import'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
