export const dynamic = 'force-dynamic';

import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import CallerData from "@/features/caller/components/caller-data";

export default function Page() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <CallerData />
        </Suspense>
    );
}
