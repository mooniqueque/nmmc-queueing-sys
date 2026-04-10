import { Prisma } from '@prisma/client';
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

    // Build where clause for standard Prisma queries
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

    // ─── Parallel Database Aggregations ──────────────────────────
    const waitingStatuses = WAITING_STATUSES[scope];
    const departmentFilterSql = departmentId && departmentId !== 'ALL'
        ? Prisma.sql`AND departmentId = ${departmentId}`
        : Prisma.empty;
    const statusFilterSql = scopeStatuses.length > 0
        ? Prisma.sql`AND status IN (${Prisma.join(scopeStatuses)})`
        : Prisma.empty;

    const [
        totalToday,
        currentlyWaiting,
        completedToday,
        noShowCount,
        statusGrouped,
        classGrouped,
        deptGrouped,
        deptClassGrouped,
        staffGrouped,
        recentHistory,
        durations,
        hourlyGrouped
    ] = await Promise.all([
        // KPI Counters
        db.visit.count({ where }),
        db.visit.count({ where: { ...where, status: { in: waitingStatuses } } }),
        db.visit.count({ where: { ...where, status: 'COMPLETED' } }),
        db.visit.count({ where: { ...where, status: 'NO_SHOW' } }),

        // Distributions (GroupBy)
        db.visit.groupBy({
            by: ['status'],
            _count: { _all: true },
            where,
        }),
        db.visit.groupBy({
            by: ['classification'],
            _count: { _all: true },
            where,
        }),
        db.visit.groupBy({
            by: ['departmentId'],
            where,
            _count: { _all: true },
        }),
        db.visit.groupBy({
            by: ['departmentId', 'classification'],
            where,
            _count: { _all: true },
        }),
        // Staff grouping depends on scope
        scope === 'all' 
            ? Promise.resolve([]) 
            : db.visit.groupBy({
                by: [
                    scope === 'triage' ? 'triagedByUserId' : 
                    scope === 'window' ? 'windowClaimedById' : 'calledByUserId'
                ] as any,
                where: {
                    ...where,
                    [scope === 'triage' ? 'triagedByUserId' : 
                     scope === 'window' ? 'windowClaimedById' : 'calledByUserId']: { not: null }
                },
                _count: { _all: true },
              }),

        // Recent History (Still fine as findMany but limited)
        db.visit.findMany({
            where,
            include: {
                patient: { select: { firstName: true, lastName: true } },
                department: { select: { name: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 50,
        }),

        // ─── Direct SQL for Durations (Prisma aggregate doesn't support date diff avg) ───
        db.$queryRaw<any[]>`
            SELECT 
                AVG(TIMESTAMPDIFF(SECOND, createdAt, updatedAt)) / 60 as avgProcessing,
                AVG(TIMESTAMPDIFF(SECOND, triageStartedAt, windowStartedAt)) / 60 as avgKioskToWindow,
                AVG(TIMESTAMPDIFF(SECOND, windowStartedAt, calledAt)) / 60 as avgWindowToClinic
            FROM visit
            WHERE createdAt >= ${from} AND createdAt < ${to}
            ${departmentFilterSql}
            ${statusFilterSql}
        `.catch(() => [{ avgProcessing: 0, avgKioskToWindow: 0, avgWindowToClinic: 0 }]),

        // ─── Direct SQL for Hourly Volume ───
        db.$queryRaw<any[]>`
            SELECT HOUR(createdAt) as hour, COUNT(*) as count
            FROM visit
            WHERE createdAt >= ${from} AND createdAt < ${to}
            ${departmentFilterSql}
            GROUP BY HOUR(createdAt)
            ORDER BY hour ASC
        `.catch(() => [])
    ]);

    // ─── Post-Processing ──────────────────────────────────────────

    // 1. Durations
    const stats = durations[0] || {};
    const avgProcessingMinutes = Math.round((Number(stats.avgProcessing) || 0) * 10) / 10;
    const avgKioskToWindowMinutes = Math.round((Number(stats.avgKioskToWindow) || 0) * 10) / 10;
    const avgWindowToClinicMinutes = Math.round((Number(stats.avgWindowToClinic) || 0) * 10) / 10;

    // 2. Map Status/Class Distributions
    const statusDistribution = statusGrouped.map(g => ({
        status: g.status,
        count: g._count._all
    })).sort((a, b) => b.count - a.count);

    const classificationBreakdown = classGrouped.map(g => ({
        name: g.classification || 'REGULAR',
        count: g._count._all
    })).sort((a, b) => b.count - a.count);

    // 3. Hourly Volume
    const hourCounts = new Map<number, number>();
    for (let h = 0; h < 24; h++) hourCounts.set(h, 0);
    for (const hg of hourlyGrouped) {
        hourCounts.set(Number(hg.hour), Number(hg.count));
    }
    const hourlyVolume = Array.from(hourCounts.entries()).map(([hour, count]) => ({
        hour: hour.toString().padStart(2, '0'),
        patients: count,
    }));

    const peakEntry = hourlyVolume.reduce((best, cur) =>
        cur.patients > best.patients ? cur : best, { hour: '--', patients: 0 });
    const peakHourLabel = peakEntry.patients > 0 ? `${peakEntry.hour}:00` : '—';

    // 4. Department Breakdown (Need names)
    const departments = await db.department.findMany({
        where: { id: { in: deptGrouped.map(d => d.departmentId).filter(Boolean) as string[] } },
        select: { id: true, name: true }
    });
    const departmentBreakdown = deptGrouped.map(g => {
        const d = departments.find(dept => dept.id === g.departmentId);
        return { department: d?.name || 'UNASSIGNED', patients: g._count._all };
    }).sort((a, b) => b.patients - a.patients);

    const departmentPriorityBreakdown = deptClassGrouped.map(g => {
        const d = departments.find(dept => dept.id === g.departmentId);
        return {
            departmentId: g.departmentId || null,
            department: d?.name || 'UNASSIGNED',
            classification: g.classification || 'REGULAR',
            patients: g._count._all,
        };
    }).sort((a, b) => {
        if (a.department === b.department) {
            return a.classification.localeCompare(b.classification);
        }
        return a.department.localeCompare(b.department);
    });

    // 5. Staff Breakdown (Need names)
    const staffIds = staffGrouped.map((g: any) => 
        g.triagedByUserId || g.windowClaimedById || g.calledByUserId
    ).filter(Boolean);
    const users = staffIds.length > 0 
        ? await db.user.findMany({
            where: { id: { in: staffIds } },
            select: { id: true, name: true }
          })
        : [];
    
    const staffBreakdown = staffGrouped.map((g: any) => {
        const id = g.triagedByUserId || g.windowClaimedById || g.calledByUserId;
        const u = users.find(user => user.id === id);
        return { name: u?.name || 'UNASSIGNED', count: g._count._all };
    }).sort((a, b) => b.count - a.count);

    return {
        kpis: {
            totalToday,
            currentlyWaiting,
            avgProcessingMinutes,
            completedToday,
            noShowCount,
            peakHourLabel,
            avgKioskToWindowMinutes,
            avgWindowToClinicMinutes,
        },
        hourlyVolume,
        classificationBreakdown,
        departmentPriorityBreakdown,
        departmentBreakdown,
        staffBreakdown,
        statusDistribution,
        recentHistory,
        generatedAt: new Date().toISOString(),
    };
}
