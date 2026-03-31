import { db } from '../../config/database.js';
import { WorkstationType } from '@prisma/client';
import { emitQueueUpdate } from '../../lib/sse.js';
import { AppError } from '../../middleware/error-handler.js';

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
        const station = await db.workStation.findUnique({
            where: { id },
            select: {
                id: true,
                stationNo: true,
                type: true,
                departmentId: true,
            }
        });

        if (!station) {
            throw new AppError('Station not found', 404, 'STATION_NOT_FOUND');
        }

        const result = await db.$transaction(async (tx) => {
            const linkedVisits = await tx.visit.findMany({
                where: {
                    OR: [
                        { calledAtStationId: id },
                        { triageStationId: id },
                        { originStationId: id },
                        // Fallback for legacy rows that only persisted station number.
                        { windowNumber: station.stationNo },
                    ]
                },
                select: {
                    id: true,
                    patientId: true,
                }
            });

            const linkedVisitIds = linkedVisits.map((visit) => visit.id);
            const patientIds = Array.from(new Set(linkedVisits.map((visit) => visit.patientId)));

            if (linkedVisitIds.length > 0) {
                await tx.visit.deleteMany({
                    where: { id: { in: linkedVisitIds } }
                });
            }

            let deletedPatients = 0;
            for (const patientId of patientIds) {
                const remainingVisits = await tx.visit.count({ where: { patientId } });
                if (remainingVisits === 0) {
                    await tx.patient.delete({ where: { id: patientId } });
                    deletedPatients += 1;
                }
            }

            await tx.user.updateMany({
                where: { workstationId: id },
                data: { workstationId: null }
            });

            await tx.workStation.delete({ where: { id } });

            return {
                deletedVisits: linkedVisitIds.length,
                deletedPatients,
            };
        });

        await emitQueueUpdate(station.departmentId || undefined);

        return {
            stationId: station.id,
            stationNo: station.stationNo,
            ...result,
        };
    }
}

export const workstationService = new WorkstationService();
