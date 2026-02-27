import { getAllUsers } from '@/app/(admin)/admin-dashboard/_actions/user-actions';
import { getDepartments } from '@/app/actions/department-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/lib/types/user";
import { Department } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from './_components/admin';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    switch (session.user.role) {
      case "TRIAGE_NURSE":
        return redirect("/triage");
      case "CLINIC_CALLER":
        return redirect("/caller");
      case "WINDOW_CLERK":
        return redirect("/releasing");
      default:
        return redirect("/");
    }
  }
  // Use the service layer to fetch data
  const allUsers = await getAllUsers();

  const response = await getDepartments();
  const departments = response.success ? response.data : [];

  return (
    <AdminDashboard
      loggedInUser={session.user as unknown as SessionUser}
      initialUsers={allUsers}
      departments={departments as Department[]}
    />
  );
}