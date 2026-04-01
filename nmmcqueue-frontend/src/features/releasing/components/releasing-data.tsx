import { getQueueOptionsByDepartment } from '@/features/admin/queue-option-actions';
import { getDepartments } from '@/features/admin/department-actions';
import { Department } from "@/shared/types/models";
import { connection } from "next/server";
import { getPendingQueue, getMyCurrentWindowVisit } from '../actions';
import { ReleasingEntry } from './releasing-entry';
import { getServerHeaders } from "@/lib/api/server";
import { API_URL } from "@/lib/api";
import { SessionUser } from "@/shared/types/auth";

export default async function ReleasingData() {
    await connection();

    const headers = await getServerHeaders();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let departments: any[] = [];
    let queueOptionsByDepartment = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pendingQueue: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentVisit: any = null;
    let session: { user: SessionUser } | null = null;

    try {
        const [deptResponse, queueResponse, currentRes, sessionRes] = await Promise.all([
            getDepartments(),
            getPendingQueue(),
            getMyCurrentWindowVisit(),
            fetch(`${API_URL}/auth/get-session`, { headers })
        ]);

        departments = deptResponse.data || [];
        const departmentNames = departments.map((dept: Department) => dept.name);
        queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);

        pendingQueue = queueResponse.success ? queueResponse.data : [];
        currentVisit = currentRes.success ? currentRes.data : null;

        if (sessionRes.ok) {
            session = await sessionRes.json();
        }
    } catch {
        // Build-time handle
    }

    return (
        <div className='flex flex-1 flex-col h-full bg-background overflow-hidden'>
            <ReleasingEntry
                initialQueue={pendingQueue}
                departments={departments}
                queueOptionsByDepartment={queueOptionsByDepartment}
                currentVisit={currentVisit}
                user={session?.user}
            />
        </div>
    );
}
