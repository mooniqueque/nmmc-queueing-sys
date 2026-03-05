export const dynamic = 'force-dynamic';

import { FullPageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import TriageData from "@/features/triage/components/triage-data";

export default function TriageDashboardPage() {
    return (
        <Suspense fallback={<FullPageSkeleton />}>
            <TriageData />
        </Suspense>
    );
}
