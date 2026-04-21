"use client";

import { CallOverlay } from "@/features/monitoring/components/call-overlay";
import MonitorDisplayShell from "@/features/monitoring/components/monitor-display-shell";
import { useWindowMonitor } from "@/features/monitoring/hooks/use-window-monitor";
import { API_URL } from "@/lib/api";
import { useCurrentTime } from "@/shared/hooks/use-current-time";
import { useEffect, useState } from "react";

export default function WindowMonitor() {
    const currentTime = useCurrentTime();
    const { windows, previousNumbers, upcoming, currentAnnouncement } = useWindowMonitor();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/monitor/departments-videos`)
            .then((res) => res.json())
            .then((json) => {
                if (!json.success || !json.data) return;
                const dept = json.data.find((item: { name: string; videoUrl: string | null }) => item.name === "REGISTRATION");
                setVideoUrl(dept?.videoUrl ?? null);
            })
            .catch((err) => console.error("Failed to load department video", err));
    }, []);

    return (
        <>
            <CallOverlay callData={currentAnnouncement} />
            <MonitorDisplayShell
                brandTitle="Northern Mindanao Medical Center"
                brandSubtitle="Cashier / Registration Windows"
                queueEmptyLabel="No active windows"
                upcomingEmptyLabel="No upcoming numbers"
                windows={windows}
                previousNumbers={previousNumbers}
                upcoming={upcoming}
                currentTime={currentTime}
                videoUrl={videoUrl}
                videoFallbackLabel="Awaiting Video Loop"
            />
        </>
    );
}
