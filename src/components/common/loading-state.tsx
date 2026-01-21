import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
    className?: string;
    count?: number;
}

export function LoadingState({ className, count = 3 }: LoadingStateProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function PageLoading() {
    return (
        <div className="flex flex-col space-y-3 p-8">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-full max-w-[500px]" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                <Skeleton className="h-[200px] rounded-xl" />
                <Skeleton className="h-[200px] rounded-xl" />
                <Skeleton className="h-[200px] rounded-xl" />
            </div>
        </div>
    )
}
