import DepartmentSettings from "@/app/(admin)/admin-dashboard/_components/admin-settings/departments";
import { getDepartments } from "@/services/department-services";
import { getQueueOptionsByDepartment } from "@/services/queue-option-services";
import { Department } from "@prisma/client";

export default async function DepartmentsPage() {
    // Fetch data perfectly on the server side
    const response = await getDepartments();
    const departments = response.success && response.data ? response.data : [];
    const queueOptionsByDepartment = await getQueueOptionsByDepartment(departments.map((department) => department.name));

    return (
        <div className="p-6 max-w-7xl mx-auto mt-4">
            <h1 className="text-2xl font-bold text-emerald-950 mb-6 drop-shadow-sm">Manage Departments</h1>
            {/* Pass the data to the client component for interactivity */}
            <DepartmentSettings initialDepartments={departments as Department[]} initialQueueOptionsByDepartment={queueOptionsByDepartment} />
        </div>
    );
}
