export const dynamic = 'force-dynamic';

import { LoadingSpinner } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import TriageData from "@/features/triage/components/triage-data";

export default function TriageDashboardPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <TriageData />
        </Suspense>
    );
}
