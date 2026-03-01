export const dynamic = 'force-dynamic';

import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import CallerData from "./_components/caller-data";

export default function Page() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <CallerData />
        </Suspense>
    );
}