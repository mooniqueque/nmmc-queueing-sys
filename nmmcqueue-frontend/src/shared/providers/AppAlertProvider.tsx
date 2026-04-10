"use client";

import { APP_ALERT_EVENT, AppAlertPayload } from "@/shared/lib/notify";
import { ReactNode, useEffect } from "react";
import { toast, Toaster } from "sonner";

const DEFAULT_DURATION = 5000;

function getToastClass(level: AppAlertPayload["level"]) {
    const base = "rounded-xl border px-4 py-3 shadow-lg";

    if (level === "success") {
        return `${base} border-primary/30 bg-primary/10 text-primary`;
    }

    if (level === "error") {
        return `${base} border-destructive/35 bg-destructive/10 text-destructive`;
    }

    return `${base} border-border/70 bg-muted/35 text-card-foreground`;
}

export function AppAlertProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        const handleAlert = (event: Event) => {
            const customEvent = event as CustomEvent<AppAlertPayload>;
            const payload = customEvent.detail;
            if (!payload?.message) return;

            const title = payload.title?.trim() || payload.message;
            const description = payload.title?.trim() ? payload.message : undefined;
            const duration = payload.duration && payload.duration > 0 ? payload.duration : DEFAULT_DURATION;
            const className = getToastClass(payload.level);
            const descriptionClassName = payload.level === "error"
                ? "text-xs text-destructive/90"
                : payload.level === "success"
                    ? "text-xs text-primary/90"
                    : "text-xs text-muted-foreground";

            if (payload.level === "success") {
                toast.success(title, { description, duration, className, descriptionClassName });
                return;
            }
            if (payload.level === "error") {
                toast.error(title, { description, duration, className, descriptionClassName });
                return;
            }
            toast.info(title, { description, duration, className, descriptionClassName });
        };

        window.addEventListener(APP_ALERT_EVENT, handleAlert as EventListener);
        return () => {
            window.removeEventListener(APP_ALERT_EVENT, handleAlert as EventListener);
        };
    }, []);

    return (
        <>
            {children}
            <Toaster
                position="top-right"
                closeButton
                richColors={false}
                toastOptions={{
                    classNames: {
                        title: "text-sm font-semibold tracking-tight",
                        closeButton:
                            "!border-border !bg-background !text-muted-foreground hover:!bg-muted hover:!text-foreground",
                    },
                }}
            />
        </>
    );
}
