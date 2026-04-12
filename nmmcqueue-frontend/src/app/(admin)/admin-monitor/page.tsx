import QueueMonitor from "@/features/admin/components/clinic-queue-monitor-page";
import { getDepartments } from "@/features/admin/department-actions";
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/shared/types/auth";
import { headers } from "next/headers";

export default async function MonitorPage({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await searchParams;
    const departmentsResponse = await getDepartments();
    const departments = departmentsResponse.success ? (departmentsResponse.data ?? []) : [];

    const session = await auth.api.getSession({ headers: await headers() });
    const loggedInUser = session?.user as unknown as SessionUser;

    return <QueueMonitor departments={departments} loggedInUser={loggedInUser!} />;
}
