import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import AdminSidebar from "./admin-dashboard/_components/sidebar"

import type { Metadata } from 'next'
export const metadata: Metadata = {
    title: 'Admin Dashboard',
    description: 'Queue System Administration',
}

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Protect admin routes - redirect to login if not admin
    ///
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