import { KioskForm } from "@/features/kiosk/components/kiosk-form";
import ParticlesBackground from "@/components/ui/particles-background";
import { Suspense } from "react";

export default function KioskFormPage() {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 overflow-hidden">
            <ParticlesBackground />

            {/* WRAP WITH SUSPENSE TO READ URL SEARCH PARAMETERS*/}
            <Suspense fallback={<div className="z-10">Loading form...</div>}>
                <KioskForm />
            </Suspense>
        </div>
    );
}
