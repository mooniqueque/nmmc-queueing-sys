import { db } from '../../config/database.js';
import { getQueueBusinessDay } from '../../lib/queue-business-day.js';

class MonitorService {
    async getWindowStatus() {
        const queueBusinessDay = getQueueBusinessDay();

        // Find all workstations of type WINDOW
        const windows = await db.workStation.findMany({
            where: { type: 'WINDOW', isActive: true },
            orderBy: { stationNo: 'asc' }
        });

        const activeVisits = await db.visit.findMany({
            where: {
                status: 'IN_WINDOW',
                sequenceKey: { startsWith: 'WINDOW' },
                queueBusinessDay,
                windowNumber: { not: null },
            },
            orderBy: [{ calledAt: 'desc' }],
            select: {
                windowNumber: true,
                triageTicket: true,
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

        const formatTicket = (ticketNo: number | null | undefined, classification: string | null | undefined) => {
            if (!ticketNo) return null;
            const prefix = classification === 'PRIORITY' ? 'PRIO' : 'REG';
            return `${prefix}-${String(ticketNo)}`;
        };

        const status = windows.map((window) => {
            const currentVisit = latestVisitByWindow.get(window.stationNo);
            return {
                windowName: window.name,
                stationNo: window.stationNo,
                triageTicket: currentVisit ? formatTicket(currentVisit.triageTicket, currentVisit.classification) : null,
                serviceTicket: null,
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
            select: { triageTicket: true, classification: true }
        });
        const upcoming = waitlistVisits.map(v => formatTicket(v.triageTicket, v.classification) as string).filter(Boolean);

        return { active: status, upcoming };
    }

    async getDepartmentStatus(slugOrId: string) {
        const queueBusinessDay = getQueueBusinessDay();

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

        const formatTicket = (ticketNo: number | null | undefined, classification: string | null | undefined) => {
            if (!ticketNo) return null;
            const prefix = classification === 'PRIORITY' ? 'PRIO' : 'REG';
            return `${prefix}-${String(ticketNo).padStart(3, '0')}`;
        };

        const normalize = (value: string) => value.trim().toUpperCase();

        // 2. Get all CALLER stations for this department (in order)
        const stations = await db.workStation.findMany({
            where: { departmentId, type: 'CALLER', isActive: true },
            orderBy: { stationNo: 'asc' }
        });

        // Reuse existing lane options (priority categories) for lane matching.
        const laneOptions = await db.priorityCategory.findMany({
            where: { departmentId },
            select: { id: true, name: true, code: true, isPriority: true }
        });

        // 3. Get ALL IN_PROGRESS patients (regardless of windowNumber)
        const inProgressPatients = await db.visit.findMany({
            where: {
                departmentId,
                status: 'IN_PROGRESS',
                sequenceKey: `DEPT_${departmentId}`,
                queueBusinessDay
            },
            orderBy: { calledAt: 'asc' },
            select: { 
                serviceTicket: true, 
                classification: true, 
                calledAt: true,
                categories: { include: { category: true } } 
            }
        });

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

        // First pass: honor lane option/category hints per station.
        stationConfigs.forEach((config, index) => {
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

        // Second pass: ensure in-progress patients are still displayed even without explicit lane matches.
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
                serviceTicket: patient ? formatTicket(patient.serviceTicket, patient.classification) : null,
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
            select: { serviceTicket: true, classification: true }
        });
        const upcoming = upcomingVisits.map(v => formatTicket(v.serviceTicket, v.classification) as string).filter(Boolean);

        return { active, upcoming };

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
