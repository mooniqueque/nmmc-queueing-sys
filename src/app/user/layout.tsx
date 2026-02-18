import type { Metadata } from 'next'
import { requireRole } from '@/lib/role'

export const metadata: Metadata = {
  title: 'User Dashboard',
  description: 'Patient Queue System',
}

export const dynamic = 'force-dynamic'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect user routes - redirect to login if not authenticated
  await requireRole('user')

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
    </div>
  )
}
