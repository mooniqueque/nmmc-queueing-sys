import AdminSidebar from "@/components/dashboard/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import type { Metadata } from 'next'
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
            <AdminSidebar />
            {/* SIDEBAR /}
            

            {/ MAIN CONT*/}
            <SidebarInset className="bg-slate-50/50">
                {children}
            </SidebarInset >
        </SidebarProvider>
    )
}