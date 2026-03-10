import { db } from '../../config/database.js';
import { emitQueueUpdate } from '../../lib/sse.js';

const DEFAULT_QUEUE_OPTIONS = ['REGULAR', 'CHILD', 'ER-REF', 'FT', 'REFERRALS'];
const normalizeOption = (v: string) => v.trim().toUpperCase();
const normalizeDepartmentKey = (v: string) => v.trim().toUpperCase();
const isDefaultOption = (v: string) => DEFAULT_QUEUE_OPTIONS.includes(v);
function orderOptions(values: string[]) {
    const unique = Array.from(new Set(values.map(normalizeOption).filter(v => v.length > 0)));
    const defaults = DEFAULT_QUEUE_OPTIONS.filter(o => unique.includes(o));
    const custom = unique.filter(o => !isDefaultOption(o)).sort((a, b) => a.localeCompare(b));
    return [...defaults, ...custom];
}
function getEffectiveOptions(stored: string[]) { return stored.length > 0 ? orderOptions(stored) : [...DEFAULT_QUEUE_OPTIONS]; }

class CallerService {
    async getDepartments() { return await db.department.findMany({ orderBy: { name: 'asc' } }); }
    async createDepartment(name: string, code: string) { return await db.department.create({ data: { name: name.trim().toUpperCase(), code: code.trim().toUpperCase() } }); }
    async deleteDepartment(id: string) { await db.department.delete({ where: { id } }); }
    async getQueueOptions(departmentName: string) {
        const dept = await db.department.findUnique({ where: { name: departmentName.trim() }, select: { queueOptions: { select: { option: true } } } });
        return getEffectiveOptions(dept ? dept.queueOptions.map(q => normalizeOption(q.option)) : []);
    }
    async getPendingQueue(departmentName?: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const whereClause: any = {
            createdAt: { gte: today, lt: tomorrow },
            status: { in: ['WAITING_CLINIC', 'IN_PROGRESS'] },
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
            },
            orderBy: { ticketNumber: 'asc' },
        });
    }

    async getQueueOptionsByDepartment(names: string[]) {
        const trimmed = Array.from(new Set(names.map(n => n.trim()).filter(n => n.length > 0)));
        const depts = await db.department.findMany({ where: { name: { in: trimmed } }, select: { name: true, queueOptions: { select: { option: true } } } });
        const byKey = Object.fromEntries(depts.map(d => [normalizeDepartmentKey(d.name), getEffectiveOptions(d.queueOptions.map(q => normalizeOption(q.option)))]));
        return Object.fromEntries(trimmed.map(n => { const k = normalizeDepartmentKey(n); return [k, byKey[k] ?? [...DEFAULT_QUEUE_OPTIONS]]; }));
    }
    async createQueueOption(departmentName: string, option: string) {
        const normalized = normalizeOption(option);
        if (!normalized) throw new Error('Queue option cannot be empty.');
        const dept = await db.department.findUnique({ where: { name: departmentName.trim() }, select: { id: true, queueOptions: { select: { option: true } } } });
        if (!dept) throw new Error('Department not found.');
        const effective = getEffectiveOptions(dept.queueOptions.map(i => normalizeOption(i.option)));
        if (effective.includes(normalized)) throw new Error('Queue option already exists.');
        await this.replaceDepartmentOptions(dept.id, orderOptions([...effective, normalized]));
    }
    async deleteQueueOption(departmentName: string, option: string) {
        const normalized = normalizeOption(option);
        if (!normalized) throw new Error('Queue option cannot be empty.');
        const dept = await db.department.findUnique({ where: { name: departmentName.trim() }, select: { id: true, queueOptions: { select: { option: true } } } });
        if (!dept) throw new Error('Department not found.');
        const effective = getEffectiveOptions(dept.queueOptions.map(i => normalizeOption(i.option)));
        const next = effective.filter(v => v !== normalized);
        if (next.length === effective.length) throw new Error('Queue option not found.');
        await this.replaceDepartmentOptions(dept.id, next);
    }
    async replaceDepartmentOptions(departmentId: string, options: string[]) {
        const next = orderOptions(options);
        await db.$transaction(async (tx) => {
            await tx.laneOption.deleteMany({ where: { departmentId } });
            if (next.length > 0) await tx.laneOption.createMany({ data: next.map(option => ({ departmentId, option })), skipDuplicates: true });
        });
    }

    async callPatient(visitId: string) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { status: 'IN_PROGRESS' }
        });
        if (updated.departmentId) emitQueueUpdate(updated.departmentId);
        return updated;
    }

    async servePatient(visitId: string) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { status: 'COMPLETED' }
        });
        if (updated.departmentId) emitQueueUpdate(updated.departmentId);
        return updated;
    }

    async noShowPatient(visitId: string) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { status: 'NO_SHOW' }
        });
        if (updated.departmentId) emitQueueUpdate(updated.departmentId);
        return updated;
    }

    async transferPatient(visitId: string, targetDepartmentId: string) {
        const visit = await db.visit.findUnique({ where: { id: visitId } });
        if (!visit) throw new Error('Visit not found');
        
        const updated = await db.visit.update({
            where: { id: visitId },
            data: { 
                status: 'WAITING_CLINIC', 
                departmentId: targetDepartmentId 
            }
        });
        
        if (visit.departmentId) emitQueueUpdate(visit.departmentId);
        emitQueueUpdate(targetDepartmentId);
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
}

export const callerService = new CallerService();
