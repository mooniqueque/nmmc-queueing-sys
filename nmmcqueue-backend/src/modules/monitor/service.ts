import { db } from '../../config/database.js';

class MonitorService {
    async getWindowStatus() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find all workstations of type WINDOW
        const windows = await db.workStation.findMany({
            where: { type: 'WINDOW', isActive: true },
            orderBy: { stationNo: 'asc' }
        });

        const formatTicket = (ticketNo: number | null | undefined, classification: string | null | undefined) => {
            if (!ticketNo) return null;
            const prefix = classification === 'PRIORITY' ? 'PRIO' : 'REG';
            return `${prefix}-${String(ticketNo)}`;
        };

        // For each window, find the currently serving ticket (IN_WINDOW)
        const status = await Promise.all(windows.map(async (window) => {
            const currentVisit = await db.visit.findFirst({
                where: {
                    windowNumber: window.stationNo,
                    status: 'IN_WINDOW',
                    sequenceKey: { startsWith: 'WINDOW' },
                    createdAt: { gte: today, lt: tomorrow }
                },
                orderBy: { calledAt: 'desc' },
                select: {
                    ticketNumber: true,
                    classification: true,
                    calledAt: true,
                    categories: {
                        include: {
                            category: true
                        }
                    }
                }
            });

            return {
                windowName: window.name,
                stationNo: window.stationNo,
                ticketNumber: currentVisit ? formatTicket(currentVisit.ticketNumber, currentVisit.classification) : null,
                classification: currentVisit?.classification,
                calledAt: currentVisit?.calledAt || null,
                categories: currentVisit?.categories.map(vc => vc.category)
            };
        }));

        const waitlistVisits = await db.visit.findMany({
            where: {
                status: 'WAITING_WINDOW',
                createdAt: { gte: today, lt: tomorrow }
            },
            orderBy: { queueDate: 'asc' },
            take: 4,
            select: { ticketNumber: true, classification: true }
        });
        const upcoming = waitlistVisits.map(v => formatTicket(v.ticketNumber, v.classification) as string).filter(Boolean);

        return { active: status, upcoming };
    }

    async getDepartmentStatus(slugOrId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

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
                createdAt: { gte: today, lt: tomorrow }
            },
            orderBy: { calledAt: 'asc' },
            select: { 
                ticketNumber: true, 
                classification: true, 
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
                ticketNumber: patient ? formatTicket(patient.ticketNumber, patient.classification) : null,
                classification: patient?.classification,
                categories: patient?.categories.map(vc => vc.category)
            };
        });

        // 6. Get upcoming patients waiting in WAITING_CLINIC
        const upcomingVisits = await db.visit.findMany({
            where: {
                departmentId,
                status: 'WAITING_CLINIC',
                createdAt: { gte: today, lt: tomorrow }
            },
            orderBy: { queueDate: 'asc' },
            take: 4,
            select: { ticketNumber: true, classification: true }
        });
        const upcoming = upcomingVisits.map(v => formatTicket(v.ticketNumber, v.classification) as string).filter(Boolean);

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
