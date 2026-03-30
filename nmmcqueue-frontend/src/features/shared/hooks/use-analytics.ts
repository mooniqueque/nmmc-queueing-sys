"use client";

import { useEffect, useState, useCallback } from "react";
import { API_URL } from "@/lib/api";

export type AnalyticsScope = "triage" | "window" | "clinic" | "all";

export interface AnalyticsKPIs {
    totalToday: number;
    currentlyWaiting: number;
    avgProcessingMinutes: number;
    completedToday: number;
    noShowCount: number;
    peakHourLabel: string;
}

export interface HistoryItem {
    id: string;
    ticketNumber: number | null;
    patientName: string;
    status: string;
    timestamp: string;
    classification: string;
    department: string;
}

export interface AnalyticsData {
    kpis: AnalyticsKPIs;
    hourlyVolume: { hour: string; patients: number }[];
    classificationBreakdown: { name: string; count: number }[];
    departmentBreakdown: { department: string; patients: number }[];
    statusDistribution: { status: string; count: number }[];
    recentHistory: HistoryItem[];
    generatedAt: string;
}

const EMPTY_DATA: AnalyticsData = {
    kpis: { totalToday: 0, currentlyWaiting: 0, avgProcessingMinutes: 0, completedToday: 0, noShowCount: 0, peakHourLabel: "—" },
    hourlyVolume: [],
    classificationBreakdown: [],
    departmentBreakdown: [],
    statusDistribution: [],
    recentHistory: [],
    generatedAt: new Date().toISOString(),
};

export function useAnalytics(scope: AnalyticsScope, departmentId?: string, userId?: string) {
    const [data, setData] = useState<AnalyticsData>(EMPTY_DATA);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        try {
            const params = new URLSearchParams({ scope });
            if (departmentId && departmentId !== "ALL") params.set("departmentId", departmentId);
            if (userId) params.set("userId", userId);

            const res = await fetch(`${API_URL}/shared/analytics?${params.toString()}`, {
                credentials: "include",
                signal,
            });
            if (!res.ok) return;
            const json = await res.json();
            if (json.success && json.data) {
                setData(json.data);
            }
        } catch {
            // Silently ignore abort errors
        } finally {
            setIsLoading(false);
        }
    }, [scope, departmentId, userId]);

    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        fetchData(controller.signal);

        const interval = setInterval(() => fetchData(controller.signal), 15000);
        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, [fetchData]);

    return { data, isLoading };
}
