import type { KioskRegistrationPayload, TriageFormValues, VisitClassification } from '@nmmc/types';
import type { Prisma } from '@prisma/client';
import { db } from '../../config/database.js';
import { withClaimConflictRetry } from '../../lib/claim-retry.js';
import logger from '../../lib/logger.js';
import { getQueueBusinessDay } from '../../lib/queue-business-day.js';
import { publishSseEvent, SSE_TOPICS } from '../../lib/sse.js';
import { AppError } from '../../middleware/error-handler.js';
import { monitorService } from '../monitor/service.js';
import { ticketService } from '../tickets/service.js';
import { kioskFormSchema, triageFormSchema } from './schema.js';

type NormalizedKioskInput = {
    hospitalId?: string;
    contactNo?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dobMonth: string;
    dobDay: string;
    dobYear: string;
    age?: number;
    gender: string;
    address: string;
    birthPlace: string;
    religion?: string;
    civilStatus: string;
    hasAppointment: boolean;
    originStationId?: string;
    categoryIds: string[];
    kioskRegistrationType?: 'REGISTERED' | 'UNREGISTERED';
    dateOfBirth: Date;
};

type NormalizedTriageInput = {
    isManualEntry: boolean;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
    address?: string;
    birthPlace?: string;
    religion?: string;
    civilStatus?: string;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    oxygenSat?: number;
    hasFever: boolean;
    hasCough: boolean;
    hasColds: boolean;
    hasRashes: boolean;
    isInfectious: boolean;
    chiefComplaint?: string;
    medicalHistory?: string;
    triageRemarks?: string;
    disposition?: string;
    hasAppointment: boolean;
    departmentId?: string;
    categoryIds: string[];
    priorityClass?: VisitClassification | string;
};

function withTriageQueueTicket<T extends { triageTicket?: number | null }>(visit: T | null) {
    if (!visit) return visit;
    return { ...visit };
}

async function determineClassification(categoryIds: string[]): Promise<'REGULAR' | 'PRIORITY'> {
    if (!categoryIds || categoryIds.length === 0) return 'REGULAR';
    const categories = await db.priorityCategory.findMany({
        where: { id: { in: categoryIds }, isPriority: true },
        select: { id: true }
    });
    return categories.length > 0 ? 'PRIORITY' : 'REGULAR';
}

async function getTriageVisitPayload(visitId: string) {
    const visit = await db.visit.findUnique({
        where: { id: visitId },
        include: {
            patient: true,
            department: true,
            categories: { include: { category: true } },
        }
    });
    return withTriageQueueTicket(visit);
}

function publishTriageVisitUpsert<T>(visit: T | null) {
    if (!visit) return;
    publishSseEvent([SSE_TOPICS.TRIAGE], 'visit-upsert', { visit });
}

function publishTriageVisitRemove(visitId: string) {
    publishSseEvent([SSE_TOPICS.TRIAGE], 'visit-remove', { visitId });
}

function publishWindowVisitUpsert<T>(visit: T | null) {
    if (!visit) return;
    publishSseEvent([SSE_TOPICS.WINDOW], 'visit-upsert', { visit });
}

async function publishWindowMonitorSnapshot() {
    const { upcoming } = await monitorService.getWindowStatus();
    publishSseEvent([SSE_TOPICS.MONITOR_WINDOWS], 'monitor-upcoming', { upcoming });
}

class TriageService {
    private normalizeKioskInput(data: KioskRegistrationPayload): NormalizedKioskInput {
        const monthNamesToNum: Record<string, string> = {
            January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
            July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
        };
        const formattedMonth = monthNamesToNum[data.dobMonth] || String(data.dobMonth).padStart(2, '0');
        const compiledDobStr = `${data.dobYear}-${formattedMonth}-${String(data.dobDay).padStart(2, '0')}`;
        const dateOfBirth = new Date(compiledDobStr);
        const hospitalId = data.hospitalId && data.hospitalId.trim() !== '' ? data.hospitalId.trim() : undefined;

        return {
            ...data,
            dateOfBirth,
            hospitalId,
            categoryIds: data.categoryIds || [],
        };
    }

    private normalizeTriageInput(data: TriageFormValues): NormalizedTriageInput {
        const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
        return {
            ...data,
            dateOfBirth,
            categoryIds: data.categoryIds || [],
        };
    }

    private async findOrCreatePatient(
        tx: Prisma.TransactionClient,
        data: NormalizedKioskInput
    ) {
        if (data.hospitalId) {
            let patient = await tx.patient.findUnique({ where: { hospitalId: data.hospitalId } });
            if (patient) {
                patient = await tx.patient.update({
                    where: { id: patient.id },
                    data: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        middleName: data.middleName || null,
                        dateOfBirth: data.dateOfBirth,
                        gender: data.gender,
                        contactNo: data.contactNo,
                        address: data.address,
                        birthPlace: data.birthPlace,
                        religion: data.religion,
                        civilStatus: data.civilStatus,
                    },
                });
            } else {
                patient = await tx.patient.create({
                    data: {
                        hospitalId: data.hospitalId,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        middleName: data.middleName || null,
                        dateOfBirth: data.dateOfBirth,
                        gender: data.gender,
                        contactNo: data.contactNo,
                        address: data.address,
                        birthPlace: data.birthPlace,
                        religion: data.religion,
                        civilStatus: data.civilStatus,
                    },
                });
            }
            return patient;
        }

        return tx.patient.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName || null,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                contactNo: data.contactNo,
                address: data.address,
                birthPlace: data.birthPlace,
                religion: data.religion,
                civilStatus: data.civilStatus,
                isRegistered: false,
            },
        });
    }

    private async createVisitRecord(
        tx: Prisma.TransactionClient,
        patientId: string,
        data: NormalizedKioskInput,
        queueBusinessDay: string,
        classification: VisitClassification
    ) {
        const visit = await tx.visit.create({
            data: {
                patientId,
                status: 'WAITING_TRIAGE',
                triageTicket: null,
                serviceTicket: null,
                sequenceKey: null,
                queueBusinessDay,
                kioskRegistrationType: data.kioskRegistrationType || 'UNREGISTERED',
                hasAppointment: data.hasAppointment,
                originStationId: data.originStationId,
                classification,
                categories: {
                    create: data.categoryIds.map((id) => ({ categoryId: id })),
                },
                statusHistory: {
                    create: { status: 'WAITING_TRIAGE' },
                },
            },
        });

        return visit.id;
    }

    private async emitQueueEvents(mode: 'kiosk' | 'triage-manual' | 'triage-queued', visitId: string, patientId?: string, queueBusinessDay?: string) {
        if (mode === 'kiosk') {
            publishTriageVisitUpsert(await getTriageVisitPayload(visitId));
            return;
        }

        if (mode === 'triage-manual' && patientId && queueBusinessDay) {
            const latestVisit = await db.visit.findFirst({
                where: { patientId, queueBusinessDay },
                orderBy: { createdAt: 'desc' },
            });
            if (latestVisit) {
                publishWindowVisitUpsert(await getTriageVisitPayload(latestVisit.id));
            }
            await publishWindowMonitorSnapshot();
            return;
        }

        publishTriageVisitRemove(visitId);
        publishWindowVisitUpsert(await getTriageVisitPayload(visitId));
        await publishWindowMonitorSnapshot();
    }

    private buildTriageCreateData(
        data: NormalizedTriageInput,
        userId: string,
        workstationId?: string | null
    ): Omit<Prisma.VisitUncheckedCreateInput, 'patientId' | 'triageTicket' | 'serviceTicket' | 'sequenceKey' | 'queueBusinessDay' | 'classification'> {
        return {
            bloodPressure: data.bloodPressure,
            heartRate: data.heartRate,
            respiratoryRate: data.respiratoryRate,
            temperature: data.temperature,
            oxygenSat: data.oxygenSat,
            hasFever: data.hasFever,
            hasCough: data.hasCough,
            hasColds: data.hasColds,
            hasRashes: data.hasRashes,
            isInfectious: data.isInfectious,
            chiefComplaint: data.chiefComplaint,
            medicalHistory: data.medicalHistory,
            triageRemarks: data.triageRemarks,
            disposition: data.disposition,
            hasAppointment: data.hasAppointment,
            departmentId: data.departmentId,
            triagedAt: new Date(),
            triagedByUserId: userId,
            triageStationId: workstationId,
            status: 'WAITING_WINDOW',
        };
    }

    private buildTriageUpdateData(
        data: NormalizedTriageInput,
        userId: string,
        workstationId?: string | null
    ): Prisma.VisitUncheckedUpdateInput {
        return {
            bloodPressure: data.bloodPressure,
            heartRate: data.heartRate,
            respiratoryRate: data.respiratoryRate,
            temperature: data.temperature,
            oxygenSat: data.oxygenSat,
            hasFever: data.hasFever,
            hasCough: data.hasCough,
            hasColds: data.hasColds,
            hasRashes: data.hasRashes,
            isInfectious: data.isInfectious,
            chiefComplaint: data.chiefComplaint,
            medicalHistory: data.medicalHistory,
            triageRemarks: data.triageRemarks,
            disposition: data.disposition,
            hasAppointment: data.hasAppointment,
            departmentId: data.departmentId,
            triagedAt: new Date(),
            triagedByUserId: userId,
            triageStationId: workstationId,
            status: 'WAITING_WINDOW',
        };
    }
    async getMyAccessibleDepartments(userId: string) {
        const assignments = await db.userDepartmentAccess.findMany({
            where: { userId, isEnabled: true },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        videoUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        assignments.sort((left, right) => left.department.name.localeCompare(right.department.name));

        const departments = assignments.map((assignment) => assignment.department);
        if (departments.length > 0) return departments;

        const user = await db.user.findUnique({
            where: { id: userId },
            select: { departmentId: true },
        });

        if (!user?.departmentId) return [];

        const legacyDepartment = await db.department.findUnique({
            where: { id: user.departmentId },
            select: {
                id: true,
                name: true,
                code: true,
                videoUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return legacyDepartment ? [legacyDepartment] : [];
    }

    async registerKioskPatient(payload: unknown) {
        const rawData = await kioskFormSchema.parseAsync(payload) as KioskRegistrationPayload;
        const normalized = this.normalizeKioskInput(rawData);
        const queueBusinessDay = getQueueBusinessDay();

        const createdVisitId = await db.$transaction(async (tx) => {
            const patient = await this.findOrCreatePatient(tx, normalized);
            const existingVisit = await tx.visit.findFirst({
                where: {
                    patientId: patient.id,
                    queueBusinessDay,
                    status: { in: ['WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'IN_PROGRESS', 'WAITING_CLINIC'] }
                }
            });
            if (existingVisit) throw new AppError('ALREADY_IN_QUEUE', 400);

            const classification = await determineClassification(normalized.categoryIds);
            const visitId = await this.createVisitRecord(tx, patient.id, normalized, queueBusinessDay, classification);

            logger.info('Patient queued via Kiosk', {
                patientId: patient.id,
                visitId,
                classification,
                originStationId: normalized.originStationId
            });

            return visitId;
        });

        await this.emitQueueEvents('kiosk', createdVisitId);
    }


    async submitTriageForm(values: unknown, visitId: string | undefined, userId: string) {
        const validData = await triageFormSchema.parseAsync(values) as TriageFormValues;
        const normalized = this.normalizeTriageInput(validData);
        let affectedPatientId: string | undefined;
        const queueBusinessDay = getQueueBusinessDay();
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { workstationId: true }
        });

        const triageCreateData = this.buildTriageCreateData(normalized, userId, user?.workstationId);
        const triageUpdateData = this.buildTriageUpdateData(normalized, userId, user?.workstationId);

        if (normalized.isManualEntry) {
            if (!normalized.firstName || !normalized.lastName || !normalized.dateOfBirth || !normalized.gender) {
                throw new Error('Missing required demographic fields for Walk-In.');
            }

            const patient = await db.patient.create({
                data: {
                    firstName: normalized.firstName,
                    middleName: normalized.middleName,
                    lastName: normalized.lastName,
                    dateOfBirth: normalized.dateOfBirth,
                    gender: normalized.gender,
                    address: normalized.address,
                    birthPlace: normalized.birthPlace,
                    religion: normalized.religion,
                    civilStatus: normalized.civilStatus,
                    isRegistered: false,
                }
            });

            affectedPatientId = patient.id;

            const result = await db.$transaction(async (tx) => {
                let classificationStr = (normalized.priorityClass as VisitClassification) || undefined;
                if (!classificationStr) {
                    classificationStr = await determineClassification(normalized.categoryIds);
                }
                const nextTicket = await ticketService.generateNextTicketNumber(tx, `WINDOW_${classificationStr}`, queueBusinessDay);
                const isNewPatient = (await tx.visit.count({ where: { patientId: patient.id } })) <= 1;

                await tx.visit.create({
                    data: {
                        patientId: patient.id,
                        triageTicket: nextTicket,
                        serviceTicket: null,
                        sequenceKey: `WINDOW_${classificationStr}`,
                        queueBusinessDay,
                        ...triageCreateData,
                        classification: classificationStr,
                        categories: {
                            create: normalized.categoryIds.map((id) => ({ categoryId: id }))
                        },
                        statusHistory: {
                            create: { status: 'WAITING_WINDOW' }
                        }
                    }
                });
                return {
                    triageTicket: nextTicket,
                    patientName: `${patient.firstName} ${patient.lastName}`.trim(),
                    classification: classificationStr,
                    isNewPatient,
                };
            });

            logger.info('Triage completed for walk-in visit', {
                visitId: undefined,
                userId,
                isManualEntry: normalized.isManualEntry,
                patientId: affectedPatientId
            });

            await this.emitQueueEvents('triage-manual', '', patient.id, queueBusinessDay);
            return result;
        } else {
            if (!visitId) throw new Error('No Visit ID provided for queue patient.');
            const existingVisit = await db.visit.findUnique({
                where: { id: visitId },
                select: { patientId: true, status: true, triageClaimedById: true, queueBusinessDay: true }
            });
            if (!existingVisit) throw new Error('Visit not found.');
            if (existingVisit.status !== 'IN_TRIAGE') {
                throw new AppError('Visit must be actively claimed in triage before submission.', 409, 'INVALID_TRIAGE_STATE');
            }
            if (existingVisit.triageClaimedById !== userId) {
                throw new AppError('Only the triage nurse who claimed this visit can submit it.', 409, 'TRIAGE_CLAIM_REQUIRED');
            }
            affectedPatientId = existingVisit.patientId;
            
            const result = await db.$transaction(async (tx) => {
                let classificationStr = (normalized.priorityClass as VisitClassification) || undefined;
                if (!classificationStr) {
                    classificationStr = await determineClassification(normalized.categoryIds);
                }
                const nextTicket = await ticketService.generateNextTicketNumber(tx, `WINDOW_${classificationStr}`, existingVisit.queueBusinessDay ?? getQueueBusinessDay());
                const isNewPatient = (await tx.visit.count({ where: { patientId: existingVisit.patientId } })) <= 1;
                
                const updatedPatient = await tx.patient.update({ 
                    where: { id: existingVisit.patientId }, 
                    data: { 
                        firstName: normalized.firstName,
                        middleName: normalized.middleName,
                        lastName: normalized.lastName,
                        dateOfBirth: normalized.dateOfBirth,
                        gender: normalized.gender,
                        address: normalized.address,
                        birthPlace: normalized.birthPlace,
                        religion: normalized.religion,
                        civilStatus: normalized.civilStatus
                    } 
                });

                await tx.visit.update({ 
                    where: { id: visitId }, 
                    data: {
                        ...triageUpdateData,
                        triageTicket: nextTicket,
                        serviceTicket: null,
                        sequenceKey: `WINDOW_${classificationStr}`,
                        classification: classificationStr,
                        triageClaimedById: null,
                        triageStartedAt: null,
                        categories: {
                            deleteMany: {},
                            create: normalized.categoryIds.map((id) => ({ categoryId: id }))
                        },
                        statusHistory: {
                            create: { status: 'WAITING_WINDOW' }
                        }
                    }
                });
                
                return { triageTicket: nextTicket, patientName: `${updatedPatient.firstName} ${updatedPatient.lastName}`.trim(), classification: classificationStr, isNewPatient };
            });
            
            logger.info('Triage completed for queued visit', {
                visitId,
                userId,
                isManualEntry: normalized.isManualEntry,
                patientId: affectedPatientId
            });
            await this.emitQueueEvents('triage-queued', visitId);
            return result;
        }
    }

    async getPendingQueue() {
        const queueBusinessDay = getQueueBusinessDay();

        return db.visit.findMany({
            where: {
                queueBusinessDay,
                OR: [
                    { status: 'WAITING_TRIAGE' },
                    {
                        status: 'NO_SHOW',
                        sequenceKey: null,
                    },
                ],
            },
            include: {
                patient: true,
                categories: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: [
                { classification: 'desc' },
                { createdAt: 'asc' }
            ],
        }).then(visits => visits.map(withTriageQueueTicket));
    }

    async markNoShow(visitId: string, userId?: string) { 
        if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        const updated = await db.visit.updateMany({
            where: {
                id: visitId,
                status: 'IN_TRIAGE',
                triageClaimedById: userId,
            },
            data: {
                status: 'NO_SHOW',
                sequenceKey: null,
                triageClaimedById: null,
                triageStartedAt: null,
            }
        });
        if (updated.count === 0) {
            throw new AppError('Only your currently claimed triage visit can be marked no-show.', 409, 'TRIAGE_CLAIM_REQUIRED');
        }
        await db.visitStatusHistory.create({
            data: { visitId, status: 'NO_SHOW', changedBy: userId }
        });
        publishTriageVisitUpsert(await getTriageVisitPayload(visitId));
    }
    async restoreNoShow(visitId: string, userId?: string) { 
        const updated = await db.visit.updateMany({
            where: {
                id: visitId,
                status: 'NO_SHOW',
                sequenceKey: null,
            },
            data: { 
                status: 'WAITING_TRIAGE',
            } 
        });
        if (updated.count === 0) {
            throw new AppError('Only triage no-show visits can be restored to triage queue.', 409, 'TRIAGE_CLAIM_REQUIRED');
        }
        await db.visitStatusHistory.create({
            data: { visitId, status: 'WAITING_TRIAGE', changedBy: userId }
        });
        publishTriageVisitUpsert(await getTriageVisitPayload(visitId));
    }
    async removeQueue(visitId: string) {
        await db.visit.delete({ where: { id: visitId } });
        publishTriageVisitRemove(visitId);
    }

    /**
     * CLAIM-BASED: Atomically claim the next WAITING_TRIAGE patient.
     * Uses a transaction with a status guard to prevent race conditions.
     */
    async callNextTriage(userId: string) {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { workstation: true }
        });
        if (!user?.workstationId) throw new AppError('You must be assigned to a workstation to call patients.', 400, 'CALLER_ASSIGNMENT_REQUIRED');

        const queueBusinessDay = getQueueBusinessDay();

        return withClaimConflictRetry(() => db.$transaction(async (tx) => {
            // Find the next patient in FIFO order
            const nextVisit = await tx.visit.findFirst({
                where: {
                    queueBusinessDay,
                    status: 'WAITING_TRIAGE',
                },
                orderBy: { createdAt: 'asc' },
                include: { patient: true }
            });

            if (!nextVisit) return null; // Queue empty

            // Atomic claim: update ONLY if status is still WAITING_TRIAGE
            const claimed = await tx.visit.updateMany({
                where: {
                    id: nextVisit.id,
                    status: 'WAITING_TRIAGE', // concurrency guard
                },
                data: {
                    status: 'IN_TRIAGE',
                    triageClaimedById: userId,
                    triageStartedAt: new Date(),
                    triageStationId: user.workstationId,
                }
            });

            if (claimed.count === 0) {
                throw new AppError('Patient was already claimed by another user. Try again.', 409, 'CLAIM_CONFLICT');
            }

            // Fetch the updated visit with patient data
            const updatedVisit = await tx.visit.findUnique({
                where: { id: nextVisit.id },
                include: {
                    patient: true,
                    categories: { include: { category: true } }
                }
            });

            await tx.visitStatusHistory.create({
                data: { visitId: nextVisit.id, status: 'IN_TRIAGE', changedBy: userId }
            });

            logger.info('Triage claimed patient', {
                visitId: nextVisit.id,
                userId,
                workstationId: user.workstationId
            });
            const payload = withTriageQueueTicket(updatedVisit);
            publishTriageVisitUpsert(payload);
            return payload;
        }));
    }

    /**
     * CLAIM-BASED: Explicitly claim a specific patient (e.g. No Show or specific Waiter)
     */
    async callSpecificTriage(visitId: string, userId: string) {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { workstation: true }
        });
        if (!user?.workstationId) throw new AppError('You must be assigned to a workstation to call patients.', 400, 'CALLER_ASSIGNMENT_REQUIRED');

        return withClaimConflictRetry(() => db.$transaction(async (tx) => {
            const visitToCall = await tx.visit.findUnique({
                where: { id: visitId },
                include: { patient: true },
            });

            const isTriageNoShow = visitToCall?.status === 'NO_SHOW' && visitToCall.sequenceKey === null;
            if (!visitToCall || (!isTriageNoShow && visitToCall.status !== 'WAITING_TRIAGE')) {
                throw new AppError('Patient is not waiting or no-show.', 400);
            }

            const claimed = await tx.visit.updateMany({
                where: {
                    id: visitId,
                    status: visitToCall.status // concurrency guard
                },
                data: {
                    status: 'IN_TRIAGE',
                    triageClaimedById: userId,
                    triageStartedAt: new Date(),
                    triageStationId: user.workstationId,
                }
            });

            if (claimed.count === 0) {
                throw new AppError('Patient was already claimed by another user.', 409, 'CLAIM_CONFLICT');
            }

            const updatedVisit = await tx.visit.findUnique({
                where: { id: visitId },
                include: {
                    patient: true,
                    categories: { include: { category: true } }
                }
            });

            await tx.visitStatusHistory.create({
                data: { visitId: visitId, status: 'IN_TRIAGE', changedBy: userId }
            });

            logger.info('Triage specifically called patient', {
                visitId: visitId,
                userId,
                workstationId: user.workstationId
            });

            const payload = withTriageQueueTicket(updatedVisit);
            publishTriageVisitUpsert(payload);
            return payload;
        }));
    }

    /**
     * Get the visit currently claimed by this triage user (IN_TRIAGE).
     */
    async getMyCurrentVisit(userId: string) {
        const queueBusinessDay = getQueueBusinessDay();

        return db.visit.findFirst({
            where: {
                triageClaimedById: userId,
                status: 'IN_TRIAGE',
                queueBusinessDay,
            },
            include: {
                patient: true,
                categories: { include: { category: true } }
            }
        }).then(withTriageQueueTicket);
    }
}

export const triageService = new TriageService();
