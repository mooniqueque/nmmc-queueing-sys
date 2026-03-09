export const dynamic = 'force-dynamic';

import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ReleasingData from "@/features/admin/components/releasing-data";

export default function Page() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <ReleasingData />
        </Suspense>
    );
}
