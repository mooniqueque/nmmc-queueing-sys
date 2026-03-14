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

    async getDepartmentStatus(departmentId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find all workstations of type CALLER for this department
        const stations = await db.workStation.findMany({
            where: { 
                departmentId,
                type: 'CALLER', 
                isActive: true 
            },
            orderBy: { stationNo: 'asc' }
        });

        // For each station, find the currently serving ticket (IN_PROGRESS)
        const status = await Promise.all(stations.map(async (station) => {
            const currentVisit = await db.visit.findFirst({
                where: {
                    departmentId,
                    windowNumber: station.stationNo, // Using windowNumber as the station identifier for visits
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
}

export const monitorService = new MonitorService();
