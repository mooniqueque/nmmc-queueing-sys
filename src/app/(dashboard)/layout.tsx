import type { Metadata } from 'next'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import AdminSidebar from "@/components/dashboard/sidebar"
export const metadata: Metadata = {
    title: 'Admin Dashboard',
    description: 'Queue System Administration',
}
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            {/* SIDEBAR */}
            <AdminSidebar />

            {/* MAIN CONT*/}
            <SidebarInset className="bg-slate-50/50">
                {children}
            </SidebarInset >
        </SidebarProvider>
    )
}