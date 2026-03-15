import ParticlesBackground from "@/components/ui/particles-background";
import { SurveyForm } from "@/features/kiosk/components/kiosk-survey";

export default function SurveyPage() {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 overflow-hidden">
            {/* Background */}
            <ParticlesBackground />
            {/* Render the Client Component */}
            <SurveyForm />
        </div>
    );
}