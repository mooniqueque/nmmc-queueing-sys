import type { Metadata } from 'next'
import { SidebarProvider } from '@/components/ui/sidebar'
import AdminSidebar from './admin-sidebar'

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
                <AdminSidebar />
                <main className="flex-1">{children}</main>
            </div>
        </SidebarProvider>
    )
}