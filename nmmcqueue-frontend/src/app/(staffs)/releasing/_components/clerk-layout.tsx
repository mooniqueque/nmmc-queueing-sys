"use client";

import { ReactNode } from "react";

interface ClerkLayoutProps {
    sidebarSlot: ReactNode;
    contentSlot: ReactNode;
}

export function ClerkLayout({ sidebarSlot, contentSlot }: ClerkLayoutProps) {
    return (
        <div className="flex flex-col lg:flex-row h-full w-full p-6 gap-6 bg-slate-50/50 overflow-hidden">
            {/* CENTER COLUMN: THE WORKSPACE (scrolls independently) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {contentSlot}
            </div>

            {/* RIGHT COLUMN: THE QUEUE SIDEBAR (fixed in place, scrolls its own content) */}
            <div className="shrink-0 min-h-0 flex flex-col">
                {sidebarSlot}
            </div>
        </div>
    );
}
