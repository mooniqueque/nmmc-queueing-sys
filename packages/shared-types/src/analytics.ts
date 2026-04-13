import type { VisitClassification, VisitStatus } from "./enums";

export type AnalyticsScope = "triage" | "window" | "clinic" | "all";

export interface AnalyticsQueryDto {
    scope: AnalyticsScope;
    departmentId?: string;
    fromDate?: string;
    toDate?: string;
    userId?: string;
}

export interface AnalyticsDurationRow {
    avgProcessing: number | null;
    avgKioskToWindow: number | null;
    avgWindowToClinic: number | null;
}

export interface AnalyticsHourlyRow {
    hour: number;
    count: number;
}

export interface AnalyticsStaffGroupRow {
    triagedByUserId?: string | null;
    windowClaimedById?: string | null;
    calledByUserId?: string | null;
    _count: { _all: number };
}

export interface AnalyticsKpis {
    totalToday: number;
    currentlyWaiting: number;
    avgProcessingMinutes: number;
    completedToday: number;
    noShowCount: number;
    peakHourLabel: string;
    avgKioskToWindowMinutes: number;
    avgWindowToClinicMinutes: number;
}

export interface AnalyticsHourlyVolume {
    hour: string;
    patients: number;
}

export interface AnalyticsClassificationBreakdown {
    name: VisitClassification | "REGULAR";
    count: number;
}

export interface AnalyticsDepartmentBreakdown {
    department: string;
    patients: number;
}

export interface AnalyticsDepartmentPriorityBreakdown {
    departmentId: string | null;
    department: string;
    classification: VisitClassification | "REGULAR";
    patients: number;
}

export interface AnalyticsStaffBreakdown {
    name: string;
    count: number;
}

export interface AnalyticsStatusDistribution {
    status: VisitStatus | string;
    count: number;
}

export interface AnalyticsHistoryItem {
    id: string;
    triageTicket: number | null;
    serviceTicket: number | null;
    patientName: string;
    status: string;
    timestamp: string;
    classification: VisitClassification | string;
    department: string;
}

export interface AnalyticsResponse {
    kpis: AnalyticsKpis;
    hourlyVolume: AnalyticsHourlyVolume[];
    classificationBreakdown: AnalyticsClassificationBreakdown[];
    departmentPriorityBreakdown: AnalyticsDepartmentPriorityBreakdown[];
    departmentBreakdown: AnalyticsDepartmentBreakdown[];
    staffBreakdown: AnalyticsStaffBreakdown[];
    statusDistribution: AnalyticsStatusDistribution[];
    recentHistory: AnalyticsHistoryItem[];
    generatedAt: string;
}
