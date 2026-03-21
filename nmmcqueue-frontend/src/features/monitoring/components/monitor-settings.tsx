"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { 
    VideoCamera, 
    Upload, 
    CheckCircle, 
    Info, 
    CaretUpDown,
    Check,
    MagnifyingGlass
} from "@phosphor-icons/react";
import { Department } from "@/types/models";
import { uploadVideo, getDepartmentsVideos } from "../actions";
import { API_URL } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
    Command, 
    CommandEmpty, 
    CommandGroup, 
    CommandInput, 
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function MonitorSettings() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        setLoading(true);
        const res = await getDepartmentsVideos();
        if (res && res.success) {
            // Filter out ADMINISTRATION as requested
            const filtered = (res.data || []).filter((d: Department) => d.name !== 'ADMINISTRATION');
            setDepartments(filtered);
            if (filtered.length > 0 && !selectedDeptId) {
                setSelectedDeptId(filtered[0].id);
            }
        } else {
            console.error("Failed to load departments. Full Result:", res);
        }
        setLoading(false);
    };

    const [open, setOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "video/mp4") {
                notify.error("Only MP4 files are allowed");
                return;
            }
            if (selectedFile.size > 100 * 1024 * 1024) {
                notify.error("File size must be under 100MB");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!selectedDeptId || !file) {
            notify.error("Please select a department and a file");
            return;
        }

        setUploading(true);
        try {
            const res = await uploadVideo(selectedDeptId, file);
            if (res.success) {
                notify.success("Video uploaded successfully!");
                setFile(null);
                loadDepartments(); // Refresh to show new video
            } else {
                notify.error(res.error || "Upload failed");
            }
        } catch {
            notify.error("An error occurred during upload");
        } finally {
            setUploading(false);
        }
    };

    const selectedDept = departments.find(d => d.id === selectedDeptId);
    
    const getFullVideoUrl = (url: string) => {
        const backendUrl = API_URL.replace('/api', '');
        return `${backendUrl}${url}`;
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-emerald-950 uppercase tracking-tight">Monitor Settings</h1>
                <p className="text-slate-500 font-medium">Manage promotional and informational video loops for the Triage and Clinical Department monitors.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CONFIGURATION PANEL */}
                <Card className="lg:col-span-1 shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Upload size={24} className="text-emerald-600" />
                            Upload Video
                        </CardTitle>
                        <CardDescription>Select a department and upload an MP4 loop.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="department" className="font-bold text-slate-700">Monitor Location</Label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between bg-white border-slate-200 h-11 font-medium"
                                    >
                                        {selectedDeptId
                                            ? departments.find((dept) => dept.id === selectedDeptId)?.name
                                            : "Select Location..."}
                                        <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-xl border-slate-200" align="start">
                                    <Command className="rounded-lg">
                                        <div className="flex items-center border-b px-3 font-sans">
                                            <MagnifyingGlass className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                            <CommandInput placeholder="Search location..." className="placeholder:text-slate-400" />
                                        </div>
                                        <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            <CommandEmpty className="py-6 text-center text-sm text-slate-500 font-medium">No location found.</CommandEmpty>
                                            <CommandGroup>
                                                {departments.map((dept) => (
                                                    <CommandItem
                                                        key={dept.id}
                                                        value={dept.name}
                                                        onSelect={() => {
                                                            setSelectedDeptId(dept.id);
                                                            setOpen(false);
                                                        }}
                                                        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50 aria-selected:bg-emerald-50 aria-selected:text-emerald-900"
                                                    >
                                                        <span className="font-medium">{dept.name}</span>
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4 text-emerald-600",
                                                                selectedDeptId === dept.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="video" className="font-bold text-slate-700">MP4 File (Max 100MB)</Label>
                            <div className="relative group">
                                <Input 
                                    id="video" 
                                    type="file" 
                                    accept="video/mp4" 
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Label 
                                    htmlFor="video" 
                                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all group"
                                >
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                                        <VideoCamera size={24} weight="fill" />
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm">
                                        {file ? file.name : "Choose MP4 Video"}
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1 uppercase font-black tracking-widest">Click to browse</span>
                                </Label>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-lg p-4 flex gap-3 border border-amber-100">
                            <Info size={20} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                Uploading a new video will replace the current loop for the selected department. The monitor will update automatically.
                            </p>
                        </div>

                        <Button 
                            className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 gap-2 transition-all active:scale-[0.98]"
                            onClick={handleUpload}
                            disabled={uploading || !file}
                        >
                            {uploading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} weight="bold" />
                                    Save Monitor Video
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* PREVIEW PANEL */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <VideoCamera size={24} className="text-emerald-600" />
                                    Live Preview
                                </CardTitle>
                                <CardDescription>Currently assigned loop for {selectedDept?.name || "..."}</CardDescription>
                            </div>
                            {selectedDept?.videoUrl && (
                                <div className="flex items-center gap-1.5 bg-emerald-100 px-3 py-1 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle size={14} weight="fill" />
                                    Active Loop
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-slate-900 aspect-video flex items-center justify-center relative">
                        {selectedDept?.videoUrl ? (
                            <video 
                                key={selectedDept.videoUrl}
                                src={getFullVideoUrl(selectedDept.videoUrl)}
                                className="w-full h-full object-contain"
                                controls
                                autoPlay
                                muted
                                loop
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-white/20 select-none">
                                <VideoCamera size={80} weight="thin" />
                                <p className="font-black uppercase tracking-[0.2em] text-sm italic">No Video Assigned</p>
                            </div>
                        )}
                        
                        {/* Status Overlay */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-md">
                                <span className="text-[10px] text-white/60 font-black uppercase tracking-widest leading-none block mb-0.5">Department</span>
                                <span className="text-xs text-white font-bold">{selectedDept?.name || "NONE"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
