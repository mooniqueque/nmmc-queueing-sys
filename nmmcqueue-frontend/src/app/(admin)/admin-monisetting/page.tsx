import MonitorSettings from "@/features/monitoring/components/monitor-settings";
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { SessionUser } from "@/shared/types/auth";
import { AdminHeader } from "@/shared/layouts";

export const metadata = {
    title: "Monitor Settings | NMMC Queue",
    description: "Manage department monitor video loops",
};

export default async function AdminMonitorSettingsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user as unknown as SessionUser;

    return (
        <div className="flex flex-1 flex-col">
            {user && <AdminHeader user={user} title="Monitor Management" />}
            <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full py-12">
                <MonitorSettings />
            </main>
        </div>
    );
}
