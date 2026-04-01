export const dynamic = 'force-dynamic';

import { LoadingSpinner } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ManageDepartmentsData from "@/features/admin/components/departments-data";

export default function AdminDepartmentsPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ManageDepartmentsData />
        </Suspense>
    );
}
