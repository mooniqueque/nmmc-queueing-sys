import DepartmentMonitor from "@/features/admin/components/department-monitor";

export default async function DepartmentMonitorPage({
    params
}: {
    params: Promise<{ departmentId: string }>;
}) {
    const { departmentId } = await params;
    return <DepartmentMonitor departmentId={departmentId} />;
}
