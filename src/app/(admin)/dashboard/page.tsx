import AdminDashboard from '@/components/admin/dashboard-admin';
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return redirect("/login");
  }

  return (
    <div>
      <AdminDashboard />
    </div>
  )


}