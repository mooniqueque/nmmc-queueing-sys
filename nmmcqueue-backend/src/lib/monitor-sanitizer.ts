type MonitorWindowLike = {
    stationNo?: number | null;
    windowName?: string | null;
    triageTicket?: string | null;
    serviceTicket?: string | null;
    displayTicket?: string | null;
    calledAt?: string | Date | null;
};

type MonitorSnapshotLike = {
    active?: MonitorWindowLike[];
    upcoming?: string[];
};

function toIsoString(value: string | Date | null | undefined) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function sanitizeMonitorWindow(window: MonitorWindowLike | null | undefined) {
    if (!window) return null;

    return {
        stationNo: typeof window.stationNo === 'number' ? window.stationNo : 0,
        windowName: typeof window.windowName === 'string' ? window.windowName : '',
        triageTicket: typeof window.triageTicket === 'string' ? window.triageTicket : null,
        serviceTicket: typeof window.serviceTicket === 'string' ? window.serviceTicket : null,
        displayTicket: typeof window.displayTicket === 'string'
            ? window.displayTicket
            : (typeof window.serviceTicket === 'string' ? window.serviceTicket : (typeof window.triageTicket === 'string' ? window.triageTicket : null)),
        calledAt: toIsoString(window.calledAt),
    };
}

export function sanitizeMonitorSnapshot(snapshot?: MonitorSnapshotLike | null) {
    if (!snapshot) {
        return { active: [], upcoming: [] as string[] };
    }

    return {
        active: (snapshot.active ?? [])
            .map((window) => sanitizeMonitorWindow(window))
            .filter((window): window is NonNullable<ReturnType<typeof sanitizeMonitorWindow>> => Boolean(window)),
        upcoming: (snapshot.upcoming ?? []).filter((ticket): ticket is string => typeof ticket === 'string'),
    };
}

export function sanitizePublicMonitorPayload(type: string, payload: unknown) {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    if (type === 'monitor-upsert') {
        const window = sanitizeMonitorWindow((payload as { window?: MonitorWindowLike }).window);
        return window ? { window } : { window: null };
    }

    if (type === 'monitor-remove') {
        const stationNo = (payload as { stationNo?: unknown }).stationNo;
        return { stationNo: typeof stationNo === 'number' ? stationNo : null };
    }

    if (type === 'monitor-upcoming') {
        return {
            upcoming: ((payload as { upcoming?: unknown[] }).upcoming ?? []).filter(
                (ticket): ticket is string => typeof ticket === 'string'
            ),
        };
    }

    if (type === 'monitor-snapshot') {
        return sanitizeMonitorSnapshot(payload as MonitorSnapshotLike);
    }

    return payload;
}
