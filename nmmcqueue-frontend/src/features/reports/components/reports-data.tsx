import { getDepartments } from '@/features/admin/department-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/shared/types/auth";
import { Department } from "@/shared/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import ReportsDashboardClient from "@/features/admin/components/reports-dashboard-client";
import { getDefaultDateRange } from "@/features/reports/report-analytics";
import { getReportSnapshot, type ReportSnapshot } from "@/features/reports/report-data";

const emptySnapshot: ReportSnapshot = {
    filters: { ...getDefaultDateRange(), departmentId: "ALL", status: "ALL" },
    availableStatuses: [],
    metrics: { totalServed: 0, averageWaitingMinutes: 0, averageServiceMinutes: 0, peakHourLabel: "—", busiestDepartment: "—" },
    departmentData: [],
    hourlyData: [],
    statusData: [],
    dailyTrendData: [],
    generatedAt: new Date().toISOString(),
};

export default async function ReportsData() {
    await connection();

    let session = null;
    let departments: Department[] = [];
    let initialSnapshot: ReportSnapshot = emptySnapshot;

    try {
        session = await auth.api.getSession({ headers: await headers() });
        const response = await getDepartments();
        departments = response.success && response.data ? response.data : [];
        initialSnapshot = await getReportSnapshot();
    } catch {
        // Build-time handle
    }

    return (
        <ReportsDashboardClient
            loggedInUser={session?.user as unknown as SessionUser}
            departments={departments as Department[]}
            initialSnapshot={initialSnapshot}
        />
    );
}
