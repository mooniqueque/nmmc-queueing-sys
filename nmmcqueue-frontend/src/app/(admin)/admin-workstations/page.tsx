export const dynamic = 'force-dynamic';

import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import WorkstationsData from "@/features/admin/components/workstations-data";

export default function WorkstationsPage() {
    return (
        <Suspense fallback={<PageSkeleton header="Manage Workstations" lines={4} />}>
            <WorkstationsData />
        </Suspense>
    );
}
