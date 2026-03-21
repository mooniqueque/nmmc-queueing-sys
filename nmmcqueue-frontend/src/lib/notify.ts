export const APP_ALERT_EVENT = "nmmc-app-alert";

export type AppAlertLevel = "success" | "error" | "info";

export type AppAlertOptions = {
    title?: string;
    description?: string;
    duration?: number;
};

export type AppAlertPayload = {
    level: AppAlertLevel;
    message: string;
    title?: string;
    duration?: number;
};

function normalizeText(value: string | undefined): string {
    return (value ?? "").trim();
}

function buildPayload(level: AppAlertLevel, message: string, options?: AppAlertOptions): AppAlertPayload {
    const normalizedMessage = normalizeText(message);
    const normalizedDescription = normalizeText(options?.description);
    const normalizedTitle = normalizeText(options?.title);

    if (normalizedDescription) {
        return {
            level,
            title: normalizedTitle || normalizedMessage,
            message: normalizedDescription,
            duration: options?.duration,
        };
    }

    return {
        level,
        title: normalizedTitle || undefined,
        message: normalizedMessage,
        duration: options?.duration,
    };
}

function emitAlert(payload: AppAlertPayload) {
    if (typeof window === "undefined") return;
    if (!payload.message) return;

    window.dispatchEvent(
        new CustomEvent<AppAlertPayload>(APP_ALERT_EVENT, {
            detail: payload,
        })
    );
}

function notifyWithLevel(level: AppAlertLevel, message: string, options?: AppAlertOptions) {
    emitAlert(buildPayload(level, message, options));
}

export const notify = {
    success: (message: string, options?: AppAlertOptions) => notifyWithLevel("success", message, options),
    error: (message: string, options?: AppAlertOptions) => notifyWithLevel("error", message, options),
    info: (message: string, options?: AppAlertOptions) => notifyWithLevel("info", message, options),
};
