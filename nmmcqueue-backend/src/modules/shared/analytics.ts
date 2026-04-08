import { db } from '../../config/database.js';

export type AnalyticsScope = 'triage' | 'window' | 'clinic' | 'all';

interface AnalyticsQuery {
    scope: AnalyticsScope;
    departmentId?: string;
    fromDate?: string;
    toDate?: string;
    userId?: string;
}

function averageMinutes(values: number[]) {
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

// Status sets per scope
const SCOPE_STATUSES: Record<AnalyticsScope, string[]> = {
    triage: ['WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW'],
    window: ['WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW'],
    clinic: ['WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW'],
    all: [],
};

// Which statuses mean "currently waiting" per scope
const WAITING_STATUSES: Record<AnalyticsScope, string[]> = {
    triage: ['WAITING_TRIAGE'],
    window: ['WAITING_WINDOW'],
    clinic: ['WAITING_CLINIC'],
    all: ['WAITING_TRIAGE', 'WAITING_WINDOW', 'WAITING_CLINIC'],
};

function getDateBounds(fromDate?: string, toDate?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : today;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : tomorrow;
    return { from, to };
}

export async function getAnalytics(query: AnalyticsQuery) {
    const { scope, departmentId, fromDate, toDate, userId } = query;
    const { from, to } = getDateBounds(fromDate, toDate);

    // Build where clause
    const where: any = {
        createdAt: { gte: from, lt: to },
    };

    const scopeStatuses = SCOPE_STATUSES[scope];
    if (scopeStatuses.length > 0) {
        where.status = { in: scopeStatuses };
    }

    if (departmentId && departmentId !== 'ALL') {
        where.departmentId = departmentId;
    }

    // For staff history: filter by the user who processed
    if (userId) {
        if (scope === 'triage') where.triagedByUserId = userId;
        else if (scope === 'window') where.windowClaimedById = userId;
        else if (scope === 'clinic') where.calledByUserId = userId;
    }

    // Fetch all matching visits with minimal includes
    const visits = await db.visit.findMany({
        where,
        include: {
            patient: { select: { firstName: true, lastName: true } },
            department: { select: { name: true, code: true } },
            categories: { include: { category: { select: { name: true, code: true, isPriority: true } } } },
            windowClaimedBy: { select: { name: true } },
            triagedByUser: { select: { name: true } },
            calledByUser: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // ─── KPIs ──────────────
    const waitingStatuses = WAITING_STATUSES[scope];
    const totalToday = visits.length;
    const currentlyWaiting = visits.filter(v => waitingStatuses.includes(v.status)).length;
    const completedToday = visits.filter(v => v.status === 'COMPLETED').length;
    const noShowCount = visits.filter(v => v.status === 'NO_SHOW').length;

    // Avg processing time
    const processingDurations = visits
        .filter(v => v.status === 'COMPLETED' && v.updatedAt && v.createdAt)
        .map(v => (new Date(v.updatedAt).getTime() - new Date(v.createdAt).getTime()) / 60000)
        .filter(d => d >= 0 && d < 1440); // sanity: < 24h

    const avgProcessingMinutes = processingDurations.length > 0
        ? averageMinutes(processingDurations)
        : 0;

    const kioskToWindowDurations = visits
        .filter(v => v.triageStartedAt && v.windowStartedAt)
        .map(v => (new Date(v.windowStartedAt!).getTime() - new Date(v.triageStartedAt!).getTime()) / 60000)
        .filter(d => d >= 0 && d < 1440);

    const windowToClinicDurations = visits
        .filter(v => v.windowStartedAt && v.calledAt)
        .map(v => (new Date(v.calledAt!).getTime() - new Date(v.windowStartedAt!).getTime()) / 60000)
        .filter(d => d >= 0 && d < 1440);

    // ─── Hourly Volume ──────────────
    const hourCounts = new Map<number, number>();
    for (let h = 0; h < 24; h++) hourCounts.set(h, 0);
    for (const v of visits) {
        const h = new Date(v.createdAt).getHours();
        hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
    }
    const hourlyVolume = Array.from(hourCounts.entries()).map(([hour, count]) => ({
        hour: hour.toString().padStart(2, '0'),
        patients: count,
    }));

    // Peak hour
    const peakEntry = hourlyVolume.reduce((best, cur) =>
        cur.patients > best.patients ? cur : best, { hour: '--', patients: 0 });
    const peakHourLabel = peakEntry.patients > 0 ? `${peakEntry.hour}:00` : '—';

    // ─── Classification Breakdown ──────────────
    const classMap = new Map<string, number>();
    for (const v of visits) {
        const cls = v.classification || 'REGULAR';
        classMap.set(cls, (classMap.get(cls) ?? 0) + 1);
    }
    const classificationBreakdown = Array.from(classMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // ─── Department Breakdown ──────────────
    const deptMap = new Map<string, number>();
    for (const v of visits) {
        const deptName = v.department?.name ?? 'UNASSIGNED';
        deptMap.set(deptName, (deptMap.get(deptName) ?? 0) + 1);
    }
    const departmentBreakdown = Array.from(deptMap.entries())
        .map(([department, patients]) => ({ department, patients }))
        .sort((a, b) => b.patients - a.patients);

    // ─── Staff Breakdown ──────────────
    const staffMap = new Map<string, number>();
    for (const v of (visits as any)) {
        let staffName = 'UNASSIGNED';
        if (scope === 'window') staffName = v.windowClaimedBy?.name || 'UNASSIGNED';
        else if (scope === 'triage') staffName = v.triagedByUser?.name || 'UNASSIGNED';
        else if (scope === 'clinic') staffName = v.calledByUser?.name || 'UNASSIGNED';

        staffMap.set(staffName, (staffMap.get(staffName) ?? 0) + 1);
    }
    const staffBreakdown = Array.from(staffMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // ─── Status Distribution ──────────────
    const statusMap = new Map<string, number>();
    for (const v of visits) {
        statusMap.set(v.status, (statusMap.get(v.status) ?? 0) + 1);
    }
    const statusDistribution = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

    // ─── Recent History (last 50) ──────────────
    const recentHistory = visits.slice(0, 50).map(v => ({
        id: v.id,
        triageTicket: v.triageTicket ?? null,
        serviceTicket: v.serviceTicket ?? null,
        patientName: `${v.patient.lastName}, ${v.patient.firstName}`,
        status: v.status,
        timestamp: v.updatedAt.toISOString(),
        classification: v.classification,
        department: v.department?.name ?? 'UNASSIGNED',
    }));

    return {
        kpis: {
            totalToday,
            currentlyWaiting,
            avgProcessingMinutes,
            completedToday,
            noShowCount,
            peakHourLabel,
            avgKioskToWindowMinutes: averageMinutes(kioskToWindowDurations),
            avgWindowToClinicMinutes: averageMinutes(windowToClinicDurations),
        },
        hourlyVolume,
        classificationBreakdown,
        departmentBreakdown,
        staffBreakdown,
        statusDistribution,
        recentHistory,
        generatedAt: new Date().toISOString(),
    };
}
