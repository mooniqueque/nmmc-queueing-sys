export const dynamic = 'force-dynamic';

import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import DepartmentsData from "@/features/admin/components/departments-data";

export default function DepartmentsPage() {
    return (
        <Suspense fallback={<PageSkeleton header="Manage Departments" lines={4} />}>
            <DepartmentsData />
        </Suspense>
    );
}
