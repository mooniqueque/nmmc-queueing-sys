import { db } from '../../config/database.js';
import { emitQueueUpdate } from '../../lib/sse.js';
import { ticketService } from '../tickets/service.js';
import { kioskFormSchema, triageFormSchema } from './schema.js';

function calculateAgeFromDate(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }
    return age >= 0 ? age : 0;
}

class TriageService {
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

        await db.$transaction(async (tx) => {
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
                patient = await tx.patient.findFirst({ where: { firstName: rawData.firstName, lastName: rawData.lastName, dateOfBirth } });
                if (patient) {
                    patient = await tx.patient.update({ where: { id: patient.id }, data: { firstName: rawData.firstName, lastName: rawData.lastName, middleName: rawData.middleName || null, dateOfBirth, gender: rawData.gender, contactNo: rawData.contactNo, address: rawData.address, birthPlace: rawData.birthPlace, religion: rawData.religion, civilStatus: rawData.civilStatus } });
                } else {
                    patient = await tx.patient.create({ data: { firstName: rawData.firstName, lastName: rawData.lastName, middleName: rawData.middleName || null, dateOfBirth, gender: rawData.gender, contactNo: rawData.contactNo, address: rawData.address, birthPlace: rawData.birthPlace, religion: rawData.religion, civilStatus: rawData.civilStatus } });
                }
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existingVisit = await tx.visit.findFirst({ where: { patientId: patient.id, createdAt: { gte: today }, status: { in: ['KIOSK_SUBMITTED', 'IN_PROGRESS', 'WAITING_CLINIC'] } } });
            if (existingVisit) throw new Error('ALREADY_IN_QUEUE');

            const nextTicket = await ticketService.generateNextTicketNumber(tx);
            await tx.visit.create({ 
                data: { 
                    patientId: patient.id, 
                    status: 'KIOSK_SUBMITTED', 
                    ticketNumber: nextTicket, 
                    hasAppointment: rawData.hasAppointment,
                    statusHistory: {
                        create: { status: 'KIOSK_SUBMITTED' }
                    }
                } 
            });
        });
        emitQueueUpdate();
    }

    async submitTriageForm(values: unknown, visitId: string | undefined, userId: string) {
        const validData = await triageFormSchema.parseAsync(values);
        const triageUpdates: any = {
            bloodPressure: validData.bloodPressure, heartRate: validData.heartRate, respiratoryRate: validData.respiratoryRate,
            temperature: validData.temperature, oxygenSat: validData.oxygenSat, hasFever: validData.hasFever,
            hasCough: validData.hasCough, hasColds: validData.hasColds, hasRashes: validData.hasRashes,
            isInfectious: validData.isInfectious, chiefComplaint: validData.chiefComplaint, medicalHistory: validData.medicalHistory,
            triageRemarks: validData.triageRemarks, disposition: validData.disposition, hasAppointment: validData.hasAppointment,
            triagedAt: new Date(), triagedByUserId: userId, status: 'WAITING_WINDOW',
        };
        if (validData.isManualEntry) {
            if (!validData.firstName || !validData.lastName || !validData.dateOfBirth || !validData.gender) throw new Error('Missing required demographic fields for Walk-In.');
            let patient = await db.patient.findFirst({ where: { firstName: validData.firstName, lastName: validData.lastName, dateOfBirth: new Date(validData.dateOfBirth) } });
            if (!patient) {
                patient = await db.patient.create({ data: { firstName: validData.firstName!, middleName: validData.middleName, lastName: validData.lastName!, dateOfBirth: new Date(validData.dateOfBirth!), gender: validData.gender!, address: validData.address, birthPlace: validData.birthPlace, religion: validData.religion, civilStatus: validData.civilStatus } });
            }
            await db.$transaction(async (tx) => {
                const nextTicket = await ticketService.generateNextTicketNumber(tx);
                await tx.visit.create({ 
                    data: { 
                        patientId: patient!.id, 
                        ticketNumber: nextTicket, 
                        ...triageUpdates,
                        statusHistory: {
                            create: { status: 'WAITING_WINDOW' }
                        }
                    } 
                });
            });
        } else {
            if (!visitId) throw new Error('No Visit ID provided for queue patient.');
            const existingVisit = await db.visit.findUnique({ where: { id: visitId }, select: { patientId: true } });
            if (!existingVisit) throw new Error('Visit not found.');
            const dob = validData.dateOfBirth ? new Date(validData.dateOfBirth) : undefined;
            await db.$transaction([
                db.patient.update({ where: { id: existingVisit.patientId }, data: { firstName: validData.firstName, middleName: validData.middleName, lastName: validData.lastName, dateOfBirth: dob, gender: validData.gender, address: validData.address, birthPlace: validData.birthPlace, religion: validData.religion, civilStatus: validData.civilStatus } }),
                db.visit.update({ 
                    where: { id: visitId }, 
                    data: {
                        ...triageUpdates,
                        statusHistory: {
                            create: { status: 'WAITING_WINDOW' }
                        }
                    }
                }),
            ]);
        }
        // Notify all SSE listeners that the queue has changed (Releasing window needs this)
        emitQueueUpdate();
    }

    async getPendingQueue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return db.visit.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow },
                status: { in: ['KIOSK_SUBMITTED', 'NO_SHOW'] },
            },
            include: {
                patient: true,
            },
            orderBy: { ticketNumber: 'asc' },
        });
    }

    async markNoShow(visitId: string, userId?: string) { 
        await db.visit.update({ 
            where: { id: visitId }, 
            data: { 
                status: 'NO_SHOW',
                statusHistory: { create: { status: 'NO_SHOW', changedBy: userId } }
            } 
        }); 
    }
    async restoreNoShow(visitId: string, userId?: string) { 
        await db.visit.update({ 
            where: { id: visitId }, 
            data: { 
                status: 'KIOSK_SUBMITTED',
                statusHistory: { create: { status: 'KIOSK_SUBMITTED', changedBy: userId } }
            } 
        }); 
    }
    async removeQueue(visitId: string) { await db.visit.delete({ where: { id: visitId } }); }
    async getPatientByHospitalId(hospitalId: string) {
        const patient = await db.patient.findUnique({ where: { hospitalId: hospitalId.trim() } });
        if (!patient) throw new Error('Hospital ID not found.');
        return patient;
    }
}

export const triageService = new TriageService();
