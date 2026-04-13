"use client";

import { UserData } from "@/shared/types/auth";
import { Department, WorkStation } from "@/shared/types/models";
import { useState } from "react";
import { WorkstationList } from "../workstation/WorkstationList";

type WorkstationSettingsProps = {
    initialWorkstations: WorkStation[];
    departments: Department[];
    users: UserData[];
};

export default function WorkstationSettings({
    initialWorkstations,
    departments,
    users,
}: WorkstationSettingsProps) {
    const [workstations, setWorkstations] = useState<WorkStation[]>(initialWorkstations);

    const handleCreated = (created: WorkStation[]) => {
        setWorkstations((current) => {
            const existingIds = new Set(current.map((station) => station.id));
            const uniqueCreated = created.filter((station) => !existingIds.has(station.id));
            return [...current, ...uniqueCreated].sort((left, right) => {
                if (left.type !== right.type) return left.type.localeCompare(right.type);
                return left.stationNo - right.stationNo;
            });
        });
    };

    const handleUpdated = (updated: WorkStation) => {
        setWorkstations((current) => current.map((station) => (station.id === updated.id ? { ...station, ...updated } : station)));
    };

    const handleDeleted = (id: string) => {
        setWorkstations((current) => current.filter((station) => station.id !== id));
    };

    return (
        <div className="space-y-6 w-full">
            <div className="w-full min-w-0">
                <WorkstationList
                    workstations={workstations}
                    departments={departments}
                    users={users}
                    onWorkstationsCreated={handleCreated}
                    onWorkstationUpdated={handleUpdated}
                    onWorkstationDeleted={handleDeleted}
                />
            </div>
        </div>
    );
}
