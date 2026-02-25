import { auth } from "@/lib/database/auth";
import { getDepartments } from '@/services/department-services';
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ReportsDashboardClient from "../admin-dashboard/_components/reports-dashboard-client";
import { getReportSnapshot } from "./lib/report-data";

export default async function ReportsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    return redirect("/");
  }

  const response = await getDepartments();
  const departments = response.success && response.data ? response.data : [];
  const initialSnapshot = await getReportSnapshot();

  return (
    <ReportsDashboardClient
      loggedInUser={session.user}
      departments={departments}
      initialSnapshot={initialSnapshot}
    />
  );
}
