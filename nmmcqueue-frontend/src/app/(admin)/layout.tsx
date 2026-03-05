import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import AdminSidebar from "@/components/layouts/admin-sidebar"

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
    // Auth is enforced by:
    // 1. middleware.ts — blocks non-ADMIN from any /admin-* route
    // 2. Individual page-level getSession() guards
    return (
        <SidebarProvider>
            <AdminSidebar />
            {/* MAIN CONTENT */}
            <SidebarInset className="bg-slate-50/50">
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
