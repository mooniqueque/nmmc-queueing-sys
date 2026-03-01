import { fetchDistinctStatusesAPI, fetchReportVisitsAPI } from "@/app/actions/report-actions";
import {
  buildDailyTrend,
  buildHourlyVolume,
  buildPatientsPerDepartment,
  buildStatusDistribution,
  buildSummaryMetrics,
  filterVisits,
  getDefaultDateRange,
  type DailyTrendRow,
  type DepartmentChartRow,
  type HourlyChartRow,
  type ReportFilters,
  type StatusChartRow,
  type SummaryMetrics,
} from "./report-analytics";

export type ReportVisitRecord = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  queueDate: string;
  departmentId: string | null;
  departmentName: string;
};

export type ReportSnapshot = {
  filters: ReportFilters;
  availableStatuses: string[];
  metrics: SummaryMetrics;
  departmentData: DepartmentChartRow[];
  hourlyData: HourlyChartRow[];
  statusData: StatusChartRow[];
  dailyTrendData: DailyTrendRow[];
  generatedAt: string;
};

export async function getReportVisits(whereFilters: Record<string, unknown>): Promise<ReportVisitRecord[]> {
  const response = await fetchReportVisitsAPI(whereFilters);
  const visits = response.success && response.data ? response.data : [];

  return visits.map((visit: {
    id: string;
    status: string;
    createdAt: string | number | Date;
    updatedAt: string | number | Date;
    queueDate: string | number | Date;
    departmentId: string | null;
    department?: { name: string };
  }) => ({
    id: visit.id,
    status: visit.status,
    createdAt: new Date(visit.createdAt).toISOString(),
    updatedAt: new Date(visit.updatedAt).toISOString(),
    queueDate: new Date(visit.queueDate).toISOString(),
    departmentId: visit.departmentId,
    departmentName: visit.department?.name ?? "UNASSIGNED",
  }));
}

export function normalizeReportFilters(filters?: Partial<ReportFilters>): ReportFilters {
  const fallback = getDefaultDateRange();

  return {
    fromDate: filters?.fromDate || fallback.fromDate,
    toDate: filters?.toDate || fallback.toDate,
    departmentId: filters?.departmentId || "ALL",
    status: filters?.status || "ALL",
  };
}

export async function getReportSnapshot(filters?: Partial<ReportFilters>): Promise<ReportSnapshot> {
  const normalizedFilters = normalizeReportFilters(filters);
  const visits = await getReportVisits(buildVisitWhere(normalizedFilters));

  const statusRes = await fetchDistinctStatusesAPI();
  const statuses = statusRes.success && statusRes.data ? statusRes.data : [
    { status: "KIOSK_SUBMITTED" }, { status: "WAITING" }, { status: "SERVING" }, { status: "COMPLETED" }, { status: "NO_SHOW" }
  ];

  const filteredVisits = filterVisits(visits, normalizedFilters);

  return {
    filters: normalizedFilters,
    availableStatuses: statuses.map((item: { status: string }) => item.status),
    metrics: buildSummaryMetrics(filteredVisits),
    departmentData: buildPatientsPerDepartment(filteredVisits),
    hourlyData: buildHourlyVolume(filteredVisits),
    statusData: buildStatusDistribution(filteredVisits),
    dailyTrendData: buildDailyTrend(filteredVisits),
    generatedAt: new Date().toISOString(),
  };
}

function buildVisitWhere(filters: ReportFilters): Record<string, unknown> {
  const fromBoundary = new Date(`${filters.fromDate}T00:00:00`);
  const toBoundary = new Date(`${filters.toDate}T23:59:59.999`);

  return {
    createdAt: {
      gte: Number.isNaN(fromBoundary.getTime()) ? undefined : fromBoundary,
      lte: Number.isNaN(toBoundary.getTime()) ? undefined : toBoundary,
    },
    departmentId: filters.departmentId === "ALL" ? undefined : filters.departmentId,
    status: filters.status === "ALL" ? undefined : filters.status,
  };
}
