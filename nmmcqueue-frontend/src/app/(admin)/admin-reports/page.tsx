export const dynamic = 'force-dynamic';

import { LoadingSpinner } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ReportsData from "@/features/reports/components/reports-data";

export default function Page() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ReportsData />
        </Suspense>
    );
}
