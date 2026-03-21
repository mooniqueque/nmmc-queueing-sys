"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { APP_ALERT_EVENT, AppAlertPayload } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

type AlertItem = AppAlertPayload & {
    id: string;
};

const MAX_ALERTS = 4;
const DEFAULT_DURATION = 5000;

function getAlertTitle(level: AppAlertPayload["level"]) {
    if (level === "success") return "Success";
    if (level === "error") return "Error";
    return "Notice";
}

function getAlertStyle(level: AppAlertPayload["level"]) {
    if (level === "success") {
        return {
            variant: "default" as const,
            className: "border-emerald-300 bg-emerald-50 text-emerald-950 [&_p]:text-emerald-900",
            Icon: CheckCircle,
        };
    }

    if (level === "error") {
        return {
            variant: "destructive" as const,
            className: "border-destructive/40 bg-destructive/10",
            Icon: WarningCircle,
        };
    }

    return {
        variant: "default" as const,
        className: "border-sky-300 bg-sky-50 text-sky-950 [&_p]:text-sky-900",
        Icon: Info,
    };
}

export function AppAlertProvider({ children }: { children: ReactNode }) {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const timersRef = useRef<Record<string, number>>({});

    const dismissAlert = useCallback((id: string) => {
        const timerId = timersRef.current[id];
        if (timerId) {
            window.clearTimeout(timerId);
            delete timersRef.current[id];
        }
        setAlerts((current) => current.filter((item) => item.id !== id));
    }, []);

    useEffect(() => {
        const handleAlert = (event: Event) => {
            const customEvent = event as CustomEvent<AppAlertPayload>;
            const payload = customEvent.detail;
            if (!payload?.message) return;

            const id =
                typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            const nextAlert: AlertItem = {
                id,
                level: payload.level,
                message: payload.message,
                title: payload.title,
                duration: payload.duration,
            };

            setAlerts((current) => [nextAlert, ...current].slice(0, MAX_ALERTS));

            const timeout = window.setTimeout(
                () => dismissAlert(id),
                payload.duration && payload.duration > 0 ? payload.duration : DEFAULT_DURATION
            );
            timersRef.current[id] = timeout;
        };

        window.addEventListener(APP_ALERT_EVENT, handleAlert as EventListener);
        return () => {
            window.removeEventListener(APP_ALERT_EVENT, handleAlert as EventListener);
            Object.values(timersRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
            timersRef.current = {};
        };
    }, [dismissAlert]);

    return (
        <>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(100vw-2rem,28rem)] flex-col gap-3">
                {alerts.map((alert) => {
                    const { Icon, className, variant } = getAlertStyle(alert.level);

                    return (
                        <Alert
                            key={alert.id}
                            variant={variant}
                            className={cn(
                                "pointer-events-auto shadow-lg animate-in slide-in-from-top-2 fade-in duration-300",
                                className
                            )}
                        >
                            <Icon weight="fill" className="mt-0.5" />
                            <AlertTitle>{alert.title || getAlertTitle(alert.level)}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                            <button
                                type="button"
                                onClick={() => dismissAlert(alert.id)}
                                className="absolute right-2 top-2 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
                                aria-label="Dismiss alert"
                            >
                                <X size={14} weight="bold" />
                            </button>
                        </Alert>
                    );
                })}
            </div>
        </>
    );
}
