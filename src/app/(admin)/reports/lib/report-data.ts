import { db } from "@/lib/database/prisma";
import type { Prisma } from "@prisma/client";
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

export async function getReportVisits(where?: Prisma.VisitWhereInput): Promise<ReportVisitRecord[]> {
  const visits = await db.visit.findMany({
    where,
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return visits.map((visit) => ({
    id: visit.id,
    status: visit.status,
    createdAt: visit.createdAt.toISOString(),
    updatedAt: visit.updatedAt.toISOString(),
    queueDate: visit.queueDate.toISOString(),
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
  const statuses = await db.visit.findMany({
    distinct: ["status"],
    select: {
      status: true,
    },
    orderBy: {
      status: "asc",
    },
  });

  const filteredVisits = filterVisits(visits, normalizedFilters);

  return {
    filters: normalizedFilters,
    availableStatuses: statuses.map((item) => item.status),
    metrics: buildSummaryMetrics(filteredVisits),
    departmentData: buildPatientsPerDepartment(filteredVisits),
    hourlyData: buildHourlyVolume(filteredVisits),
    statusData: buildStatusDistribution(filteredVisits),
    dailyTrendData: buildDailyTrend(filteredVisits),
    generatedAt: new Date().toISOString(),
  };
}

function buildVisitWhere(filters: ReportFilters): Prisma.VisitWhereInput {
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
