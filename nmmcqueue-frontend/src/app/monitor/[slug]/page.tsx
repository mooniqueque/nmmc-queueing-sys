import DepartmentMonitor from "@/features/monitoring/components/department-monitor";

export default async function DepartmentMonitorPage({
    params
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return <DepartmentMonitor slug={slug} />;
}
