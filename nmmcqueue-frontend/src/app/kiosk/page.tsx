import { KioskForm } from "./_components/kiosk-form";
import ParticlesBackground from "@/components/ui/particles-background"

export default function KioskPage() {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 overflow-hidden">

            {/* Cicrle Bg*/}
            <ParticlesBackground />

            <KioskForm />
        </div>
    );
}
