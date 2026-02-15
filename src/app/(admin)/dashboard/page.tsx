import AdminDashboard from '@/components/admin/dashboard-admin';
import { auth } from "@/lib/database/auth";
import { getAllUsers } from '@/services/user-service';
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return redirect("/login");
  }

  // Use the service layer to fetch data
  const allUsers = await getAllUsers();


  return (
    <div>
      <AdminDashboard
        loggedInUser={session.user}
        initialUsers={allUsers}
      />
    </div>
  )


}