import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed bg-muted/20 min-h-[300px]", className)}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-6">
                {description}
            </p>

            {(actionLabel && (actionHref || onAction)) && (
                actionHref ? (
                    <Button asChild>
                        <Link href={actionHref}>{actionLabel}</Link>
                    </Button>
                ) : (
                    <Button onClick={onAction}>{actionLabel}</Button>
                )
            )}
        </div>
    );
}
