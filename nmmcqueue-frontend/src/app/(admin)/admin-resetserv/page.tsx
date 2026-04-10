import ResetServices from "@/features/admin/components/admin-settings/reset-services";
import { AdminHeader } from "@/shared/layouts";
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { SessionUser } from "@/types/auth";

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
            <main className="flex-1 p-6 lg:p-10 container mx-auto max-w-2xl w-full">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">System Reset</h1>
                    <p className="text-sm text-muted-foreground">
                        Reset global ticket counters for the start of the day.
                    </p>
                </div>
                
                <ResetServices />
            </main>
        </div>
    );
}
