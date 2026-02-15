import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * LOADING UI: Admin Dashboard Skeleton
 * This component provides a "shimmer" effect while the server fetches user data.
 * It improves Perceived Performance (LCP) and prevents layout shifts.
 */
export default function Loading() {
    return (
        <div className="flex min-h-screen w-full bg-slate-50/50 p-8">
            <div className="w-full space-y-6">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48 rounded-md" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-4 space-y-3 border-0 shadow-sm ring-1 ring-slate-100">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-6 w-12" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Table Skeleton */}
                <Card className="p-6 border-0 shadow-sm ring-1 ring-slate-200">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-md" />
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
