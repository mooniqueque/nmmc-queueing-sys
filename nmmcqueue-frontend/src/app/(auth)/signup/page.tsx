export const dynamic = 'force-dynamic';

import { FullPageSkeleton } from "@/components/ui/page-skeleton";
import ParticlesBackground from "@/components/ui/particles-background";
import { Suspense } from "react";
import SignupData from "./_components/signup-data";

export default function SignupPage() {
  return (
    <div className="relative overflow-hidden flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      {/* Circle Bg */}
      <ParticlesBackground />
      {/* Form */}
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Suspense fallback={<FullPageSkeleton />}>
          <SignupData />
        </Suspense>
      </div>
    </div>
  );
}
