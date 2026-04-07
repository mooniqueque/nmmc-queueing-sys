import { db } from '../../config/database.js';
import { AppError } from '../../middleware/error-handler.js';

type SnapshotUser = {
    id: string;
    role: string;
};

type DepartmentCount = {
    departmentId: string | null;
    departmentName: string;
    count: number;
};

type StationCount = {
    stationNo: number;
    count: number;
};

const BUSINESS_DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function roundMinutes(value: number) {
    return Math.round(value * 10) / 10;
}

function averageMinutes(values: number[]) {
    if (values.length === 0) return 0;
    return roundMinutes(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function minutesBetween(start?: Date | null, end?: Date | null) {
    if (!start || !end) return null;
    const diff = (end.getTime() - start.getTime()) / 60000;
    if (diff < 0 || diff > 1440) return null;
    return diff;
}

function ensureValidBusinessDay(date?: string) {
    if (!date || !BUSINESS_DAY_REGEX.test(date)) {
        throw new AppError('A valid date in YYYY-MM-DD format is required.', 400, 'INVALID_REPORT_DATE');
    }

    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());

    if (date > today) {
        throw new AppError('Future report dates are not allowed.', 400, 'INVALID_REPORT_DATE');
    }

    return date;
}

async function resolveClinicDepartmentScope(user: SnapshotUser, requestedDepartmentId?: string) {
    if (user.role === 'ADMIN') {
        if (!requestedDepartmentId) {
            throw new AppError('departmentId is required for admin clinic reports.', 400, 'DEPARTMENT_REQUIRED');
        }
        return requestedDepartmentId;
    }

    const caller = await db.user.findUnique({
        where: { id: user.id },
        select: {
            departmentId: true,
            department: true,
            workstation: {
                select: {
                    departmentId: true,
                }
            }
        }
    });

    if (!caller) {
        throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    let departmentId = caller.departmentId ?? caller.workstation?.departmentId ?? null;

    if (!departmentId && caller.department) {
        const department = await db.department.findFirst({
            where: { name: caller.department.trim().toUpperCase() },
            select: { id: true },
        });
        departmentId = department?.id ?? null;
    }

    if (!departmentId) {
        throw new AppError('Caller account has no assigned department.', 400, 'CALLER_ASSIGNMENT_REQUIRED');
    }

    if (requestedDepartmentId && requestedDepartmentId !== departmentId) {
        throw new AppError(
            'You are not allowed to view analytics outside your assigned department.',
            403,
            'CLAIM_FORBIDDEN_SCOPE'
        );
    }

    return departmentId;
}

export async function getTriageSnapshot(date?: string) {
    const queueBusinessDay = ensureValidBusinessDay(date);
    const visits = await db.visit.findMany({
        where: { queueBusinessDay },
        select: {
            id: true,
            triageTicket: true,
            classification: true,
            status: true,
            departmentId: true,
            department: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                }
            },
            windowStartedAt: true,
        },
    });

    const triagedVisits = visits.filter((visit) => visit.triageTicket !== null);
    const departmentMap = new Map<string, DepartmentCount>();

    for (const visit of triagedVisits) {
        const departmentId = visit.departmentId ?? null;
        const key = departmentId ?? 'UNASSIGNED';
        const current = departmentMap.get(key) ?? {
            departmentId,
            departmentName: visit.department?.name ?? 'UNASSIGNED',
            count: 0,
        };
        current.count += 1;
        departmentMap.set(key, current);
    }

    const abandonedBeforeWindow = visits.filter((visit) =>
        visit.status === 'NO_SHOW' && visit.windowStartedAt === null
    ).length;

    return {
        date: queueBusinessDay,
        totals: {
            totalTicketsGenerated: triagedVisits.length,
            priorityCount: triagedVisits.filter((visit) => visit.classification === 'PRIORITY').length,
            regularCount: triagedVisits.filter((visit) => visit.classification === 'REGULAR').length,
            abandonedBeforeWindow,
        },
        ticketsPerDepartment: Array.from(departmentMap.values()).sort((a, b) => b.count - a.count),
        generatedAt: new Date().toISOString(),
    };
}

export async function getWindowSnapshot(date?: string) {
    const queueBusinessDay = ensureValidBusinessDay(date);
    const visits = await db.visit.findMany({
        where: { queueBusinessDay },
        select: {
            id: true,
            serviceTicket: true,
            status: true,
            windowNumber: true,
            windowStartedAt: true,
            updatedAt: true,
        },
    });

    const windowStarted = visits.filter((visit) => visit.windowStartedAt !== null);
    const finishedWindowStatuses = new Set(['WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW']);
    const processingDurations = windowStarted
        .filter((visit) => finishedWindowStatuses.has(visit.status))
        .map((visit) => minutesBetween(visit.windowStartedAt, visit.updatedAt))
        .filter((value): value is number => value !== null);

    const stationMap = new Map<number, StationCount>();
    for (const visit of windowStarted) {
        if (!visit.windowNumber) continue;
        const current = stationMap.get(visit.windowNumber) ?? { stationNo: visit.windowNumber, count: 0 };
        current.count += 1;
        stationMap.set(visit.windowNumber, current);
    }

    const noShowCount = windowStarted.filter((visit) => visit.status === 'NO_SHOW').length;

    return {
        date: queueBusinessDay,
        totals: {
            totalAssignedToClinics: visits.filter((visit) => visit.serviceTicket !== null).length,
            totalWindowCalls: windowStarted.length,
            windowNoShowCount: noShowCount,
            windowNoShowRate: windowStarted.length === 0 ? 0 : roundMinutes((noShowCount / windowStarted.length) * 100),
            avgWindowProcessingMinutes: averageMinutes(processingDurations),
        },
        processedPerStation: Array.from(stationMap.values()).sort((a, b) => a.stationNo - b.stationNo),
        generatedAt: new Date().toISOString(),
    };
}

export async function getClinicSnapshot(user: SnapshotUser, date?: string, requestedDepartmentId?: string) {
    const queueBusinessDay = ensureValidBusinessDay(date);
    const departmentId = await resolveClinicDepartmentScope(user, requestedDepartmentId);

    const visits = await db.visit.findMany({
        where: {
            queueBusinessDay,
            departmentId,
        },
        select: {
            id: true,
            status: true,
            isReferred: true,
            department: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                }
            }
        }
    });

    const visitIds = visits.map((visit) => visit.id);
    const history = visitIds.length === 0
        ? []
        : await db.visitStatusHistory.findMany({
            where: {
                visitId: { in: visitIds },
                status: { in: ['WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED'] },
            },
            select: {
                visitId: true,
                status: true,
                changedAt: true,
            },
            orderBy: {
                changedAt: 'asc',
            }
        });

    const historyByVisit = new Map<string, { waitingClinicAt?: Date; inProgressAt?: Date; completedAt?: Date }>();
    for (const entry of history) {
        const current = historyByVisit.get(entry.visitId) ?? {};
        if (entry.status === 'WAITING_CLINIC' && !current.waitingClinicAt) current.waitingClinicAt = entry.changedAt;
        if (entry.status === 'IN_PROGRESS' && !current.inProgressAt) current.inProgressAt = entry.changedAt;
        if (entry.status === 'COMPLETED' && !current.completedAt) current.completedAt = entry.changedAt;
        historyByVisit.set(entry.visitId, current);
    }

    const waitDurations = visits
        .map((visit) => {
            const entry = historyByVisit.get(visit.id);
            return minutesBetween(entry?.waitingClinicAt, entry?.inProgressAt);
        })
        .filter((value): value is number => value !== null);

    const serveDurations = visits
        .map((visit) => {
            const entry = historyByVisit.get(visit.id);
            return minutesBetween(entry?.inProgressAt, entry?.completedAt);
        })
        .filter((value): value is number => value !== null);

    return {
        date: queueBusinessDay,
        department: visits[0]?.department ?? null,
        totals: {
            totalPatientsServed: visits.filter((visit) => visit.status === 'COMPLETED').length,
            avgWaitMinutes: averageMinutes(waitDurations),
            avgServeMinutes: averageMinutes(serveDurations),
            transferCount: visits.filter((visit) => visit.isReferred).length,
            transferRate: visits.length === 0 ? 0 : roundMinutes((visits.filter((visit) => visit.isReferred).length / visits.length) * 100),
            clinicNoShowCount: visits.filter((visit) => visit.status === 'NO_SHOW').length,
        },
        generatedAt: new Date().toISOString(),
    };
}
