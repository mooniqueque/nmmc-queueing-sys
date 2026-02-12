import { SignupForm } from "@/components/forms/signup-form"
import ParticlesBackground from "@/components/ui/particles-background"

export default function SignupPage() {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10">

            <ParticlesBackground />

            <div className="w-full max-w-sm md:max-w-5xl">
                <SignupForm />
            </div>
        </div>
    )
}