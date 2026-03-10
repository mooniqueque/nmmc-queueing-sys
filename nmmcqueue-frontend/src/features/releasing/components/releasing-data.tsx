import { getQueueOptionsByDepartment } from '@/features/admin/queue-option-actions';
import { getDepartments } from '@/features/admin/department-actions';
import { Department } from "@/types/models";
import { connection } from "next/server";
import { getPendingQueue } from '../actions';
import { ReleasingEntry } from './releasing-entry';

export default async function ReleasingData() {
    await connection();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let departments: any[] = [];
    let queueOptionsByDepartment = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pendingQueue: any[] = [];

    try {
        const response = await getDepartments();
        departments = response.data || [];
        const departmentNames = departments.map((dept: Department) => dept.name);
        queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);

        const queueResponse = await getPendingQueue();
        pendingQueue = queueResponse.success ? queueResponse.data : [];
    } catch {
        // Build-time handle
    }

    return (
        <div className='flex flex-1 flex-col h-full'>
            <header className=''>
            </header>
            <ReleasingEntry
                initialQueue={pendingQueue}
                departments={departments}
                queueOptionsByDepartment={queueOptionsByDepartment}
            />
        </div>
    );
}
