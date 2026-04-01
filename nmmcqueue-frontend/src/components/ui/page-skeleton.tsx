"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";

/**
 * COMPONENT: LoadingSpinner
 * A unified loading indicator used across the application for data fetching states.
 * Replaces the structural skeletons for a cleaner, consistent experience.
 */
export function LoadingSpinner({ 
  className,
  label = "Syncing data...",
  fullPage = true 
}: { 
  className?: string; 
  label?: string; 
  fullPage?: boolean 
}) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-3 transition-opacity duration-300 animate-in fade-in",
            fullPage ? "min-h-[60vh] w-full" : "py-10",
            className
        )}>
            <div className="relative flex items-center justify-center">
                {/* Outer decorative ring */}
                <div className="absolute inset-0 size-12 rounded-full border-4 border-emerald-50 opacity-20" />
                
                {/* Spinning Notch */}
                <CircleNotch 
                    size={40} 
                    weight="bold" 
                    className="text-emerald-600 animate-spin" 
                />
            </div>
            
            {label && (
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] animate-pulse">
                    {label}
                </p>
            )}
        </div>
    );
}

// Deprecated Structural Skeletons - Now aliasing the LoadingSpinner for consistency
// These will be removed once all references are updated to <LoadingSpinner />
export function PageSkeleton({ header }: { lines?: number; header?: string }) {
    return (
        <div className="p-6 max-w-7xl mx-auto mt-4">
            {header && <div className="h-8 w-64 bg-emerald-50 rounded-md mb-6" />}
            <LoadingSpinner fullPage={false} label={`Loading ${header || 'content'}...`} />
        </div>
    );
}

export function DashboardSkeleton() {
    return <LoadingSpinner fullPage={true} label="Initializing Dashboard..." />;
}

export function FullPageSkeleton() {
    return <LoadingSpinner fullPage={true} />;
}
