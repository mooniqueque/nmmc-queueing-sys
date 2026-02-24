"use client";

import { ReactNode } from "react";

interface TriageLayoutProps {
    sidebarSlot: ReactNode;
    contentSlot: ReactNode;
}

export function TriageLayout({ sidebarSlot, contentSlot }: TriageLayoutProps) {
    return (
        <div className="flex h-[calc(100vh-2rem)] p-4 gap-6 bg-slate-50/50">
            {/* CENTER COLUMN: THE TRIAGE WORKSPACE */}
            <div className="flex-1 overflow-y-auto pr-2">
                {contentSlot}
            </div>

            {/* RIGHT COLUMN: THE QUEUE SIDEBAR */}
            {sidebarSlot}
        </div>
    );
}
