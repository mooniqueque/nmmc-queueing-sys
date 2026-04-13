import { useAnnouncementQueue } from "@/features/monitoring/hooks/use-announcement-queue";
import { API_URL } from "@/lib/api";
import { SSE_TOPICS, SseEventType, SseMessage } from "@/shared/lib/sse";
import { useCallback, useEffect, useState } from "react";

const BACKEND_URL = API_URL;

export interface WindowStatus {
    stationNo: number;
    windowName: string;
    triageTicket?: string | null;
    serviceTicket?: string | null;
    displayTicket: string | null;
    classification?: string | null;
    priorityClass?: string | null;
    calledAt: string | null;
}

function toDisplayWindow(window: Partial<WindowStatus>): WindowStatus {
    return {
        stationNo: window.stationNo ?? 0,
        windowName: window.windowName ?? "",
        triageTicket: window.triageTicket ?? null,
        serviceTicket: window.serviceTicket ?? null,
        displayTicket: window.displayTicket ?? window.serviceTicket ?? window.triageTicket ?? null,
        classification: window.classification ?? null,
        priorityClass: window.priorityClass ?? null,
        calledAt: window.calledAt ?? null,
    };
}

function upsertWindowByStation(items: WindowStatus[], nextWindow: WindowStatus) {
    const index = items.findIndex((item) => item.stationNo === nextWindow.stationNo);
    if (index === -1) {
        return [...items, nextWindow].sort((left, right) => left.stationNo - right.stationNo);
    }

    const cloned = [...items];
    cloned[index] = nextWindow;
    return cloned.sort((left, right) => left.stationNo - right.stationNo);
}

function clearWindowByStation(items: WindowStatus[], stationNo: number) {
    return items.map((item) => {
        if (item.stationNo !== stationNo) return item;
        return {
            ...item,
            displayTicket: null,
            classification: null,
            priorityClass: null,
            calledAt: null,
        };
    });
}

export function useWindowMonitor(slugOrId?: string) {
    const [windows, setWindows] = useState<WindowStatus[]>([]);
    const [upcoming, setUpcoming] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentAnnouncement, enqueueAnnouncement } = useAnnouncementQueue();

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
                    setWindows((json.data.active || []).map(toDisplayWindow));
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
        const topic = slugOrId
            ? SSE_TOPICS.monitorDepartment(slugOrId)
            : SSE_TOPICS.MONITOR_WINDOWS;
        const eventSource = new EventSource(`${BACKEND_URL}/monitor/stream?topic=${topic}`, { withCredentials: true });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as SseMessage<{
                    active?: WindowStatus[];
                    upcoming?: string[];
                    window?: WindowStatus;
                    stationNo?: number;
                }>;
                if (data.type === SseEventType.MONITOR_SNAPSHOT && data.payload) {
                    setWindows((data.payload.active || []).map(toDisplayWindow));
                    setUpcoming(data.payload.upcoming || []);
                    setLoading(false);
                    return;
                }

                if (data.type === SseEventType.MONITOR_UPSERT && data.payload?.window) {
                    setWindows((current) => upsertWindowByStation(current, toDisplayWindow(data.payload!.window!)));
                    setLoading(false);

                    if (data.payload.window.displayTicket) {
                        enqueueAnnouncement({
                            ticket: data.payload.window.displayTicket,
                            windowName: data.payload.window.windowName,
                            stationNo: data.payload.window.stationNo,
                            calledAt: data.payload.window.calledAt,
                        });
                    }
                    return;
                }

                if (data.type === SseEventType.MONITOR_REMOVE && typeof data.payload?.stationNo === "number") {
                    setWindows((current) => clearWindowByStation(current, data.payload!.stationNo!));
                    setLoading(false);
                    return;
                }

                if (data.type === SseEventType.MONITOR_UPCOMING && data.payload?.upcoming) {
                    setUpcoming(data.payload.upcoming);
                    setLoading(false);
                }
            } catch (error) {
                console.error("SSE Parse Error:", error);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [fetchStatus, slugOrId]);

    return { windows, upcoming, loading, currentAnnouncement };
}
