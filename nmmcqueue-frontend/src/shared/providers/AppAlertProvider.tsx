"use client";

import { APP_ALERT_EVENT, AppAlertPayload } from "@/shared/lib/notify";
import { ReactNode, useEffect } from "react";
import { toast, Toaster } from "sonner";

const DEFAULT_DURATION = 5000;

export function AppAlertProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        const handleAlert = (event: Event) => {
            const customEvent = event as CustomEvent<AppAlertPayload>;
            const payload = customEvent.detail;
            if (!payload?.message) return;

            const title = payload.title?.trim() || payload.message;
            const description = payload.title?.trim() ? payload.message : undefined;
            const duration = payload.duration && payload.duration > 0 ? payload.duration : DEFAULT_DURATION;

            if (payload.level === "success") {
                toast.success(title, { description, duration });
                return;
            }
            if (payload.level === "error") {
                toast.error(title, { description, duration });
                return;
            }
            toast.info(title, { description, duration });
        };

        window.addEventListener(APP_ALERT_EVENT, handleAlert as EventListener);
        return () => {
            window.removeEventListener(APP_ALERT_EVENT, handleAlert as EventListener);
        };
    }, []);

    return (
        <>
            {children}
            <Toaster richColors position="top-right" closeButton />
        </>
    );
}
