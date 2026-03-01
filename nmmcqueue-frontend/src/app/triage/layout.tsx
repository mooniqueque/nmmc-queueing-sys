import TriageSidebar from '@/components/triage/triage-sidebar';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from 'next';

import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: 'Triage Dashboard',
    description: 'Patient Queue System',
}

export const dynamic = 'force-dynamic'

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Get the current user session securely on the backend
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // 2. Ensure they are logged in AND have the correct role
    if (!session || session.user.role !== 'TRIAGE_NURSE') {
        redirect('/login');
    }

    return (
        <SidebarProvider>
            <TriageSidebar />
            <SidebarInset className="bg-slate-50/50">
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
