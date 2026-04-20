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
    const { windows, upcoming, loading, currentAnnouncement } = useWindowMonitor(slug);
    const [departmentName, setDepartmentName] = useState("LOADING...");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/monitor/departments-videos`)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    const dept = json.data.find((d: { slug: string; id: string; name: string; videoUrl: string }) => d.slug === slug || d.id === slug);
                    if (dept) {
                        setDepartmentName(dept.name.toUpperCase());
                        setVideoUrl(dept.videoUrl || null);
                    }
                }
            });
    }, [slug]);

    return (
        <div className="h-screen w-full overflow-hidden font-sans text-slate-900">
            <CallOverlay callData={currentAnnouncement} />
            <MonitorDisplayShell
                brandTitle={departmentName === "LOADING..." ? "DEPARTMENT" : departmentName}
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

