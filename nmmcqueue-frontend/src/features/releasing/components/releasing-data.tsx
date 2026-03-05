import { getQueueOptionsByDepartment } from '@/features/admin/queue-option-actions';
import { getDepartments } from '@/features/admin/department-actions';
import { Department } from "@/types/models";
import { connection } from "next/server";
import { getPendingQueue } from '../actions';
import { ClerkEntry } from './clerk-entry';

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
            <header className='bg-white sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-emerald-900">Ticket Releasing (Window)</h1>
                </div>
            </header>
            <ClerkEntry
                initialQueue={pendingQueue}
                departments={departments}
                queueOptionsByDepartment={queueOptionsByDepartment}
            />
        </div>
    );
}
