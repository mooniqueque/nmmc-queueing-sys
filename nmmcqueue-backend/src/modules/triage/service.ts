import { db } from '../../config/database.js';
import { withClaimConflictRetry } from '../../lib/claim-retry.js';
import logger from '../../lib/logger.js';
import { getQueueBusinessDay } from '../../lib/queue-business-day.js';
import { publishSseEvent, SSE_TOPICS } from '../../lib/sse.js';
import { AppError } from '../../middleware/error-handler.js';
import { monitorService } from '../monitor/service.js';
import { ticketService } from '../tickets/service.js';
import { kioskFormSchema, triageFormSchema } from './schema.js';

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
        const rawData = await kioskFormSchema.parseAsync(payload);
        const monthNamesToNum: Record<string, string> = {
            January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
            July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
        };
        const formattedMonth = monthNamesToNum[rawData.dobMonth] || String(rawData.dobMonth).padStart(2, '0');
        const compiledDobStr = `${rawData.dobYear}-${formattedMonth}-${String(rawData.dobDay).padStart(2, '0')}`;
        const dateOfBirth = new Date(compiledDobStr);
        const hospitalId = rawData.hospitalId && rawData.hospitalId.trim() !== '' ? rawData.hospitalId.trim() : null;

        const queueBusinessDay = getQueueBusinessDay();
        const createdVisitId = await db.$transaction(async (tx) => {
            let patient;
            if (hospitalId) {
                patient = await tx.patient.findUnique({ where: { hospitalId } });
                if (patient) {
                    patient = await tx.patient.update({
                        where: { id: patient.id },
                        data: { firstName: rawData.firstName, lastName: rawData.lastName, middleName: rawData.middleName || null, dateOfBirth, gender: rawData.gender, contactNo: rawData.contactNo, address: rawData.address, birthPlace: rawData.birthPlace, religion: rawData.religion, civilStatus: rawData.civilStatus },
                    });
                } else {
                    patient = await tx.patient.create({
                        data: { hospitalId, firstName: rawData.firstName, lastName: rawData.lastName, middleName: rawData.middleName || null, dateOfBirth, gender: rawData.gender, contactNo: rawData.contactNo, address: rawData.address, birthPlace: rawData.birthPlace, religion: rawData.religion, civilStatus: rawData.civilStatus },
                    });
                }
            } else {
                patient = await tx.patient.create({
                    data: {
                        firstName: rawData.firstName,
                        lastName: rawData.lastName,
                        middleName: rawData.middleName || null,
                        dateOfBirth,
                        gender: rawData.gender,
                        contactNo: rawData.contactNo,
                        address: rawData.address,
                        birthPlace: rawData.birthPlace,
                        religion: rawData.religion,
                        civilStatus: rawData.civilStatus,
                        isRegistered: false,
                    }
                });
            }

            const existingVisit = await tx.visit.findFirst({ where: { patientId: patient.id, queueBusinessDay, status: { in: ['WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'IN_PROGRESS', 'WAITING_CLINIC'] } } });
            if (existingVisit) throw new AppError('ALREADY_IN_QUEUE', 400);

            const classification = await determineClassification(rawData.categoryIds || []);
            
            const visit = await tx.visit.create({ 
                data: { 
                    patientId: patient.id, 
                    status: 'WAITING_TRIAGE', 
                    triageTicket: null,
                    serviceTicket: null,
                    sequenceKey: null,
                    queueBusinessDay,
                    kioskRegistrationType: rawData.kioskRegistrationType || 'UNREGISTERED',
                    hasAppointment: rawData.hasAppointment,
                    originStationId: rawData.originStationId,
                    classification,
                    categories: {
                        create: (rawData.categoryIds || []).map(id => ({ categoryId: id }))
                    },
                    statusHistory: {
                        create: { status: 'WAITING_TRIAGE' }
                    }
                } 
            });

            logger.info('Patient queued via Kiosk', {
                patientId: patient.id,
                visitId: visit.id,
                classification,
                originStationId: rawData.originStationId
            });
            return visit.id;
        });

        publishTriageVisitUpsert(await getTriageVisitPayload(createdVisitId));
    }


    async submitTriageForm(values: unknown, visitId: string | undefined, userId: string) {
        const validData = await triageFormSchema.parseAsync(values);
        let affectedPatientId: string | undefined;
        const queueBusinessDay = getQueueBusinessDay();
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { workstationId: true }
        });

        const triageUpdates: any = {
            bloodPressure: validData.bloodPressure, heartRate: validData.heartRate, respiratoryRate: validData.respiratoryRate,
            temperature: validData.temperature, oxygenSat: validData.oxygenSat, hasFever: validData.hasFever,
            hasCough: validData.hasCough, hasColds: validData.hasColds, hasRashes: validData.hasRashes,
            isInfectious: validData.isInfectious, chiefComplaint: validData.chiefComplaint, medicalHistory: validData.medicalHistory,
            triageRemarks: validData.triageRemarks, disposition: validData.disposition, hasAppointment: validData.hasAppointment,
            departmentId: validData.departmentId,
            triagedAt: new Date(), triagedByUserId: userId, triageStationId: user?.workstationId, status: 'WAITING_WINDOW',
        };

        if (validData.isManualEntry) {
            if (!validData.firstName || !validData.lastName || !validData.dateOfBirth || !validData.gender) throw new Error('Missing required demographic fields for Walk-In.');
            const patient = await db.patient.create({
                data: {
                    firstName: validData.firstName!,
                    middleName: validData.middleName,
                    lastName: validData.lastName!,
                    dateOfBirth: new Date(validData.dateOfBirth!),
                    gender: validData.gender!,
                    address: validData.address,
                    birthPlace: validData.birthPlace,
                    religion: validData.religion,
                    civilStatus: validData.civilStatus,
                    isRegistered: false,
                }
            });
            affectedPatientId = patient.id;
            const result = await db.$transaction(async (tx) => {
                let classificationStr = (validData.priorityClass as 'REGULAR' | 'PRIORITY') || undefined;
                if (!classificationStr) {
                    classificationStr = await determineClassification(validData.categoryIds || []);
                }
                const nextTicket = await ticketService.generateNextTicketNumber(tx, `WINDOW_${classificationStr}`, queueBusinessDay);
                const isNewPatient = (await tx.visit.count({ where: { patientId: patient!.id } })) <= 1;
                
                const newVisit = await tx.visit.create({ 
                    data: { 
                        patientId: patient!.id, 
                        triageTicket: nextTicket,
                        serviceTicket: null,
                        sequenceKey: `WINDOW_${classificationStr}`,
                        queueBusinessDay,
                        ...triageUpdates,
                        classification: classificationStr,
                        categories: {
                            create: (validData.categoryIds || []).map(id => ({ categoryId: id }))
                        },
                        statusHistory: {
                            create: { status: 'WAITING_WINDOW' }
                        }
                    } 
                });
                return { triageTicket: nextTicket, patientName: `${patient.firstName} ${patient.lastName}`.trim(), classification: classificationStr, isNewPatient };
            });
            
            logger.info('Triage completed for walk-in visit', {
                visitId: undefined,
                userId,
                isManualEntry: validData.isManualEntry,
                patientId: affectedPatientId
            });
            const latestVisit = await db.visit.findFirst({
                where: { patientId: patient.id, queueBusinessDay },
                orderBy: { createdAt: 'desc' },
            });
            if (latestVisit) {
                publishWindowVisitUpsert(await getTriageVisitPayload(latestVisit.id));
            }
            await publishWindowMonitorSnapshot();
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
            const dob = validData.dateOfBirth ? new Date(validData.dateOfBirth) : undefined;
            
            const result = await db.$transaction(async (tx) => {
                let classificationStr = (validData.priorityClass as 'REGULAR' | 'PRIORITY') || undefined;
                if (!classificationStr) {
                    classificationStr = await determineClassification(validData.categoryIds || []);
                }
                const nextTicket = await ticketService.generateNextTicketNumber(tx, `WINDOW_${classificationStr}`, existingVisit.queueBusinessDay ?? getQueueBusinessDay());
                const isNewPatient = (await tx.visit.count({ where: { patientId: existingVisit.patientId } })) <= 1;
                
                const updatedPatient = await tx.patient.update({ 
                    where: { id: existingVisit.patientId }, 
                    data: { firstName: validData.firstName, middleName: validData.middleName, lastName: validData.lastName, dateOfBirth: dob, gender: validData.gender, address: validData.address, birthPlace: validData.birthPlace, religion: validData.religion, civilStatus: validData.civilStatus } 
                });

                await tx.visit.update({ 
                    where: { id: visitId }, 
                    data: {
                        ...triageUpdates,
                        triageTicket: nextTicket,
                        serviceTicket: null,
                        sequenceKey: `WINDOW_${classificationStr}`,
                        classification: classificationStr,
                        triageClaimedById: null,
                        triageStartedAt: null,
                        categories: {
                            deleteMany: {},
                            create: (validData.categoryIds || []).map(id => ({ categoryId: id }))
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
                isManualEntry: validData.isManualEntry,
                patientId: affectedPatientId
            });
            publishTriageVisitRemove(visitId);
            publishWindowVisitUpsert(await getTriageVisitPayload(visitId));
            await publishWindowMonitorSnapshot();
            return result;
        }
    }

    async getPendingQueue() {
        const queueBusinessDay = getQueueBusinessDay();

        return db.visit.findMany({
            where: {
                queueBusinessDay,
                status: { in: ['WAITING_TRIAGE', 'NO_SHOW'] },
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
        await db.visit.update({ 
            where: { id: visitId }, 
            data: { 
                status: 'WAITING_TRIAGE',
                statusHistory: { create: { status: 'WAITING_TRIAGE', changedBy: userId } }
            } 
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
                include: { patient: true }
            });

            if (!visitToCall || (visitToCall.status !== 'NO_SHOW' && visitToCall.status !== 'WAITING_TRIAGE')) {
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
