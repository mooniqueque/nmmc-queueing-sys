import ReleasingDashboard from '@/components/admin-dashboard/releasing';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/lib/types/user";
import { getDepartments } from '@/services/department-services';
import { Department } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ReleasingPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return redirect("/login");
  }

  const response = await getDepartments();
  const departments = response.success ? response.data : [];

  return (
    <ReleasingDashboard
      loggedInUser={session.user as unknown as SessionUser}
      departments={departments as Department[]}
    />
  )
}
