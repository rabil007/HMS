import { ExcelImportModal } from '@/components/excel-import-modal';
import { toUrl } from '@/lib/utils';
import { importMethod as importVessels, importPreview, importTemplate } from '@/routes/admin/vessels';

interface VesselImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VesselImportModal({ open, onOpenChange }: VesselImportModalProps) {
    return (
        <ExcelImportModal
            open={open}
            onOpenChange={onOpenChange}
            entityLabel="Vessels"
            previewUrl={toUrl(importPreview())}
            importUrl={toUrl(importVessels())}
            templateUrl={toUrl(importTemplate())}
        />
    );
}
