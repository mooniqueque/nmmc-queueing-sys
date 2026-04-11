export const dynamic = 'force-dynamic';


import { LoadingSpinner } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import ManageReleasingData from "@/features/admin/components/admin-settings/manage-releasing-data";
=======
import { redirect } from "next/navigation";
>>>>>>> origin/improvep2

export default function ManageReleasingPage() {
    redirect("/admin-dashboard");
}
