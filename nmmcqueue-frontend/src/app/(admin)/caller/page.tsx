import { getQueueOptionsByDepartment } from "@/app/(admin)/admin-dashboard/_actions/queue-option-actions";
import { getDepartments } from "@/app/actions/department-actions";
import { auth } from "@/lib/database/auth";
import { Department } from "@/types/models";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CallerDashboard from './_components/caller';

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return redirect("/login");
    }

    const departmentResponse = await getDepartments();
    const departmentNames = departmentResponse.data
        ? departmentResponse.data.map((department: Department) => department.name)
        : [];
    const queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);

    return (
        <CallerDashboard
            loggedInUser={session.user}
            departments={departmentNames}
            queueOptionsByDepartment={queueOptionsByDepartment}
        />
    );
}