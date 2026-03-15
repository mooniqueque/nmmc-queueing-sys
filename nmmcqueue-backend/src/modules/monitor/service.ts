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

        // For each window, find the currently serving ticket (IN_PROGRESS)
        const status = await Promise.all(windows.map(async (window) => {
            const currentVisit = await db.visit.findFirst({
                where: {
                    windowNumber: window.stationNo,
                    status: 'IN_PROGRESS',
                    createdAt: { gte: today, lt: tomorrow }
                },
                orderBy: { calledAt: 'desc' },
                select: { 
                    ticketNumber: true, 
                    classification: true,
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
                ticketNumber: currentVisit ? String(currentVisit.ticketNumber).padStart(3, '0') : null,
                classification: currentVisit?.classification,
                categories: currentVisit?.categories.map(vc => vc.category)
            };
        }));

        return status;
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

        // 2. Find all visits currently being served in this department
        const activeVisits = await db.visit.findMany({
            where: {
                departmentId,
                status: 'IN_PROGRESS',
                createdAt: { gte: today, lt: tomorrow }
            },
            orderBy: { calledAt: 'asc' },
            select: { 
                ticketNumber: true, 
                classification: true,
                categories: {
                    include: {
                        category: true
                    }
                }
            }
        });

        if (activeVisits.length > 0) {
            return activeVisits.map((visit) => ({
                windowName: department?.code || department?.name || 'CLINIC',
                stationNo: 1, // Default to 1 as it's a centralized caller
                ticketNumber: String(visit.ticketNumber).padStart(3, '0'),
                classification: visit.classification,
                categories: visit.categories.map(vc => vc.category)
            }));
        }

        // 3. Fallback: Check for workstations if no visits are active 
        // (Allows the monitor to show "Wait..." rows if stations are defined but idle)
        const stations = await db.workStation.findMany({
            where: { 
                departmentId,
                type: 'CALLER', 
                isActive: true 
            },
            orderBy: { stationNo: 'asc' }
        });

        const status = await Promise.all(stations.map(async (station) => {
            const currentVisit = await db.visit.findFirst({
                where: {
                    departmentId,
                    windowNumber: station.stationNo,
                    status: 'IN_PROGRESS',
                    createdAt: { gte: today, lt: tomorrow }
                },
                orderBy: { calledAt: 'desc' },
                select: { 
                    ticketNumber: true, 
                    classification: true,
                    categories: {
                        include: {
                            category: true
                        }
                    }
                }
            });

            return {
                windowName: station.name,
                stationNo: station.stationNo,
                ticketNumber: currentVisit ? String(currentVisit.ticketNumber).padStart(3, '0') : null,
                classification: currentVisit?.classification,
                categories: currentVisit?.categories.map(vc => vc.category)
            };
        }));

        return status;
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
