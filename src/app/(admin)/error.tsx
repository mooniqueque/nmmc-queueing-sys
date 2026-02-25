"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { forceLogoutAction } from "../actions/auth-actions";

export default function AdminErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard Route Error caught by Error Boundary:", error);
    }, [error]);

    const isSessionError = error.message.includes("Failed to get session") || error.message.includes("401");

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-8 text-center bg-transparent">
            <h2 className="text-2xl font-bold text-slate-800">
                {isSessionError ? "Session Expired" : "Something went wrong"}
            </h2>
            <p className="text-slate-600 max-w-md">
                {isSessionError
                    ? "Your session has unexpectedly expired or been revoked from the system. Please log in again to continue."
                    : error.message}
            </p>
            <div className="flex gap-4 mt-4">
                {isSessionError ? (
                    <Button onClick={() => forceLogoutAction()} className="bg-emerald-600 hover:bg-emerald-700">
                        Return to Login
                    </Button>
                ) : (
                    <Button onClick={() => reset()} variant="outline">
                        Try Again
                    </Button>
                )}
            </div>
        </div>
    );
}
