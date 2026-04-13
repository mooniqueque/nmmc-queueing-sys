"use client"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar';
import {
    Article,
    Desktop,
    FirstAidKit,
    Newspaper,
    Phone,
    SquaresFour
} from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';

import { usePathname } from "next/navigation";


export default function AdminSidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const mainSidebar = [
        { label: 'Admin Dashboard', href: '/admin-dashboard', Icon: SquaresFour },
        { label: 'Triage Nurse', href: '/admin-triage', Icon: FirstAidKit },
        { label: 'Releasing', href: '/admin-releasing', Icon: Newspaper },
        { label: 'Call Number', href: '/admin-caller', Icon: Phone },
        { label: 'Monitor', href: '/admin-monitor', Icon: Desktop },
        { label: 'Reports', href: '/admin-reports', Icon: Article }
    ];

    const adminSettings = [
        { label: 'Reset Services', href: '/admin-resetserv' },
        { label: 'Workstation Settings', href: '/admin-workstations' },
        { label: 'Department Settings', href: '/admin-departments' },
    ];

    return (
        <Sidebar className="border-r bg-background">
            <SidebarContent>
                <div className="p-4 flex items-center gap-3">
                    <div className="h-8 w-8 flex items-center justify-center relative">
                        <Image
                            src="/logo.png"
                            alt="NMMC Logo"
                            width={32}
                            height={32}
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-none tracking-tight">NMMC</span>
                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">Queue System</span>
                    </div>
                </div>

                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Navigation
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="px-3">
                        <SidebarMenu>
                            {mainSidebar.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.href)}
                                        className="w-full justify-start gap-3 h-10 px-3 rounded-md transition-colors data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700 data-[active=true]:shadow-sm hover:bg-muted/60 hover:text-foreground"
                                    >
                                        <Link href={item.href}>
                                            <item.Icon size={18} weight={isActive(item.href) ? "bold" : "regular"} />
                                            <span className="text-sm font-medium tracking-tight">{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-4">
                    <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Settings
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="px-3">
                        <SidebarMenu>
                            {adminSettings.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.href)}
                                        className="w-full justify-start h-10 px-3 rounded-md transition-colors data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700 data-[active=true]:shadow-sm hover:bg-muted/60 hover:text-foreground"
                                    >
                                        <Link href={item.href}>
                                            <span className="text-sm font-medium tracking-tight">{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}