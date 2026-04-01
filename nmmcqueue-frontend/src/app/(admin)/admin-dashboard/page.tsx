export const dynamic = 'force-dynamic';

import { LoadingSpinner } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import AdminDashboardData from "@/features/admin/components/admin-dashboard-data";

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboardData />
    </Suspense>
  );
}