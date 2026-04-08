"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

export interface TriageSnapshot {
  date: string;
  totals: {
    totalTicketsGenerated: number;
    priorityCount: number;
    regularCount: number;
    abandonedBeforeWindow: number;
  };
  ticketsPerDepartment: {
    departmentId: string | null;
    departmentName: string;
    count: number;
  }[];
  generatedAt: string;
}

export interface WindowSnapshot {
  date: string;
  totals: {
    totalAssignedToClinics: number;
    totalWindowCalls: number;
    windowNoShowCount: number;
    windowNoShowRate: number;
    avgWindowProcessingMinutes: number;
  };
  processedPerStation: {
    stationNo: number;
    count: number;
  }[];
  generatedAt: string;
}

export interface ClinicSnapshot {
  date: string;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  totals: {
    totalPatientsServed: number;
    avgWaitMinutes: number;
    avgServeMinutes: number;
    transferCount: number;
    transferRate: number;
    clinicNoShowCount: number;
  };
  generatedAt: string;
}

const EMPTY_TRIAGE: TriageSnapshot = {
  date: "",
  totals: {
    totalTicketsGenerated: 0,
    priorityCount: 0,
    regularCount: 0,
    abandonedBeforeWindow: 0,
  },
  ticketsPerDepartment: [],
  generatedAt: "",
};

const EMPTY_WINDOW: WindowSnapshot = {
  date: "",
  totals: {
    totalAssignedToClinics: 0,
    totalWindowCalls: 0,
    windowNoShowCount: 0,
    windowNoShowRate: 0,
    avgWindowProcessingMinutes: 0,
  },
  processedPerStation: [],
  generatedAt: "",
};

const EMPTY_CLINIC: ClinicSnapshot = {
  date: "",
  department: null,
  totals: {
    totalPatientsServed: 0,
    avgWaitMinutes: 0,
    avgServeMinutes: 0,
    transferCount: 0,
    transferRate: 0,
    clinicNoShowCount: 0,
  },
  generatedAt: "",
};

function buildUrl(path: string, date: string, departmentId?: string) {
  const params = new URLSearchParams({ date });
  if (departmentId) params.set("departmentId", departmentId);
  return `${API_URL}/analytics/${path}?${params.toString()}`;
}

function useSnapshot<T>(path: string, date: string, fallback: T, departmentId?: string, enabled = true) {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) {
      setIsLoading(false);
      setData(fallback);
      return;
    }

    try {
      const res = await fetch(buildUrl(path, date, departmentId), {
        credentials: "include",
        signal,
      });

      if (!res.ok) {
        return;
      }

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      // ignore aborted fetches
    } finally {
      setIsLoading(false);
    }
  }, [date, departmentId, enabled, fallback, path]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    fetchData(controller.signal);

    const intervalId = window.setInterval(() => {
      fetchData(controller.signal);
    }, 15000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [fetchData]);

  return { data, isLoading };
}

export function useTriageSnapshot(date: string) {
  return useSnapshot("triage-snapshot", date, EMPTY_TRIAGE);
}

export function useWindowSnapshot(date: string) {
  return useSnapshot("window-snapshot", date, EMPTY_WINDOW);
}

export function useClinicSnapshot(date: string, departmentId?: string, enabled = true) {
  return useSnapshot("clinic-snapshot", date, EMPTY_CLINIC, departmentId, enabled);
}
