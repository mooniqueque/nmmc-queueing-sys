import type { DepartmentStatus } from './enums.js';

export const SseEventType = {
    CONNECTED: 'connected',
    VISIT_UPSERT: 'visit-upsert',
    VISIT_REMOVE: 'visit-remove',
    QUEUE_INVALIDATED: 'queue-invalidated',
    DEPARTMENT_STATUS_UPDATED: 'department-status-updated',
    MONITOR_SNAPSHOT: 'monitor-snapshot',
    MONITOR_UPSERT: 'monitor-upsert',
    MONITOR_REMOVE: 'monitor-remove',
    MONITOR_UPCOMING: 'monitor-upcoming',
} as const;
export type SseEventType = (typeof SseEventType)[keyof typeof SseEventType];

export interface SseEnvelope<T = unknown> {
    type: SseEventType;
    topic: string;
    payload?: T;
    timestamp: string;
}

export interface DepartmentStatusUpdatedPayload {
    departmentId: string;
    status: DepartmentStatus;
}
