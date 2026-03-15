import { db } from '../../config/database.js';
import { WorkstationType } from '@prisma/client';

class WorkstationService {
    async getAll() {
        return await db.workStation.findMany({
            include: { department: true },
            orderBy: [{ type: 'asc' }, { stationNo: 'asc' }]
        });
    }

    async getByType(type: WorkstationType) {
        return await db.workStation.findMany({
            where: { type, isActive: true },
            orderBy: { stationNo: 'asc' }
        });
    }

    async create(data: { name: string, type: WorkstationType, stationNo: number, departmentId?: string }) {
        return await db.workStation.create({
            data: {
                name: data.name,
                type: data.type,
                stationNo: data.stationNo,
                departmentId: data.departmentId
            }
        });
    }

    async update(id: string, data: any) {
        return await db.workStation.update({
            where: { id },
            data
        });
    }

    async delete(id: string) {
        return await db.workStation.delete({ where: { id } });
    }
}

export const workstationService = new WorkstationService();
