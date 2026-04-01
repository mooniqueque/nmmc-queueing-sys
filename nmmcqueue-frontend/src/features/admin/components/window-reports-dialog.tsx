"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalytics } from "@/features/shared/hooks/use-analytics";
import { SessionUser } from "@/types/auth";
import { 
    FileText, 
    Printer, 
    Users, 
    User as UserIcon,
    Ticket,
    Clock
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { AnalyticsData } from "@/features/shared/hooks/use-analytics";

interface WindowReportsDialogProps {
    loggedInUser: SessionUser;
}

export function WindowReportsDialog({ loggedInUser }: WindowReportsDialogProps) {
    const [activeTab, setActiveTab] = useState("personal");
    
    // Personal Stats (Filtered by current user)
    const { data: personalData, isLoading: isPersonalLoading } = useAnalytics("window", undefined, loggedInUser.id);
    
    // Overall Stats (All clerks)
    const { data: overallData, isLoading: isOverallLoading } = useAnalytics("window");

    const handlePrint = () => {
        window.print();
    };

    const renderStatsContent = (data: AnalyticsData, isLoading: boolean, isOverall: boolean) => {
        if (isLoading) return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );

        return (
            <div className="space-y-6 pt-4 printable-area">
                {/* KPI Row */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/30 p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <Ticket size={16} className="text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Released</span>
                        </div>
                        <p className="text-2xl font-black">{data.kpis.totalToday}</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={16} className="text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Window Time</span>
                        </div>
                        <p className="text-2xl font-black">{data.kpis.avgProcessingMinutes}m</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <Users size={16} className="text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completed</span>
                        </div>
                        <p className="text-2xl font-black">{data.kpis.completedToday}</p>
                    </div>
                </div>

                {/* Department Breakdown Table */}
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 px-1 border-l-2 border-primary/30 pl-3">
                        Tickets per Department
                    </h3>
                    <div className="border rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="px-4 py-3 font-bold text-xs uppercase tracking-widest">Department</th>
                                    <th className="px-4 py-3 font-bold text-xs uppercase tracking-widest text-right">Count</th>
                                    <th className="px-4 py-3 font-bold text-xs uppercase tracking-widest text-right">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.departmentBreakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">No data recorded for today.</td>
                                    </tr>
                                ) : (
                                    data.departmentBreakdown.map((dept) => {
                                        const pct = ((dept.patients / (data.kpis.totalToday || 1)) * 100).toFixed(1);
                                        return (
                                            <tr key={dept.department} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3 font-medium">{dept.department}</td>
                                                <td className="px-4 py-3 text-right font-bold tabular-nums">{dept.patients}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Badge variant="secondary" className="font-bold tabular-nums">{pct}%</Badge>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Staff Contributions (Overall View Only) */}
                {isOverall && data.staffBreakdown && (
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 px-1 border-l-2 border-amber-500/30 pl-3">
                            Staff Contributions
                        </h3>
                        <div className="border rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-widest">Staff Name</th>
                                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-widest text-right">Tickets Given</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.staffBreakdown.map((staff) => (
                                        <tr key={staff.name} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                            <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                <UserIcon size={12} weight="bold" className="text-muted-foreground" />
                                                {staff.name} {staff.name === loggedInUser.name && "(Me)"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold tabular-nums">{staff.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-primary/20 hover:border-primary/50 text-xs font-bold uppercase tracking-widest">
                    <FileText size={16} weight="bold" />
                    Reports
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl sm:p-8">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight">Window Cycle Reports</DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">Generated: {new Date().toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handlePrint} className="shrink-0 hover:bg-muted">
                        <Printer size={20} weight="bold" />
                    </Button>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted rounded-xl">
                        <TabsTrigger value="personal" className="rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <UserIcon size={14} weight="bold" />
                            My Stats
                        </TabsTrigger>
                        <TabsTrigger value="overall" className="rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Users size={14} weight="bold" />
                            Team Stats
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal">
                        {renderStatsContent(personalData, isPersonalLoading, false)}
                    </TabsContent>

                    <TabsContent value="overall">
                        {renderStatsContent(overallData, isOverallLoading, true)}
                    </TabsContent>
                </Tabs>

                <div className="mt-8 pt-6 border-t border-dashed flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-medium italic">
                        * Data reflects the current date and time processing snapshot.
                    </p>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-primary/30 text-primary">
                        Live Data 
                    </Badge>
                </div>
            </DialogContent>
        </Dialog>
    );
}
