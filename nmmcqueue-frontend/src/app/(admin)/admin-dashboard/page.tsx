export const dynamic = 'force-dynamic';

import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import AdminDashboardData from "@/features/admin/components/admin-dashboard-data";

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton lines={6} />}>
      <AdminDashboardData />
    </Suspense>
  );
}