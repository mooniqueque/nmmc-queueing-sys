import { API_URL } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

const BACKEND_URL = API_URL;

export interface WindowStatus {
    stationNo: number;
    windowName: string;
    ticketNumber: string | null;
    priorityClass: string | null;
    calledAt: string | null;
}

export function useWindowMonitor(slugOrId?: string) {
    const [windows, setWindows] = useState<WindowStatus[]>([]);
    const [upcoming, setUpcoming] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const endpoint = slugOrId
                ? `${BACKEND_URL}/monitor/department/${slugOrId}`
                : `${BACKEND_URL}/monitor/windows`;

            // Add a cache-busting query param to prevent stale browser/proxy responses.
            const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}ts=${Date.now()}`;
            const res = await fetch(url, {
                cache: "no-store",
                credentials: "include",
            });
            const json = await res.json();
            if (json.success) {
                // Determine if backend returned new object format or old array format
                if (Array.isArray(json.data)) {
                    setWindows(json.data);
                } else if (json.data && json.data.active) {
                    setWindows(json.data.active);
                    setUpcoming(json.data.upcoming || []);
                }
            }
        } catch (error) {
            console.error("Monitor Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [slugOrId]);

    useEffect(() => {
        fetchStatus();
        const topic = slugOrId || 'WINDOW';
        const eventSource = new EventSource(`${BACKEND_URL}/monitor/stream?topic=${topic}`, { withCredentials: true });

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
    }, [fetchStatus, slugOrId]);

    return { windows, upcoming, loading };
}
