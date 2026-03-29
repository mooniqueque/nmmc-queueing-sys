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

    async createWithAutoIncrement(data: { type: WorkstationType, customName?: string, departmentId?: string, count?: number }) {
        const { type, customName, departmentId, count = 1 } = data;
        const maxRetries = 3;
        let lastError: any;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await db.$transaction(async (tx) => {
                    // Lock the table using a query to get the max current stationNo for this type
                    const lastStation = await tx.workStation.findFirst({
                        where: { type },
                        orderBy: { stationNo: 'desc' }
                    });

                    let nextNumber = (lastStation?.stationNo ?? 0) + 1;
                    const createdStations = [];

                    for (let i = 0; i < count; i++) {
                        // Generate name: If bulk, always append number to base string. If single and custom name provided, use it exactly.
                        let finalName = '';
                        if (count > 1) {
                            finalName = customName ? `${customName} ${i + 1}` : `${type.charAt(0) + type.slice(1).toLowerCase()} ${nextNumber}`;
                        } else {
                            finalName = customName ? customName : `${type.charAt(0) + type.slice(1).toLowerCase()} ${nextNumber}`;
                        }

                        const station = await tx.workStation.create({
                            data: {
                                name: finalName,
                                type,
                                stationNo: nextNumber,
                                ...(departmentId ? { departmentId } : {})
                            }
                        });
                        createdStations.push(station);
                        nextNumber++;
                    }

                    return createdStations;
                });
            } catch (error: any) {
                lastError = error;
                // If it's a unique constraint violation or transaction conflict, retry
                if (error.code === 'P2002' || error.code === 'P2034') {
                    // Slight backoff
                    await new Promise(res => setTimeout(res, 50 * (attempt + 1)));
                    continue;
                }
                throw error;
            }
        }
        throw new Error(`Failed to create workstation after ${maxRetries} attempts due to concurrency: ${lastError?.message || 'Unknown error'}`);
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
