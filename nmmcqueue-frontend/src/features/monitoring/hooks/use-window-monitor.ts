import { useCallback, useEffect, useState } from "react";

import { API_URL } from "@/lib/api";

const BACKEND_URL = API_URL;

interface WindowStatus {
    stationNo: number;
    windowName: string;
    ticketNumber: string | null;
    priorityClass: string | null;
}

export function useWindowMonitor(slugOrId?: string) {
    const [windows, setWindows] = useState<WindowStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const endpoint = slugOrId 
                ? `${BACKEND_URL}/monitor/department/${slugOrId}`
                : `${BACKEND_URL}/monitor/windows`;
                
            const res = await fetch(endpoint);
            const json = await res.json();
            if (json.success) {
                setWindows(json.data);
            }
        } catch (error) {
            console.error("Monitor Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [slugOrId]);

    useEffect(() => {
        fetchStatus();

        // Setup SSE for real-time updates
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

    return { windows, loading };
}
