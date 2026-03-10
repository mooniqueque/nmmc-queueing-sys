import TriageNurseForm from "@/features/admin/components/triage-nurse";
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { SessionUser } from "@/types/auth";

export default async function TriageNurse() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    return <TriageNurseForm loggedInUser={session?.user as unknown as SessionUser} />;
}
