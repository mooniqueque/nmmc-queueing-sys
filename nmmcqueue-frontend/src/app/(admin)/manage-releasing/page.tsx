export const dynamic = 'force-dynamic';

import { LoadingSpinner } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ManageReleasingData from "@/features/admin/components/admin-settings/manage-releasing-data";

export default function ManageReleasingPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ManageReleasingData />
        </Suspense>
    );
}
