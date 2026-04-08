import TriageNurseStats from "@/features/admin/components/triage-nurse";
import { getDepartments } from "@/features/admin/department-actions";
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { SessionUser } from "@/shared/types/auth";

export default async function TriageNurse() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const deptRes = await getDepartments();
    const departments = deptRes.success ? deptRes.data : [];

    return (
        <TriageNurseStats
            loggedInUser={session?.user as unknown as SessionUser}
            departments={departments}
        />
    );
}
