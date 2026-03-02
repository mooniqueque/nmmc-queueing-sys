"use client";

import { VisitWithPatient } from "@/app/(staffs)/triage/_types";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function useClinicQueue(departmentId: string, initialQueue: VisitWithPatient[]) {
    const router = useRouter();
    // In a real scenario we might filter this locally or rely on the backend strictly returning WAITING_CLINIC for this department
    const activeQueue = initialQueue;
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!departmentId) return;

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        // Subscribe to the specific department topic
        const eventSource = new EventSource(`${backendUrl}/monitor/stream?topic=${departmentId}`, {
            withCredentials: true
        });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'queue-updated') {
                    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
                    refreshTimeoutRef.current = setTimeout(() => router.refresh(), 1000);
                }
            } catch (error) {
                console.error("Failed to parse SSE message:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE connection error:", error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        };
    }, [router, departmentId]);

    return { activeQueue };
}
