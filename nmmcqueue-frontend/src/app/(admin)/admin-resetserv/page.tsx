import ResetServices from "@/features/admin/components/admin-settings/reset-services";
import { auth } from "@/lib/database/auth";
import { AdminHeader } from "@/shared/layouts";
import { SessionUser } from "@/shared/types/auth";
import { headers } from "next/headers";

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
            <main className="flex-1 p-6 lg:p-8 container mx-auto max-w-4xl w-full py-10">
                <ResetServices />
            </main>
        </div>
    );
}
