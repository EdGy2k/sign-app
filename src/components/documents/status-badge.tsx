import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'voided' | 'pending';

interface StatusBadgeProps {
    status: DocumentStatus;
    className?: string;
}

const statusMap: Record<DocumentStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200' },
    sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' },
    viewed: { label: 'Viewed', className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200' },
    signed: { label: 'Signed', className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' },
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200' },
    expired: { label: 'Expired', className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200' },
    voided: { label: 'Voided', className: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusMap[status] || statusMap.draft;

    return (
        <Badge variant="outline" className={cn("font-medium", config.className, className)}>
            {config.label}
        </Badge>
    );
}
