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

export interface UseWindowMonitorResult {
    windows: WindowStatus[];
    upcoming: string[];
    previousNumbers: WindowStatus[];
    loading: boolean;
    currentAnnouncement: ReturnType<typeof useAnnouncementQueue>["currentAnnouncement"];
}

function toDisplayWindow(window: Partial<WindowStatus>): WindowStatus {
    const stationNoCandidate = (window as Partial<WindowStatus> & { windowNumber?: number | null }).windowNumber;
    const stationNo = window.stationNo ?? stationNoCandidate ?? 0;
    const triageTicket = window.triageTicket ?? null;
    const serviceTicket = window.serviceTicket ?? null;
    const displayTicket = window.displayTicket ?? serviceTicket ?? triageTicket ?? null;

    return {
        stationNo,
        windowName: window.windowName ?? "",
        triageTicket,
        serviceTicket,
        displayTicket,
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

function sortByCalledAtDesc(left: WindowStatus, right: WindowStatus) {
    const leftTime = left.calledAt ? new Date(left.calledAt).getTime() : 0;
    const rightTime = right.calledAt ? new Date(right.calledAt).getTime() : 0;
    if (leftTime !== rightTime) return rightTime - leftTime;
    return left.stationNo - right.stationNo;
}

function getWindowIdentity(window: WindowStatus) {
    if (window.stationNo > 0) return `station:${window.stationNo}`;
    return `name:${window.windowName.trim().toUpperCase()}`;
}

function upsertRecentByCall(current: WindowStatus[], next: WindowStatus) {
    if (!next.displayTicket) return current;

    const nextIdentity = getWindowIdentity(next);
    const withoutSameCall = current.filter((item) => {
        const itemIdentity = getWindowIdentity(item);
        return !(itemIdentity === nextIdentity && item.displayTicket === next.displayTicket);
    });

    // Activity-log behavior: newest at top, older rows pushed down.
    return [next, ...withoutSameCall].slice(0, 5);
}

function buildRecentNumbers(items: WindowStatus[]) {
    return [...items]
        .filter((window) => Boolean(window.displayTicket))
        .sort(sortByCalledAtDesc)
        .slice(0, 5);
}

export function useWindowMonitor(slugOrId?: string): UseWindowMonitorResult {
    const [windows, setWindows] = useState<WindowStatus[]>([]);
    const [upcoming, setUpcoming] = useState<string[]>([]);
    const [previousNumbers, setPreviousNumbers] = useState<WindowStatus[]>([]);
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
                    const nextWindows = json.data.map(toDisplayWindow);
                    setWindows(nextWindows);
                    setPreviousNumbers((current) => (current.length > 0 ? current : buildRecentNumbers(nextWindows)));
                } else if (json.data && json.data.active) {
                    const nextWindows = (json.data.active || []).map(toDisplayWindow);
                    setWindows(nextWindows);
                    // Prefer recentCalls from backend; fall back to buildRecentNumbers(active) if not available
                    const recentCallsFromApi = (json.data.recentCalls || []).map(toDisplayWindow);
                    setPreviousNumbers((current) => {
                        if (current.length > 0) return current; // Keep session memory during navigation
                        if (recentCallsFromApi.length > 0) return recentCallsFromApi; // Hydrate from backend
                        return buildRecentNumbers(nextWindows); // Fallback to derive from active
                    });
                    if (Array.isArray(json.data.upcoming)) {
                        setUpcoming(json.data.upcoming);
                    }
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
                    recentCalls?: WindowStatus[];
                    window?: WindowStatus;
                    stationNo?: number;
                }>;
                if (data.type === SseEventType.MONITOR_SNAPSHOT && data.payload) {
                    const nextWindows = (data.payload.active || []).map(toDisplayWindow);
                    setWindows(nextWindows);
                    // Prefer recentCalls from SSE snapshot; fall back to buildRecentNumbers(active) if not available
                    const recentCallsFromSse = (data.payload.recentCalls || []).map(toDisplayWindow);
                    setPreviousNumbers((current) => {
                        if (current.length > 0) return current; // Keep session memory during snapshot
                        if (recentCallsFromSse.length > 0) return recentCallsFromSse; // Hydrate from SSE
                        return buildRecentNumbers(nextWindows); // Fallback to derive from active
                    });
                    if (Array.isArray(data.payload.upcoming)) {
                        setUpcoming(data.payload.upcoming);
                    }
                    setLoading(false);
                    return;
                }

                if (data.type === SseEventType.MONITOR_UPSERT && data.payload?.window) {
                    const nextWindow = toDisplayWindow(data.payload.window);
                    setWindows((current) => upsertWindowByStation(current, nextWindow));
                    if (nextWindow.displayTicket) {
                        setPreviousNumbers((current) => upsertRecentByCall(current, nextWindow));
                    }
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

    return { windows, upcoming, previousNumbers, loading, currentAnnouncement };
}
