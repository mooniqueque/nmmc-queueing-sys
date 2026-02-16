"use client";

import Image from "next/image";

/**
 * COMPONENT: AuthBanner
 * The visual "Right Side" of the authentication pages, 
 * housing the branding imagery and system title.
 */
export function AuthBanner() {
    return (
        <div className="relative hidden lg:block flex-1 overflow-hidden min-h-[500px]">
            {/* Overlay Gradient */}
            <div className="absolute inset-0 z-10 bg-linear-to-b from-emerald-900/80 via-emerald-800/40 to-emerald-900/80" />

            <Image
                src="/nmmcpics.png"
                alt="NMMC Facility"
                fill
                className="absolute inset-0 h-full w-full object-cover grayscale-20"
                priority
            />

            <div className="relative z-20 h-full flex flex-col items-center justify-center px-10 text-white text-center">
                <div className="mb-6 transform hover:scale-105 transition-all duration-700 ease-in-out">
                    <Image
                        src="/logo.png"
                        alt="Hospital Logo"
                        width={120}
                        height={120}
                        className="drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]"
                    />
                </div>

                <p className="text-sm font-bold tracking-[0.3em] mb-3 text-shadow-md uppercase opacity-90">
                    Northern Mindanao Medical Center
                </p>

                <h2 className="text-4xl xl:text-5xl font-black tracking-tighter text-shadow-xl leading-none uppercase">
                    Queueing System
                </h2>

                <div className="mt-8 w-16 h-1 bg-white/30 rounded-full" />
            </div>
        </div>
    );
}
