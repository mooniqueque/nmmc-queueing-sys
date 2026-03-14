"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface WindowStatus {
    stationNo: number;
    windowName: string;
    ticketNumber: string | null;
    priorityClass: string | null;
}

export function useWindowMonitor() {
    const [windows, setWindows] = useState<WindowStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/monitor/windows`);
            const json = await res.json();
            if (json.success) {
                setWindows(json.data);
            }
        } catch (error) {
            console.error("Monitor Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Setup SSE for real-time updates
        const eventSource = new EventSource(`${BACKEND_URL}/monitor/stream`, { withCredentials: true });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'queue-updated') {
                    fetchStatus();
                }
            } catch (error) {
                console.error("SSE Parse Error:", error);
            }
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return { windows, loading };
}
