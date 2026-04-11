import ResetServices from "@/features/admin/components/admin-settings/reset-services";
import { AdminHeader } from "@/shared/layouts";
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { SessionUser } from "@/shared/types/auth";

export const metadata = {
    title: "Reset Services | NMMC Queue",
    description: "Manual ticket sequence reset for administrative maintenance.",
};

export default async function AdminResetServicesPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user as unknown as SessionUser;

    return (
        <div className="flex flex-1 flex-col">
            {user && <AdminHeader user={user} title="Reset Services" />}
            <main className="flex-1 p-6 lg:p-10 container mx-auto max-w-4xl w-full py-12">
                <ResetServices />
            </main>
        </div>
    );
}
