import QueueMonitor from "@/features/admin/components/monitor";
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { SessionUser } from "@/types/auth";

export default async function MonitorPage({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const departmentName = typeof params?.departmentName === 'string' ? params.departmentName : "ANIMAL BITE DEPT";

    // We should also pre-fetch initial queue data here, similar to the caller.
    const { getClinicQueues } = await import('@/features/admin/clinic-queue-actions');
    const res = await getClinicQueues(departmentName);
    const initialQueue = res.success ? res.data : [];

    const session = await auth.api.getSession({ headers: await headers() });
    const loggedInUser = session?.user as unknown as SessionUser;

    return <QueueMonitor departmentName={departmentName} initialQueue={initialQueue} loggedInUser={loggedInUser!} />;
}
