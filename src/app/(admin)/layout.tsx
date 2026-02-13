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
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
        </div>
    )
}