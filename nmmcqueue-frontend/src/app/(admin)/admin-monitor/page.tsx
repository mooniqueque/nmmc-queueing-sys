import QueueMonitor from "@/features/admin/components/monitor";

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

    return <QueueMonitor departmentName={departmentName} initialQueue={initialQueue} />;
}
