"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AnnouncementItem {
    ticket: string;
    windowName: string;
    stationNo?: number | null;
    calledAt: string | null;
}

const DEFAULT_DISPLAY_MS = 5000;

function getAnnouncementKey(item: AnnouncementItem) {
    return `${item.calledAt ?? "0"}:${item.ticket}:${item.windowName}:${item.stationNo ?? "x"}`;
}

function getAnnouncementTime(item: AnnouncementItem) {
    return item.calledAt ? new Date(item.calledAt).getTime() : 0;
}

export function useAnnouncementQueue(displayMs = DEFAULT_DISPLAY_MS) {
    const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementItem | null>(null);
    const queueRef = useRef<AnnouncementItem[]>([]);
    const activeRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const seenKeysRef = useRef<string[]>([]);

    const processQueue = useCallback(() => {
        if (activeRef.current) return;

        const next = queueRef.current.shift();
        if (!next) return;

        activeRef.current = true;
        setCurrentAnnouncement(next);

        timeoutRef.current = setTimeout(() => {
            activeRef.current = false;
            setCurrentAnnouncement(null);
            processQueue();
        }, displayMs);
    }, [displayMs]);

    const enqueueAnnouncement = useCallback((item: AnnouncementItem) => {
        const key = getAnnouncementKey(item);
        if (seenKeysRef.current.includes(key)) {
            return;
        }

        seenKeysRef.current = [...seenKeysRef.current.slice(-199), key];
        queueRef.current = [...queueRef.current, item].sort((left, right) => {
            const timeDelta = getAnnouncementTime(left) - getAnnouncementTime(right);
            if (timeDelta !== 0) return timeDelta;
            return getAnnouncementKey(left).localeCompare(getAnnouncementKey(right));
        });

        processQueue();
    }, [processQueue]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { currentAnnouncement, enqueueAnnouncement };
}
