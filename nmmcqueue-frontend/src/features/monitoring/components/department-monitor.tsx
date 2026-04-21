"use client";

import { CallOverlay } from "@/features/monitoring/components/call-overlay";
import MonitorDisplayShell from "@/features/monitoring/components/monitor-display-shell";
import { useWindowMonitor } from "@/features/monitoring/hooks/use-window-monitor";
import { API_URL } from "@/lib/api";
import { useCurrentTime } from "@/shared/hooks/use-current-time";
import { useEffect, useState } from "react";

interface DepartmentMonitorProps {
    slug: string;
}

export default function DepartmentMonitor({ slug }: DepartmentMonitorProps) {
    const currentTime = useCurrentTime();
    const { windows, previousNumbers, upcoming, currentAnnouncement } = useWindowMonitor(slug);
    const [departmentName, setDepartmentName] = useState("LOADING...");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/monitor/departments-videos`)
            .then((res) => res.json())
            .then((json) => {
                if (!json.success || !json.data) return;
                const dept = json.data.find((item: { slug: string; id: string; name: string; videoUrl: string | null }) => item.slug === slug || item.id === slug);
                if (!dept) return;
                setDepartmentName(dept.name.toUpperCase());
                setVideoUrl(dept.videoUrl ?? null);
            })
            .catch((err) => console.error("Failed to load department metadata", err));
    }, [slug]);

    return (
        <>
            <CallOverlay callData={currentAnnouncement} />
            <MonitorDisplayShell
                brandTitle="Northern Mindanao Medical Center"
                brandSubtitle={departmentName}
                queueEmptyLabel="No active stations"
                upcomingEmptyLabel="No upcoming patients"
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
