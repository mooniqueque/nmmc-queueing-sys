import Link from "next/link";
import { Button } from "@/components/ui/button";
import ParticlesBackground from "@/components/ui/particles-background";
import Image from "next/image.js";
export default function KioskWelcomePage() {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 overflow-hidden">
            {/* Background */}
            <ParticlesBackground />
            {/* Welcome Container */}
            <div className="z-10 bg-white/80 backdrop-blur-md p-10 rounded-xl shadow-xl border border-slate-200 max-w-lg w-full space-y-8 text-center">

                <div className="space-y-2">
                    <div className="flex flex-col items-center" >
                        <Image
                            src="/logo.png"
                            alt="NMMC Logo"
                            width={60}
                            height={70}
                            className="rounded-full ring-2 ring-emerald-100 object-cover"
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold text-emerald-800">Welcome to NMMC</h1>
                    <p className="text-slate-600">Please select an option below to proceed.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <Link href="/kiosk/form" className="w-full">
                        <Button className="w-full h-16 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                            Register for Consultation
                        </Button>
                    </Link>
                    <div className="pt-4 border-t border-slate-300 mt-2">
                        {/* Survey Button */}
                        <Link href="/kiosk/survey" className="w-full">
                            <Button variant="outline" className="w-full h-14 text-md font-medium border-slate-300 text-slate-700">
                                Take a Quick Survey
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}