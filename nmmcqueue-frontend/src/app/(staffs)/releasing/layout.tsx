import StaffHeader from '@/components/ui/staff-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Clerk Dashboard',
    description: 'Patient Queue Releasing',
}

export const dynamic = 'force-dynamic'

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 w-full">
            <StaffHeader title="Window Desk" />
            <div className="flex-1 w-full relative">
                {children}
            </div>
        </div>
    )
}
