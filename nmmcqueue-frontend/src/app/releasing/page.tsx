export const dynamic = 'force-dynamic';

import { FullPageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ReleasingData from "./_components/releasing-data";

export default function ReleasingPage() {
  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <ReleasingData />
    </Suspense>
  );
}
