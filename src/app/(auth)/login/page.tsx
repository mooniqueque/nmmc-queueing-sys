import LoginForm from "@/components/forms/login-form"
import ParticlesBackground from "@/components/ui/particles-background"

export default function LoginPage() {
    return (
        // Container
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 overflow-hidden">

            {/* Cicrle Bg*/}
            <ParticlesBackground />

            {/*Form */}
            <div className="w-full max-w-sm md:max-w-5xl z-10">
                <LoginForm />
            </div>
        </div>
    )
}