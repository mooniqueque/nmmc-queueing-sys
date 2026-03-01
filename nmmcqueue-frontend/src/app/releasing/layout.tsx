import ClerkSidebar from '@/components/clerk/clerk-sidebar';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
        <SidebarProvider>
            <ClerkSidebar />
            <SidebarInset className="bg-slate-50/50">
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
