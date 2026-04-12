"use client";

import { uploadMonitorVideo } from "@/features/monitoring/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/shared/lib/notify";
import { AdminHeader } from "@/shared/layouts";
import { SessionUser } from "@/shared/types/auth";
import { Department } from "@/shared/types/models";
import { ArrowSquareOut, Desktop, SpinnerGap, UploadSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function QueueMonitor({
    departments,
    loggedInUser,
}: {
    departments: Department[];
    loggedInUser: SessionUser;
}) {
    const router = useRouter();
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [uploadingDepartmentId, setUploadingDepartmentId] = useState<string | null>(null);
    const sortedDepartments = [...departments].sort((a, b) => a.name.localeCompare(b.name));

    const openUploadPicker = (departmentId: string) => {
        inputRefs.current[departmentId]?.click();
    };

    const handleUploadForDepartment = async (department: Department, file: File | null) => {
        if (!file) return;

        if (file.type !== "video/mp4") {
            notify.error("Only MP4 files are allowed");
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            notify.error("File size must be under 100MB");
            return;
        }

        setUploadingDepartmentId(department.id);
        try {
            const result = await uploadMonitorVideo(department.id, file, {
                credentials: "include",
            });
            if (result?.success) {
                notify.success("Video uploaded successfully", {
                    description: `${department.name} monitor video is now connected. Open the monitor to verify playback.`,
                });
                router.refresh();
            } else {
                notify.error(result?.error || "Upload failed");
            }
        } catch {
            notify.error("An error occurred during upload");
        } finally {
            setUploadingDepartmentId(null);
            const input = inputRefs.current[department.id];
            if (input) input.value = "";
        }
    };

    return (
        <div className="w-full h-screen bg-background flex flex-col overflow-hidden">
            <AdminHeader
                user={loggedInUser}
                title="Queue Monitor"
                subtitle="Monitor Links & Video Settings"
            />

            <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">
                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Display Monitors</CardTitle>
                        <CardDescription>
                            Open any monitor in a new tab and upload the department loop directly from each row.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <a href="/monitor-windows" target="_blank" rel="noopener noreferrer" className="block">
                            <Button variant="outline" className="w-full justify-between h-12">
                                <span className="inline-flex items-center gap-2 font-semibold">
                                    <Desktop size={16} />
                                    Window Monitor Display
                                </span>
                                <ArrowSquareOut size={16} />
                            </Button>
                        </a>

                        {sortedDepartments.map((department) => {
                            const isUploading = uploadingDepartmentId === department.id;

                            return (
                                <div
                                    key={department.id}
                                    className="flex items-center justify-between rounded-md border border-input bg-background h-12 px-3"
                                >
                                    <a
                                        href={`/monitor/${department.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold truncate pr-2"
                                    >
                                        {department.name}
                                    </a>

                                    <div className="flex items-center gap-1">
                                        <input
                                            ref={(el) => {
                                                inputRefs.current[department.id] = el;
                                            }}
                                            type="file"
                                            accept="video/mp4"
                                            className="hidden"
                                            onChange={(event) => {
                                                const selectedFile = event.target.files?.[0] ?? null;
                                                void handleUploadForDepartment(department, selectedFile);
                                            }}
                                        />

                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            disabled={isUploading}
                                            onClick={() => openUploadPicker(department.id)}
                                            aria-label={`Upload monitor video for ${department.name}`}
                                            title={`Upload monitor video for ${department.name}`}
                                        >
                                            {isUploading ? (
                                                <SpinnerGap size={16} className="animate-spin" />
                                            ) : (
                                                <UploadSimple size={16} />
                                            )}
                                        </Button>

                                        <a
                                            href={`/monitor/${department.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex"
                                            aria-label={`Open ${department.name} monitor`}
                                            title={`Open ${department.name} monitor`}
                                        >
                                            <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                                                <ArrowSquareOut size={16} />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
