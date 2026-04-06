import { headers } from "next/headers";
import { connection } from "next/server";

import { AdminHeader } from "@/components/layouts/admin-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDepartments } from "@/features/admin/department-actions";
import { getTriageReleasingAccessUsers } from "@/features/admin/user-actions";
import { ManageReleasingPanel } from "@/features/admin/components/manage-releasing-panel";
import { auth } from "@/lib/database/auth";
import { SessionUser, TriageReleasingAccessUser } from "@/types/auth";
import { Department } from "@/types/models";

export default async function ManageReleasingData() {
    await connection();

    let session = null;
    let departments: Department[] = [];
    let users: TriageReleasingAccessUser[] = [];

    try {
        session = await auth.api.getSession({ headers: await headers() });

        const departmentsResponse = await getDepartments();
        if (departmentsResponse?.success && Array.isArray(departmentsResponse.data)) {
            departments = departmentsResponse.data as Department[];
        }

        const triageUsers = await getTriageReleasingAccessUsers();
        if (Array.isArray(triageUsers)) {
            users = triageUsers as TriageReleasingAccessUser[];
        }
    } catch {
        // Render fallback state if server data fetch fails.
    }

    if (!session?.user) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Releasing</CardTitle>
                        <CardDescription>Unable to load session. Please login again.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <AdminHeader
                user={session.user as unknown as SessionUser}
                title="Manage Releasing"
                subtitle="Triage Department Access"
            />

            <ManageReleasingPanel users={users} departments={departments} />
        </div>
    );
}
