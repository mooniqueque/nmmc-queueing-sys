export const dynamic = 'force-dynamic';

import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ManageReleasingData from "@/features/admin/components/admin-settings/manage-releasing-data";

export default function ManageReleasingPage() {
    return (
        <Suspense fallback={<DashboardSkeleton lines={5} />}>
            <ManageReleasingData />
        </Suspense>
    );
}
