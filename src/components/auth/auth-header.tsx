"use client";

import { CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface AuthHeaderProps {
    title: string;
}

/**
 * COMPONENT: AuthHeader
 * Unified header for login and signup pages to ensure consistent branding.
 */
export function AuthHeader({ title }: AuthHeaderProps) {
    return (
        <div className="flex flex-col items-center gap-4 mb-4">
            <Link
                href="/"
                className="flex flex-col items-center gap-2 group transition-all"
            >
                <Image
                    src="/nmmc-logo.png"
                    alt="NMMC LOGO"
                    width={80}
                    height={80}
                    className="rounded-full shadow-md transition-transform group-hover:scale-105"
                />
                <h1 className="text-xl font-bold tracking-tight text-emerald-950 text-center px-4">
                    Northern Mindanao Medical Center
                </h1>
            </Link>
            <CardTitle className="text-xl font-semibold text-slate-700">{title}</CardTitle>
        </div>
    );
}
