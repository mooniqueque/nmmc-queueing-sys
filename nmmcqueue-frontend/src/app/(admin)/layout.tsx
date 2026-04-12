import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import AdminSidebar from "@/shared/layouts/admin-sidebar"

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
        <div className="admin-readable-scale">
            <SidebarProvider>
                <AdminSidebar />
                {/* MAIN CONTENT */}
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
