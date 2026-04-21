import { Prisma, WorkstationType } from '@prisma/client';
import { db } from '../../config/database.js';
import { emitQueueUpdate } from '../../lib/sse.js';
import { AppError } from '../../middleware/error-handler.js';

class WorkstationService {
    async getAll(filters?: {
        departmentId?: string;
        type?: WorkstationType;
        includeLegacyCallerParents?: boolean;
    }) {
        const departmentId = filters?.departmentId?.trim();
        const includeLegacyCallerParents = filters?.includeLegacyCallerParents ?? true;

        const where: Record<string, unknown> = {};
        if (departmentId) {
            where.departmentId = departmentId;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        // When querying callers without a departmentId, allow excluding legacy dept-less “lane” parents.
        if (!departmentId && filters?.type === 'CALLER' && !includeLegacyCallerParents) {
            where.departmentId = { not: null };
        }

        return await db.workStation.findMany({
            where,
            include: {
                department: true,
                parentWorkstation: {
                    select: {
                        id: true,
                        name: true,
                        stationNo: true,
                        type: true,
                    },
                },
                childWorkstations: {
                    include: {
                        department: true,
                    },
                    orderBy: [
                        { stationNo: 'asc' },
                        { name: 'asc' },
                    ],
                },
            },
            orderBy: [{ type: 'asc' }, { stationNo: 'asc' }]
        });
    }

    async getByType(type: WorkstationType) {
        return await db.workStation.findMany({
            where: { type, isActive: true },
            orderBy: { stationNo: 'asc' }
        });
    }

    async createWithAutoIncrement(data: {
        type: WorkstationType,
        queueMode?: 'MIXED' | 'PRIORITY_ONLY' | 'REGULAR_ONLY',
        customName?: string,
        departmentId?: string,
        count?: number,
    }) {
        const { type, queueMode = 'MIXED', customName, departmentId, count = 1 } = data;
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
                                queueMode,
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
        try {
            return await db.workStation.update({
                where: { id },
                data,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new AppError('Workstation name already exists.', 409, 'WORKSTATION_NAME_EXISTS');
                }

                if (error.code === 'P2025') {
                    throw new AppError('Station not found', 404, 'STATION_NOT_FOUND');
                }
            }

            throw error;
        }
    }

    async delete(id: string) {
        const station = await db.workStation.findUnique({
            where: { id },
            select: {
                id: true,
                stationNo: true,
                type: true,
                departmentId: true,
                parentWorkstationId: true,
                childWorkstations: {
                    select: {
                        id: true,
                        stationNo: true,
                        departmentId: true,
                    }
                }
            }
        });

        if (!station) {
            throw new AppError('Station not found', 404, 'STATION_NOT_FOUND');
        }

        const stationIdsToDelete = [station.id, ...station.childWorkstations.map((child) => child.id)];
        const stationNosToDelete = Array.from(new Set([station.stationNo, ...station.childWorkstations.map((child) => child.stationNo)]));
        const departmentIds = Array.from(new Set([station.departmentId, ...station.childWorkstations.map((child) => child.departmentId)].filter(Boolean)));

        const result = await db.$transaction(async (tx) => {
            const linkedVisits = await tx.visit.findMany({
                where: {
                    OR: [
                        { calledAtStationId: { in: stationIdsToDelete } },
                        { triageStationId: { in: stationIdsToDelete } },
                        { originStationId: { in: stationIdsToDelete } },
                        // Fallback for legacy rows that only persisted station number.
                        ...(station.type === 'WINDOW'
                            ? [{ windowNumber: { in: stationNosToDelete } }]
                            : []),
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
                where: { workstationId: { in: stationIdsToDelete } },
                data: { workstationId: null }
            });

            if (station.childWorkstations.length > 0) {
                await tx.workStation.deleteMany({
                    where: { id: { in: station.childWorkstations.map((child) => child.id) } }
                });
            }

            await tx.workStation.delete({ where: { id } });

            return {
                deletedVisits: linkedVisitIds.length,
                deletedPatients,
            };
        });

        for (const departmentId of departmentIds) {
            if (departmentId) {
                await emitQueueUpdate(departmentId);
            }
        }
        if (departmentIds.length === 0) {
            await emitQueueUpdate(undefined);
        }

        return {
            stationId: station.id,
            stationNo: station.stationNo,
            ...result,
        };
    }
}

export const workstationService = new WorkstationService();
