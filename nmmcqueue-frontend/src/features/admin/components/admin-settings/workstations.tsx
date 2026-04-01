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
        <div className="flex flex-col lg:flex-row gap-6 w-full relative">
            {/* Left Sidebar Track */}
            <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 relative">
                <div className="sticky top-24 z-10 w-full mb-8">
                    <WorkstationForm workstations={initialWorkstations} departments={departments} />
                </div>
            </div>

            {/* Right Main Panel: List Module */}
            <div className="flex-1 w-full min-w-0">
                <WorkstationList workstations={initialWorkstations} />
            </div>
        </div>
    );
}
