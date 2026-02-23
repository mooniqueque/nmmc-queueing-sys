import type { ReportVisitRecord } from "./report-data";

export type ReportFilters = {
  fromDate: string;
  toDate: string;
  departmentId: string;
  status: string;
};

export type SummaryMetrics = {
  totalServed: number;
  averageWaitingMinutes: number;
  averageServiceMinutes: number;
  peakHourLabel: string;
  busiestDepartment: string;
};

export type DepartmentChartRow = {
  department: string;
  patients: number;
};

export type HourlyChartRow = {
  hour: string;
  patients: number;
};

export type StatusChartRow = {
  status: string;
  count: number;
};

export type DailyTrendRow = {
  day: string;
  patients: number;
};

const CALLED_STATUSES = new Set(["WAITING_CLINIC", "COMPLETED", "NO_SHOW"]);

export function getDefaultDateRange() {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - 29);

  return {
    fromDate: toDateInputValue(from),
    toDate: toDateInputValue(today),
  };
}

export function filterVisits(visits: ReportVisitRecord[], filters: ReportFilters): ReportVisitRecord[] {
  const fromBoundary = getStartOfDay(filters.fromDate);
  const toBoundary = getEndOfDay(filters.toDate);

  return visits.filter((visit) => {
    const createdAt = new Date(visit.createdAt);
    const isWithinDateRange = createdAt >= fromBoundary && createdAt <= toBoundary;
    const matchesDepartment = filters.departmentId === "ALL" || visit.departmentId === filters.departmentId;
    const matchesStatus = filters.status === "ALL" || visit.status === filters.status;

    return isWithinDateRange && matchesDepartment && matchesStatus;
  });
}

export function buildSummaryMetrics(filteredVisits: ReportVisitRecord[]): SummaryMetrics {
  const totalServed = filteredVisits.filter((visit) => visit.status === "COMPLETED").length;

  const waitingDurations = filteredVisits
    .filter((visit) => CALLED_STATUSES.has(visit.status))
    .map((visit) => getMinutesDiff(visit.createdAt, visit.updatedAt))
    .filter((minutes) => minutes >= 0);

  const serviceDurations = filteredVisits
    .filter((visit) => visit.status === "COMPLETED")
    .map((visit) => getMinutesDiff(visit.queueDate, visit.updatedAt))
    .filter((minutes) => minutes >= 0);

  const averageWaitingMinutes = getAverage(waitingDurations);
  const averageServiceMinutes = getAverage(serviceDurations);

  const hourlyVolume = buildHourlyVolume(filteredVisits);
  const peakHour = hourlyVolume.reduce<HourlyChartRow | null>((winner, currentRow) => {
    if (!winner || currentRow.patients > winner.patients) {
      return currentRow;
    }
    return winner;
  }, null);

  const departmentLoad = buildPatientsPerDepartment(filteredVisits);
  const busiestDepartment = departmentLoad.reduce<DepartmentChartRow | null>((winner, currentRow) => {
    if (!winner || currentRow.patients > winner.patients) {
      return currentRow;
    }
    return winner;
  }, null);

  return {
    totalServed,
    averageWaitingMinutes,
    averageServiceMinutes,
    peakHourLabel: peakHour ? `${peakHour.hour}:00` : "—",
    busiestDepartment: busiestDepartment?.department ?? "—",
  };
}

export function buildPatientsPerDepartment(filteredVisits: ReportVisitRecord[]): DepartmentChartRow[] {
  const counts = new Map<string, number>();

  for (const visit of filteredVisits) {
    counts.set(visit.departmentName, (counts.get(visit.departmentName) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([department, patients]) => ({ department, patients }))
    .sort((a, b) => b.patients - a.patients);
}

export function buildHourlyVolume(filteredVisits: ReportVisitRecord[]): HourlyChartRow[] {
  const countsByHour = new Map<number, number>();

  for (let hour = 0; hour < 24; hour += 1) {
    countsByHour.set(hour, 0);
  }

  for (const visit of filteredVisits) {
    const hour = new Date(visit.createdAt).getHours();
    countsByHour.set(hour, (countsByHour.get(hour) ?? 0) + 1);
  }

  return Array.from(countsByHour.entries()).map(([hour, patients]) => ({
    hour: hour.toString().padStart(2, "0"),
    patients,
  }));
}

export function buildStatusDistribution(filteredVisits: ReportVisitRecord[]): StatusChartRow[] {
  const counts = new Map<string, number>();

  for (const visit of filteredVisits) {
    counts.set(visit.status, (counts.get(visit.status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildDailyTrend(filteredVisits: ReportVisitRecord[]): DailyTrendRow[] {
  const countsByDay = new Map<string, number>();

  for (const visit of filteredVisits) {
    const dayKey = toDateInputValue(new Date(visit.createdAt));
    countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
  }

  return Array.from(countsByDay.entries())
    .map(([day, patients]) => ({ day, patients }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function getAverage(numbers: number[]): number {
  if (!numbers.length) {
    return 0;
  }

  const total = numbers.reduce((sum, current) => sum + current, 0);
  return Number((total / numbers.length).toFixed(1));
}

function getMinutesDiff(fromIsoDate: string, toIsoDate: string): number {
  const diffMs = new Date(toIsoDate).getTime() - new Date(fromIsoDate).getTime();
  return Math.round(diffMs / (1000 * 60));
}

function getStartOfDay(yyyyMmDd: string): Date {
  const date = new Date(`${yyyyMmDd}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function getEndOfDay(yyyyMmDd: string): Date {
  const date = new Date(`${yyyyMmDd}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}
