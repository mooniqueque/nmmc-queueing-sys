export const dynamic = 'force-dynamic';

import { LoadingSpinner } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import WorkstationsData from "@/features/admin/components/workstations-data";

export default function WorkstationsPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <WorkstationsData />
        </Suspense>
    );
}
