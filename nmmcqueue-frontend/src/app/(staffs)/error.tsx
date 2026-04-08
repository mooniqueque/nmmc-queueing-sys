"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Staff route error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
                The staff workspace could not load right now. Please try again.
            </p>
            <Button onClick={() => reset()} variant="outline">
                Try Again
            </Button>
        </div>
    );
}
