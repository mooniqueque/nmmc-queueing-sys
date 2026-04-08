export const dynamic = 'force-dynamic';

import { LoadingSpinner } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ReleasingData from "@/features/releasing/components/releasing-data";

export default function ReleasingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ReleasingData />
    </Suspense>
  );
}
