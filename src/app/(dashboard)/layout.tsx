import type { Metadata } from 'next'
import { requireRole } from '@/lib/role'

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
    await requireRole('admin')

    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
        </div>
    )
}