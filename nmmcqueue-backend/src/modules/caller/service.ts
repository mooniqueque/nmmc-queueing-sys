import { db } from '../../config/database.js';
import { emitQueueUpdate } from '../../lib/sse.js';

const normalizeOption = (v: string) => v.trim().toUpperCase();
const normalizeDepartmentKey = (v: string) => v.trim().toUpperCase();

class CallerService {
    async getDepartments() { return await db.department.findMany({ orderBy: { name: 'asc' } }); }
    async createDepartment(name: string, code: string) { 
        const trimmedName = name.trim().toUpperCase();
        const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return await db.department.create({ 
            data: { 
                name: trimmedName, 
                code: code.trim().toUpperCase(),
                slug
            } 
        }); 
    }
    async deleteDepartment(id: string) { await db.department.delete({ where: { id } }); }
    async getQueueOptions(departmentName: string) {
        const dept = await db.department.findUnique({ 
            where: { name: departmentName.trim().toUpperCase() }, 
            select: { priorityCategories: { select: { id: true, name: true, code: true, isPriority: true, parentId: true } } } 
        });
        return dept ? dept.priorityCategories : [];
    }
    async getPendingQueue(departmentName?: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const whereClause: any = {
            createdAt: { gte: today, lt: tomorrow },
            status: { in: ['WAITING_CLINIC', 'IN_PROGRESS', 'NO_SHOW'] },
        };

        if (departmentName) {
            const dept = await db.department.findUnique({ where: { name: departmentName.trim().toUpperCase() } });
            if (dept) {
                whereClause.departmentId = dept.id;
            } else {
                // If department not found, do not return all queues, return none
                whereClause.departmentId = 'NON_EXISTENT';
            }
        }

        return db.visit.findMany({
            where: whereClause,
            include: {
                patient: true,
                department: true,
                referredFrom: true,
                categories: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: [
                { classification: 'desc' },
                { ticketNumber: 'asc' },
            ],
        });
    }

    async getQueueOptionsByDepartment(names: string[]) {
        const trimmed = Array.from(new Set(names.map(n => n.trim().toUpperCase()).filter(n => n.length > 0)));
        const depts = await db.department.findMany({ 
            where: { name: { in: trimmed } }, 
            select: { name: true, priorityCategories: { select: { id: true, name: true, code: true, isPriority: true, parentId: true } } } 
        });
        const byKey = Object.fromEntries(depts.map(d => [normalizeDepartmentKey(d.name), d.priorityCategories]));
        return Object.fromEntries(trimmed.map(n => { const k = normalizeDepartmentKey(n); return [k, byKey[k] ?? []]; }));
    }
    async createQueueOption(departmentName: string, data: { name: string, code: string, isPriority: boolean, parentId?: string }) {
        const dept = await db.department.findUnique({ where: { name: departmentName.trim().toUpperCase() }, select: { id: true } });
        if (!dept) throw new Error('Department not found.');
        
        return await db.priorityCategory.create({
            data: {
                name: data.name,
                code: data.code.trim().toUpperCase(),
                isPriority: data.isPriority,
                departmentId: dept.id,
                parentId: data.parentId
            }
        });
    }

    async deleteQueueOption(id: string) {
        await db.priorityCategory.delete({ where: { id } });
    }

    async callPatient(visitId: string, userId?: string, windowNumber?: number) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { 
                status: 'IN_PROGRESS',
                calledAt: new Date(),
                calledByUserId: userId,
                windowNumber: windowNumber,
                statusHistory: { create: { status: 'IN_PROGRESS', changedBy: userId } }
            }
        });
        if (updated.departmentId) await emitQueueUpdate(updated.departmentId);
        return updated;
    }

    async servePatient(visitId: string, userId?: string) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { 
                status: 'COMPLETED',
                statusHistory: { create: { status: 'COMPLETED', changedBy: userId } }
            }
        });
        if (updated.departmentId) await emitQueueUpdate(updated.departmentId);
        return updated;
    }

    async noShowPatient(visitId: string, userId?: string) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { 
                status: 'NO_SHOW',
                statusHistory: { create: { status: 'NO_SHOW', changedBy: userId } }
            }
        });
        if (updated.departmentId) await emitQueueUpdate(updated.departmentId);
        return updated;
    }

    async transferPatient(visitId: string, targetDepartmentId: string, userId?: string) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        if (visit.departmentId === targetDepartmentId) throw new Error('Patient is already in this department');
        
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { 
                status: 'WAITING_CLINIC', 
                departmentId: targetDepartmentId,
                isReferred: true,
                referredFromId: visit.departmentId,
                statusHistory: { create: { status: 'WAITING_CLINIC', changedBy: userId } }
            }
        });
        
        if (visit.departmentId) await emitQueueUpdate(visit.departmentId);
        await emitQueueUpdate(targetDepartmentId);
        return updated;
    }

    async notifyPatient(visitId: string) {
        const visit = await db.visit.findUnique({ 
            where: { id: visitId },
            include: { patient: true }
        });
        if (!visit) throw new Error('Visit not found');
        
        const contactNo = visit.patient.contactNo;
        if (!contactNo) throw new Error('Patient has no contact number registered');

        console.log(`[SMS MOCK] Sending SMS to ${contactNo}: "Please proceed to the clinic, it is almost your turn."`);
        return { success: true, message: 'Notification sent successfully' };
    }
    async restorePatient(visitId: string, userId?: string) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { 
                status: 'WAITING_CLINIC',
                statusHistory: { create: { status: 'WAITING_CLINIC', changedBy: userId } }
            }
        });
        if (updated.departmentId) await emitQueueUpdate(updated.departmentId);
        return updated;
    }
}

export const callerService = new CallerService();
