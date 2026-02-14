import type { Metadata } from 'next'
import { SidebarProvider } from "@/components/ui/sidebar"
import AdminSidebar from "@/components/admin/sidebar"
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
            <div className="flex min-h-screen w-full bg-slate-50/50">
                {/* SIDEBAR */}
                <AdminSidebar />

                {/* MAIN CONT*/}
                <main className="flex-1 flex flex-col w-full">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    )
}