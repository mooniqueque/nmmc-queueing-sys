import TriageSidebar from '@/components/triage/triage-sidebar';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from 'next';


export const metadata: Metadata = {
    title: 'Triage Dashboard',
    description: 'Patient Queue System',
}

export const dynamic = 'force-dynamic'

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {

    return (
        <SidebarProvider>
            <TriageSidebar />
            <SidebarInset className="bg-slate-50/50">
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
