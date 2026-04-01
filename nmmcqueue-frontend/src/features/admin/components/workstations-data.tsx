import { getWorkstations } from "@/features/admin/workstation-actions";
import { getDepartments } from "@/features/admin/department-actions";
import WorkstationSettings from "@/features/admin/components/admin-settings/workstations";
import { WorkStation, Department } from "@/shared/types/models";
import { connection } from "next/server";

export default async function WorkstationsData() {
    await connection();

    let workstations: WorkStation[] = [];
    let departments: Department[] = [];

    try {
        const wsResponse = await getWorkstations();
        workstations = wsResponse.success && wsResponse.data ? wsResponse.data : [];
        
        const deptResponse = await getDepartments();
        departments = deptResponse.success && deptResponse.data ? deptResponse.data : [];
    } catch {
        // Build-time handle
    }

    return (
        <div className="p-6 max-w-7xl mx-auto mt-4">
            <h1 className="text-2xl font-bold text-emerald-950 mb-6 drop-shadow-sm">Manage Workstations</h1>
            <WorkstationSettings 
                initialWorkstations={workstations} 
                departments={departments}
            />
        </div>
    );
}
