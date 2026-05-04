import { ExcelImportModal } from '@/components/excel-import-modal';
import { toUrl } from '@/lib/utils';
import { importMethod as importRanks, importPreview, importTemplate } from '@/routes/admin/ranks';

interface RankImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RankImportModal({ open, onOpenChange }: RankImportModalProps) {
    return (
        <ExcelImportModal
            open={open}
            onOpenChange={onOpenChange}
            entityLabel="Ranks"
            previewUrl={toUrl(importPreview())}
            importUrl={toUrl(importRanks())}
            templateUrl={toUrl(importTemplate())}
        />
    );
}
