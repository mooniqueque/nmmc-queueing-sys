import { db } from '../../config/database.js';
import { getQueueBusinessDay } from '../../lib/queue-business-day.js';

type MonitorCallerStation = {
    id: string;
    name: string;
    stationNo: number;
    type: string;
    isActive: boolean;
    departmentId: string | null;
};

class MonitorService {
    private async getRecentCalls(departmentId?: string) {
        const queueBusinessDay = getQueueBusinessDay();

        const resolveQueueCode = (
            classification: string | null | undefined,
            categories?: Array<{ category?: { code?: string | null } | null }> | null,
        ) => {
            const explicitCode = categories
                ?.map((entry) => entry.category?.code?.trim())
                .find((code): code is string => Boolean(code));
            if (explicitCode) return explicitCode.toUpperCase();
            return classification === 'PRIORITY' ? 'PRIO' : 'REG';
        };

        const formatTicket = (
            ticketNo: number | null | undefined,
            classification: string | null | undefined,
            categories?: Array<{ category?: { code?: string | null } | null }> | null,
        ) => {
            if (!ticketNo) return null;
            const prefix = resolveQueueCode(classification, categories);
            return `${prefix}-${String(ticketNo)}`;
        };

        // Query recent calls (IN_WINDOW status) ordered by most recent first
        const recentVisits = await db.visit.findMany({
            where: {
                status: 'IN_WINDOW',
                queueBusinessDay,
                ...(departmentId && { departmentId }),
                windowNumber: { not: null },
            },
            orderBy: { calledAt: 'desc' },
            take: 5,
            select: {
                windowNumber: true,
                triageTicket: true,
                serviceTicket: true,
                classification: true,
                calledAt: true,
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        // Get workstations to map window numbers to names
        const windowsMap = new Map<number, { stationNo: number; name: string }>();
        const windows = await db.workStation.findMany({
            where: { 
                type: 'WINDOW',
                isActive: true,
                ...(departmentId && { departmentId }),
            },
        });
        windows.forEach((w) => windowsMap.set(w.stationNo, { stationNo: w.stationNo, name: w.name }));

        // Format recent calls as WindowStatus objects, deduped by window+ticket
        const seen = new Set<string>();
        const recentCalls = recentVisits
            .map((visit) => {
                if (visit.windowNumber == null) return null;
                const window = windowsMap.get(visit.windowNumber);
                if (!window) return null;

                const ticketNo = visit.triageTicket ?? visit.serviceTicket;
                const formattedTicket = formatTicket(ticketNo, visit.classification, visit.categories);
                const callKey = `${window.stationNo}:${formattedTicket}`;

                // Skip duplicate (same window+ticket already seen)
                if (seen.has(callKey)) return null;
                seen.add(callKey);

                return {
                    windowName: window.name,
                    stationNo: window.stationNo,
                    triageTicket: formattedTicket,
                    serviceTicket: formattedTicket,
                    displayTicket: formattedTicket,
                    classification: visit.classification,
                    calledAt: visit.calledAt || null,
                    categories: visit.categories.map(vc => vc.category)
                };
            })
            .filter(Boolean);

        return recentCalls;
    }

    async getWindowStatus() {
        const queueBusinessDay = getQueueBusinessDay();

        const resolveQueueCode = (
            classification: string | null | undefined,
            categories?: Array<{ category?: { code?: string | null } | null }> | null,
        ) => {
            const explicitCode = categories
                ?.map((entry) => entry.category?.code?.trim())
                .find((code): code is string => Boolean(code));
            if (explicitCode) return explicitCode.toUpperCase();
            return classification === 'PRIORITY' ? 'PRIO' : 'REG';
        };

        // Find all workstations of type WINDOW
        const windows = await db.workStation.findMany({
            where: { type: 'WINDOW', isActive: true },
            orderBy: { stationNo: 'asc' }
        });

        const activeVisits = await db.visit.findMany({
            where: {
                status: 'IN_WINDOW',
                queueBusinessDay,
                windowNumber: { not: null },
            },
            orderBy: [{ calledAt: 'desc' }],
            select: {
                windowNumber: true,
                triageTicket: true,
                serviceTicket: true,
                classification: true,
                calledAt: true,
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        const latestVisitByWindow = new Map<number, (typeof activeVisits)[number]>();
        for (const visit of activeVisits) {
            if (visit.windowNumber == null) continue;
            if (!latestVisitByWindow.has(visit.windowNumber)) {
                latestVisitByWindow.set(visit.windowNumber, visit);
            }
        }

        const formatTicket = (
            ticketNo: number | null | undefined,
            classification: string | null | undefined,
            categories?: Array<{ category?: { code?: string | null } | null }> | null,
        ) => {
            if (!ticketNo) return null;
            const prefix = resolveQueueCode(classification, categories);
            return `${prefix}-${String(ticketNo)}`;
        };

        const status = windows.map((window) => {
            const currentVisit = latestVisitByWindow.get(window.stationNo);
            const ticketNo = currentVisit?.triageTicket ?? currentVisit?.serviceTicket;
            const formattedTicket = currentVisit
                ? formatTicket(ticketNo, currentVisit.classification, currentVisit.categories)
                : null;

            return {
                windowName: window.name,
                stationNo: window.stationNo,
                triageTicket: formattedTicket,
                serviceTicket: formattedTicket,
                displayTicket: formattedTicket,
                classification: currentVisit?.classification,
                calledAt: currentVisit?.calledAt || null,
                categories: currentVisit?.categories.map(vc => vc.category)
            };
        });

        const waitlistVisits = await db.visit.findMany({
            where: {
                status: 'WAITING_WINDOW',
                queueBusinessDay
            },
            orderBy: { queueDate: 'asc' },
            take: 4,
            select: {
                triageTicket: true,
                classification: true,
                categories: {
                    include: {
                        category: true,
                    },
                },
            }
        });
        const upcoming = waitlistVisits
            .map(v => formatTicket(v.triageTicket, v.classification, v.categories) as string)
            .filter(Boolean);

        const recentCalls = await this.getRecentCalls();

        return { active: status, upcoming, recentCalls };
    }

    async getDepartmentStatus(slugOrId: string) {
        const queueBusinessDay = getQueueBusinessDay();

        const resolveQueueCode = (
            classification: string | null | undefined,
            categories?: Array<{ category?: { code?: string | null } | null }> | null,
        ) => {
            const explicitCode = categories
                ?.map((entry) => entry.category?.code?.trim())
                .find((code): code is string => Boolean(code));
            if (explicitCode) return explicitCode.toUpperCase();
            return classification === 'PRIORITY' ? 'PRIO' : 'REG';
        };

        // 1. Fetch Department Info by slug (or fallback to ID for compatibility)
        const department = await db.department.findFirst({
            where: {
                OR: [
                    { slug: slugOrId },
                    { id: slugOrId }
                ]
            },
            select: { id: true, name: true, code: true }
        });

        if (!department) return [];

        const departmentId = department.id;

        const formatTicket = (
            ticketNo: number | null | undefined,
            classification: string | null | undefined,
            categories?: Array<{ category?: { code?: string | null } | null }> | null,
        ) => {
            if (!ticketNo) return null;
            const prefix = resolveQueueCode(classification, categories);
            return `${prefix}-${String(ticketNo)}`;
        };

        const normalize = (value: string) => value.trim().toUpperCase();

        // 2. Get configured CALLER stations for this department (in order).
        const configuredStations = await db.workStation.findMany({
            where: { departmentId, type: 'CALLER', isActive: true },
            orderBy: { stationNo: 'asc' }
        });

        // Reuse existing lane options (priority categories) for lane matching.
        const laneOptions = await db.priorityCategory.findMany({
            where: { departmentId },
            select: { id: true, name: true, code: true, isPriority: true }
        });

        // 3. Get all active callers for this department.
        // We intentionally resolve the display lane from the actual claim record as a fallback,
        // because legacy data can have caller users scoped to a department while the workstation
        // itself is missing departmentId.
        const inProgressPatients = await db.visit.findMany({
            where: {
                departmentId,
                status: 'IN_PROGRESS',
                sequenceKey: `DEPT_${departmentId}`,
                queueBusinessDay
            },
            orderBy: { calledAt: 'asc' },
            select: {
                calledAtStationId: true,
                serviceTicket: true,
                classification: true, 
                calledAt: true,
                categories: { include: { category: true } },
                calledAtStation: {
                    select: {
                        id: true,
                        name: true,
                        stationNo: true,
                        type: true,
                        isActive: true,
                        departmentId: true,
                    },
                },
                calledByUser: {
                    select: {
                        id: true,
                        name: true,
                        workstation: {
                            select: {
                                id: true,
                                name: true,
                                stationNo: true,
                                type: true,
                                isActive: true,
                                departmentId: true,
                            },
                        },
                    },
                },
            }
        });

        const isUsableCallerStation = (station: MonitorCallerStation | null | undefined): station is MonitorCallerStation =>
            Boolean(station && station.type === 'CALLER' && station.isActive);

        const resolvePatientStation = (patient: (typeof inProgressPatients)[number]) => {
            if (isUsableCallerStation(patient.calledAtStation)) {
                return patient.calledAtStation;
            }

            if (isUsableCallerStation(patient.calledByUser?.workstation)) {
                return patient.calledByUser.workstation;
            }

            return null;
        };

        const fallbackStationStart = (configuredStations.at(-1)?.stationNo ?? 0) + 1;
        const dynamicStationEntries: Array<[string, MonitorCallerStation]> = [];
        for (const [index, patient] of inProgressPatients.entries()) {
            const resolvedStation = resolvePatientStation(patient);
            if (resolvedStation) {
                dynamicStationEntries.push([resolvedStation.id, resolvedStation]);
                continue;
            }

            const callerUser = patient.calledByUser;
            if (!callerUser?.id) {
                continue;
            }

            const syntheticStation: MonitorCallerStation = {
                id: `caller-user:${callerUser.id}`,
                name: callerUser.name?.trim() || `Caller Station ${fallbackStationStart + index}`,
                stationNo: fallbackStationStart + index,
                type: 'CALLER',
                isActive: true,
                departmentId: departmentId ?? null,
            };
            dynamicStationEntries.push([syntheticStation.id, syntheticStation]);
        }
        const dynamicStations = Array.from(new Map<string, MonitorCallerStation>(dynamicStationEntries).values());

        const stations = Array.from(new Map(
            [...configuredStations, ...dynamicStations].map((station) => [station.id, station])
        ).values()).sort((left, right) => left.stationNo - right.stationNo);

        // 4. Build lane configs from workstation names + lane options.
        const stationConfigs = stations.map((station) => {
            const stationName = normalize(station.name);
            const matchedLaneOption = laneOptions.find((option) => {
                const code = normalize(option.code);
                const name = normalize(option.name);
                return stationName.includes(code) || stationName.includes(name);
            });

            let inferredLaneType: 'PRIORITY' | 'REGULAR' | 'ANY' = 'ANY';
            if (matchedLaneOption) {
                inferredLaneType = matchedLaneOption.isPriority ? 'PRIORITY' : 'REGULAR';
            } else if (stationName.includes('PRIOR') || stationName.includes('PRIO')) {
                inferredLaneType = 'PRIORITY';
            } else if (stationName.includes('REG')) {
                inferredLaneType = 'REGULAR';
            }

            return {
                station,
                laneOptionId: matchedLaneOption?.id,
                laneType: inferredLaneType
            };
        });

        const remainingPatients = [...inProgressPatients];
        const assignedPatients: Array<(typeof inProgressPatients)[number] | null> = stationConfigs.map(() => null);

        const isPriorityPatient = (patient: (typeof inProgressPatients)[number]) => {
            const hasPriorityCategory = patient.categories.some((visitCategory) => visitCategory.category?.isPriority);
            return patient.classification === 'PRIORITY' || hasPriorityCategory;
        };

        // First pass: place patients on the exact caller station that claimed them when available.
        stationConfigs.forEach((config, index) => {
            const patientIndex = remainingPatients.findIndex((patient) => {
                const resolvedStation = resolvePatientStation(patient);
                if (!resolvedStation) return false;
                return resolvedStation.id === config.station.id;
            });

            if (patientIndex >= 0) {
                assignedPatients[index] = remainingPatients[patientIndex];
                remainingPatients.splice(patientIndex, 1);
            }
        });

        // Second pass: honor lane option/category hints per station.
        stationConfigs.forEach((config, index) => {
            if (assignedPatients[index]) return;

            const patientIndex = remainingPatients.findIndex((patient) => {
                if (config.laneOptionId) {
                    return patient.categories.some((visitCategory) =>
                        visitCategory.categoryId === config.laneOptionId || visitCategory.category?.id === config.laneOptionId
                    );
                }
                if (config.laneType === 'PRIORITY') return isPriorityPatient(patient);
                if (config.laneType === 'REGULAR') return !isPriorityPatient(patient);
                return false;
            });

            if (patientIndex >= 0) {
                assignedPatients[index] = remainingPatients[patientIndex];
                remainingPatients.splice(patientIndex, 1);
            }
        });

        // Third pass: ensure in-progress patients are still displayed even without explicit lane matches.
        stationConfigs.forEach((_, index) => {
            if (!assignedPatients[index] && remainingPatients.length > 0) {
                assignedPatients[index] = remainingPatients.shift() ?? null;
            }
        });

        // 5. Build active display rows.
        const active = stationConfigs.map((config, index) => {
            const patient = assignedPatients[index];
            return {
                windowName: config.station.name,
                stationNo: config.station.stationNo,
                triageTicket: null,
                serviceTicket: patient
                    ? formatTicket(patient.serviceTicket, patient.classification, patient.categories)
                    : null,
                classification: patient?.classification,
                calledAt: patient?.calledAt || null,
                categories: patient?.categories.map(vc => vc.category)
            };
        });

        // 6. Get upcoming patients waiting in WAITING_CLINIC
        const upcomingVisits = await db.visit.findMany({
            where: {
                departmentId,
                status: 'WAITING_CLINIC',
                queueBusinessDay
            },
            orderBy: { queueDate: 'asc' },
            take: 4,
            select: {
                serviceTicket: true,
                classification: true,
                categories: {
                    include: {
                        category: true,
                    },
                },
            }
        });
        const upcoming = upcomingVisits
            .map(v => formatTicket(v.serviceTicket, v.classification, v.categories) as string)
            .filter(Boolean);

        const recentCalls = await this.getRecentCalls(departmentId);

        return { active, upcoming, recentCalls };

    }

    async getDepartmentsVideos() {
        return await db.department.findMany({
            select: { id: true, name: true, slug: true, videoUrl: true },
            orderBy: { name: 'asc' }
        });
    }

    async updateDepartmentVideo(departmentId: string, videoUrl: string) {
        return await db.department.update({
            where: { id: departmentId },
            data: { videoUrl }
        });
    }
}

export const monitorService = new MonitorService();
