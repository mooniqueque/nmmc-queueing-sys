export const dynamic = 'force-dynamic';

import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ReportsData from "./_components/reports-data";

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ReportsData />
    </Suspense>
  );
}
