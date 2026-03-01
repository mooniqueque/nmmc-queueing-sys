import { getQueueOptionsByDepartment } from '@/app/(admin)/admin-dashboard/_actions/queue-option-actions';
import { getDepartments } from '@/app/actions/department-actions';
import { auth } from "@/lib/database/auth";
import { Department } from "@/types/models";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPendingQueue } from './_actions/clerk-actions';
import { ClerkEntry } from './_components/clerk-entry';

export default async function ReleasingPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return redirect("/login");
  }

  const response = await getDepartments();
  const departments = response.data || [];

  const departmentNames = departments.map((dept: Department) => dept.name);
  const queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);

  const queueResponse = await getPendingQueue();
  const pendingQueue = queueResponse.success ? queueResponse.data : [];

  return (
    <div className='flex flex-1 flex-col h-full'>
      <header className='bg-white sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-emerald-900">Ticket Releasing (Window)</h1>
        </div>
      </header>
      <ClerkEntry
        initialQueue={pendingQueue}
        departments={departments}
        queueOptionsByDepartment={queueOptionsByDepartment}
      />
    </div>
  )
}
