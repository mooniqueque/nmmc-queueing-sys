import { Visit } from "@/shared/types/models";

export const SSE_TOPICS = {
    TRIAGE: "triage",
    WINDOW: "window",
    MONITOR_WINDOWS: "monitor:windows",
    department: (alias: string) => `department:${alias.trim().toUpperCase()}`,
    monitorDepartment: (alias: string) => `monitor:department:${alias.trim().toUpperCase()}`,
} as const;

export interface SseMessage<T = unknown> {
    type: string;
    topic: string;
    payload?: T;
    timestamp: string;
}

export function upsertVisitById<T extends Visit>(items: T[], nextVisit: T): T[] {
    const index = items.findIndex((item) => item.id === nextVisit.id);
    if (index === -1) {
        return [nextVisit, ...items];
    }

    const cloned = [...items];
    cloned[index] = nextVisit;
    return cloned;
}

export function removeVisitById<T extends Visit>(items: T[], visitId: string): T[] {
    return items.filter((item) => item.id !== visitId);
}
