"use client";

import { apiClient } from "@/lib/api";
import type { AnalyticsResponse, AnalyticsScope } from "@nmmc/types";
import { useCallback, useEffect, useState } from "react";

const EMPTY_DATA: AnalyticsResponse = {
    kpis: {
        totalToday: 0,
        currentlyWaiting: 0,
        avgProcessingMinutes: 0,
        completedToday: 0,
        noShowCount: 0,
        peakHourLabel: "-",
        avgKioskToWindowMinutes: 0,
        avgWindowToClinicMinutes: 0,
    },
    hourlyVolume: [],
    classificationBreakdown: [],
    departmentPriorityBreakdown: [],
    departmentBreakdown: [],
    staffBreakdown: [],
    statusDistribution: [],
    recentHistory: [],
    generatedAt: new Date().toISOString(),
};

export function useAnalytics(scope: AnalyticsScope, departmentId?: string, userId?: string) {
    const [data, setData] = useState<AnalyticsResponse>(EMPTY_DATA);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        try {
            const params = new URLSearchParams({ scope });
            if (departmentId && departmentId !== "ALL") params.set("departmentId", departmentId);
            if (userId) params.set("userId", userId);

            const response = await apiClient<AnalyticsResponse>(
                `/shared/analytics?${params.toString()}`,
                {
                    credentials: "include",
                    signal,
                }
            );
            if (response.data) {
                setData(response.data);
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
