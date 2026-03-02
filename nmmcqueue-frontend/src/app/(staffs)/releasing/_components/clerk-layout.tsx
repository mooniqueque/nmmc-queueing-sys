"use client";

import { ReactNode } from "react";

interface ClerkLayoutProps {
    sidebarSlot: ReactNode;
    contentSlot: ReactNode;
}

export function ClerkLayout({ sidebarSlot, contentSlot }: ClerkLayoutProps) {
    return (
        <div className="flex h-[calc(100vh-5rem)] p-4 gap-6 bg-slate-50/50">
            {/* CENTER COLUMN: THE WORKSPACE */}
            <div className="flex-1 overflow-y-auto pr-2">
                {contentSlot}
            </div>

            {/* RIGHT COLUMN: THE QUEUE SIDEBAR */}
            {sidebarSlot}
        </div>
    );
}
