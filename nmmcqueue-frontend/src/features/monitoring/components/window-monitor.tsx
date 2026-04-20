"use client";

import { CallOverlay } from "@/features/monitoring/components/call-overlay";
import MonitorDisplayShell from "@/features/monitoring/components/monitor-display-shell";
import { useWindowMonitor } from "@/features/monitoring/hooks/use-window-monitor";
import { API_URL } from "@/lib/api";
import { useCurrentTime } from "@/shared/hooks/use-current-time";
import { useEffect, useState } from "react";

export default function WindowMonitor() {
    const currentTime = useCurrentTime();
    const { windows, upcoming, loading, currentAnnouncement } = useWindowMonitor();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        // Fetch securely from the Public monitor API
        fetch(`${API_URL}/monitor/departments-videos`)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    const dept = json.data.find((d: { name: string; videoUrl: string }) => d.name === 'REGISTRATION');
                    if (dept) setVideoUrl(dept.videoUrl || null);
                }
            })
            .catch(err => console.error("Failed to load department video", err));
    }, []);

    return (
        <div className="h-screen w-full overflow-hidden font-sans text-slate-900">
            <CallOverlay callData={currentAnnouncement} />
            <MonitorDisplayShell
                brandTitle="CASHIER / REGISTRATION WINDOWS"
                brandSubtitle="Northern Mindanao Medical Center"
                queueEmptyLabel={loading ? "Loading monitor..." : "No previous calls yet."}
                upcomingEmptyLabel="No upcoming numbers."
                windows={windows}
                upcoming={upcoming}
                currentTime={currentTime}
                videoUrl={videoUrl}
                videoFallbackLabel="Awaiting Video Loop"
            />
        </div>
    );
}
