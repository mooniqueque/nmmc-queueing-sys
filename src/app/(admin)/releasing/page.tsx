import { getQueueOptionsByDepartment } from '@/app/(admin)/admin-dashboard/_actions/queue-option-actions';
import { getDepartments } from '@/app/actions/department-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/lib/types/user";
import { Department } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ReleasingDashboard from './_components/releasing';

export default async function ReleasingPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return redirect("/login");
  }

  const response = await getDepartments();
  const departments = response.data || [];

  const departmentNames = departments.map((dept) => dept.name);
  const queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);

  return (
    <ReleasingDashboard
      loggedInUser={session.user as unknown as SessionUser}
      departments={departments as Department[]}
      queueOptionsByDepartment={queueOptionsByDepartment}
    />
  )
}
