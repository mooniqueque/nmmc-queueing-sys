import { redirect } from "next/navigation";

export const metadata = {
    title: "Monitor Settings | NMMC Queue",
    description: "Manage department monitor video loops",
};

export default async function AdminMonitorSettingsPage() {
    redirect("/admin-monitor");
}
