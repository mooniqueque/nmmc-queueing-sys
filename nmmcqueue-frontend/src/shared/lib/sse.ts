import type { DepartmentStatus, SseEnvelope, SseEventType as SharedSseEventType } from "@nmmc/types";
import { Visit } from "@/shared/types/models";

export const SSE_TOPICS = {
    TRIAGE: "triage",
    WINDOW: "window",
    MONITOR_WINDOWS: "monitor:windows",
    department: (alias: string) => `department:${alias.trim().toUpperCase()}`,
    monitorDepartment: (alias: string) => `monitor:department:${alias.trim().toUpperCase()}`,
} as const;

export type SseMessage<T = unknown> = SseEnvelope<T>;

export interface DepartmentStatusUpdatedPayload {
    departmentId: string;
    status: DepartmentStatus;
}

export const SseEventType = {
    CONNECTED: "connected",
    VISIT_UPSERT: "visit-upsert",
    VISIT_REMOVE: "visit-remove",
    QUEUE_INVALIDATED: "queue-invalidated",
    DEPARTMENT_STATUS_UPDATED: "department-status-updated",
    MONITOR_SNAPSHOT: "monitor-snapshot",
    MONITOR_UPSERT: "monitor-upsert",
    MONITOR_REMOVE: "monitor-remove",
    MONITOR_UPCOMING: "monitor-upcoming",
} as const satisfies Record<SharedSseEventType, SharedSseEventType>;
export type SseEventType = SharedSseEventType;

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
