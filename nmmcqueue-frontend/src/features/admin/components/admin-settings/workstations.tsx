"use client";

import { WorkStation, Department } from "@/types/models";
import { WorkstationForm } from "../workstation/WorkstationForm";
import { WorkstationList } from "../workstation/WorkstationList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WorkstationSettingsProps = {
    initialWorkstations: WorkStation[];
    departments: Department[];
};

export default function WorkstationSettings({
    initialWorkstations,
    departments
}: WorkstationSettingsProps) {

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                {/* Form Module */}
                <WorkstationForm workstations={initialWorkstations} departments={departments} />
                
                {/* Info Card */}
                <Card className="border-border shadow-sm h-fit">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Workstation Logic</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-2">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5 border-l-2 border-emerald-500/50 pl-3">
                                <span className="text-[10px] font-black uppercase text-foreground tracking-widest">Window Registration</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">Assigned to clerks. Tickets called here are marked IN WINDOW.</p>
                            </div>
                            <div className="flex flex-col gap-1.5 border-l-2 border-blue-500/50 pl-3">
                                <span className="text-[10px] font-black uppercase text-foreground tracking-widest">Triage Desk</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">Assigned to triage nurses. Captures vitals and routes to clinics.</p>
                            </div>
                            <div className="flex flex-col gap-1.5 border-l-2 border-purple-500/50 pl-3">
                                <span className="text-[10px] font-black uppercase text-foreground tracking-widest">Clinic Caller</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">Optional mapping to specific departments for localized calling.</p>
                            </div>
                        </div>
                        <div className="bg-muted border border-border p-4 rounded-xl mt-4">
                            <p className="text-xs font-semibold text-foreground leading-relaxed italic opacity-80">
                                💡 Tip: You can bulk-create up to 10 workstations safely. The system prevents duplicates.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List Module */}
            <WorkstationList workstations={initialWorkstations} />
        </div>
    );
}
