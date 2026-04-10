import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDepartments } from "@/features/admin/department-actions";
import { getQueueOptionsByDepartment } from "@/features/admin/queue-option-actions";
import { getReleasingQueue } from "@/features/admin/releasing-actions";
import { VisitWithPatient } from "@/features/triage/types";
import { auth } from "@/lib/database/auth";
import { AdminHeader } from "@/shared/layouts";
import { SessionUser } from "@/shared/types/auth";
import { Department, PriorityCategory } from "@/shared/types/models";
import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";

function normalizeDepartmentKey(value: string): string {
    return value.trim().toUpperCase();
}

function getDepartmentOptions(
    optionsByDepartment: Record<string, PriorityCategory[]>,
    departmentName: string
): PriorityCategory[] {
    const key = normalizeDepartmentKey(departmentName);
    return (
        optionsByDepartment[departmentName] ??
        optionsByDepartment[key] ??
        []
    );
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    if (status === "WAITING_WINDOW") return "default";
    if (status === "IN_PROGRESS") return "secondary";
    if (status === "NO_SHOW") return "destructive";
    return "outline";
}

function getPatientDisplayName(visit: VisitWithPatient): string {
    if (!visit.patient) return "Unknown Patient";
    const parts = [visit.patient.firstName, visit.patient.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Unknown Patient";
}

export default async function ManageReleasingData() {
    await connection();

    let session = null;
    let queue: VisitWithPatient[] = [];
    let departments: Department[] = [];
    let queueOptionsByDepartment: Record<string, PriorityCategory[]> = {};

    try {
        session = await auth.api.getSession({ headers: await headers() });

        const queueResponse = await getReleasingQueue();
        if (queueResponse?.success && Array.isArray(queueResponse.data)) {
            queue = queueResponse.data as VisitWithPatient[];
        }

        const departmentsResponse = await getDepartments();
        if (departmentsResponse?.success && Array.isArray(departmentsResponse.data)) {
            departments = departmentsResponse.data as Department[];
        }

        const departmentNames = departments.map((department) => department.name);
        if (departmentNames.length > 0) {
            const options = await getQueueOptionsByDepartment(departmentNames);
            queueOptionsByDepartment = (options ?? {}) as Record<string, PriorityCategory[]>;
        }
    } catch {
        // Gracefully render empty state when server data fetch fails.
    }

    if (!session?.user) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Releasing</CardTitle>
                        <CardDescription>Unable to load session. Please login again.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const waitingWindowCount = queue.filter((visit) => visit.status === "WAITING_WINDOW").length;
    const inProgressCount = queue.filter((visit) => visit.status === "IN_PROGRESS").length;
    const noShowCount = queue.filter((visit) => visit.status === "NO_SHOW").length;

    const readinessRows = departments.map((department) => {
        const options = getDepartmentOptions(queueOptionsByDepartment, department.name);
        const queueOptionCount = options.length;
        const priorityOptionCount = options.filter((option) => option.isPriority).length;

        return {
            id: department.id,
            departmentName: department.name,
            queueOptionCount,
            priorityOptionCount,
            isReady: queueOptionCount > 0,
        };
    });

    const configuredDepartmentsCount = readinessRows.filter((row) => row.isReady).length;
    const totalPriorityClasses = readinessRows.reduce(
        (sum, row) => sum + row.priorityOptionCount,
        0
    );

    const queuePreview = queue.slice(0, 12);

    return (
        <div className="flex flex-1 flex-col">
            <AdminHeader
                user={session.user as unknown as SessionUser}
                title="Manage Releasing"
                subtitle="Window Flow Configuration"
            />

            <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Waiting at Window</CardDescription>
                            <CardTitle className="text-3xl">{waitingWindowCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Currently in Progress</CardDescription>
                            <CardTitle className="text-3xl">{inProgressCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Marked No Show</CardDescription>
                            <CardTitle className="text-3xl">{noShowCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Configured Departments</CardDescription>
                            <CardTitle className="text-3xl">{configuredDepartmentsCount}/{departments.length || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    <Card className="xl:col-span-3">
                        <CardHeader>
                            <CardTitle>Releasing Stage Flow</CardTitle>
                            <CardDescription>
                                This reflects the current queue system behavior between triage and clinic caller.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-4">
                                <li className="border rounded-lg p-4">
                                    <p className="font-semibold">1. Intake from Triage</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Patients arrive in releasing with status WAITING_WINDOW after triage submission.
                                    </p>
                                </li>
                                <li className="border rounded-lg p-4">
                                    <p className="font-semibold">2. Call to Window</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Window clerk calls the ticket, moving status to IN_PROGRESS and capturing station details.
                                    </p>
                                </li>
                                <li className="border rounded-lg p-4">
                                    <p className="font-semibold">3. Assign to Clinic Queue</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Releasing assigns department and priority class, then sends patient to WAITING_CLINIC.
                                    </p>
                                </li>
                                <li className="border rounded-lg p-4">
                                    <p className="font-semibold">4. Exceptions</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        No-show handling remains at releasing and can be restored by downstream station workflows.
                                    </p>
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Admin Actions</CardTitle>
                            <CardDescription>Use these pages to operate and configure releasing behavior.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/admin-releasing" className="block border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                <p className="font-semibold text-sm">Open Releasing Dashboard</p>
                                <p className="text-xs text-muted-foreground mt-1">Run day-to-day releasing operations.</p>
                            </Link>
                            <Link href="/admin-departments" className="block border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                <p className="font-semibold text-sm">Manage Queue Options</p>
                                <p className="text-xs text-muted-foreground mt-1">Define department queue classes and priority categories.</p>
                            </Link>
                            <Link href="/admin-workstations" className="block border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                <p className="font-semibold text-sm">Manage Workstations</p>
                                <p className="text-xs text-muted-foreground mt-1">Assign and maintain window/triage/caller stations.</p>
                            </Link>
                            <div className="border rounded-lg p-3 bg-muted/20">
                                <p className="font-semibold text-sm">Priority Classes Configured</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total priority queue classes across departments: {totalPriorityClasses}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle>Department Assignment Readiness</CardTitle>
                            <CardDescription>
                                Departments with at least one queue option are ready for clinic assignment from releasing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Department</th>
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Queue Options</th>
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Priority Classes</th>
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {readinessRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-sm text-muted-foreground text-center">
                                                    No departments available.
                                                </td>
                                            </tr>
                                        ) : (
                                            readinessRows.map((row) => (
                                                <tr key={row.id} className="border-b last:border-b-0">
                                                    <td className="px-6 py-4 text-sm font-medium">{row.departmentName}</td>
                                                    <td className="px-6 py-4 text-sm">{row.queueOptionCount}</td>
                                                    <td className="px-6 py-4 text-sm">{row.priorityOptionCount}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={row.isReady ? "default" : "outline"}>
                                                            {row.isReady ? "Ready" : "Needs Setup"}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle>Live Window Queue Preview</CardTitle>
                            <CardDescription>
                                Current releasing queue snapshot for WAITING_WINDOW, IN_PROGRESS, and NO_SHOW statuses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Ticket</th>
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Patient</th>
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Window</th>
                                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Department</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {queuePreview.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-sm text-muted-foreground text-center">
                                                    Queue is currently empty.
                                                </td>
                                            </tr>
                                        ) : (
                                            queuePreview.map((visit) => (
                                                <tr key={visit.id} className="border-b last:border-b-0">
                                                    <td className="px-6 py-4 text-sm font-medium tabular-nums">
                                                        {visit.ticketNumber !== null ? `W-${String(visit.ticketNumber).padStart(3, "0")}` : "Unassigned"}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{getPatientDisplayName(visit)}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={getStatusBadgeVariant(visit.status)}>{visit.status}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{visit.windowNumber ?? "-"}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {visit.department?.name || "Not assigned"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}
