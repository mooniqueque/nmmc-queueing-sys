import { auth } from "@/lib/database/auth";
import { getDepartments } from "@/services/department-services";
import { getQueueOptionsByDepartment } from "@/services/queue-option-services";
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
    const departmentNames = departmentResponse.success
        ? (departmentResponse.data ?? []).map((department) => department.name)
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