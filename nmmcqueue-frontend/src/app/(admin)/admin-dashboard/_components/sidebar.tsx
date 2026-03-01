"use client"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
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
    Headset,
    Newspaper,
    Phone,
    SignOut,
    SquaresFour
} from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';

import { authClient } from "@/lib/database/auth-client";
import { usePathname, useRouter } from "next/navigation";


export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login");
                    router.refresh();
                }
            }
        });
    };
    const isActive = (path: string) => pathname === path;

    const mainSidebar = [
        { label: 'Admin Dashboard', href: '/admin-dashboard', Icon: SquaresFour },
        { label: 'Triage Nurse', href: '/triagenurse', Icon: FirstAidKit },
        { label: 'Releasing', href: '/admin-releasing', Icon: Newspaper },
        { label: 'Call Number', href: '/caller', Icon: Phone },
        { label: 'Monitor', href: '/monitor', Icon: Desktop },
        { label: 'Reports', href: '/reports', Icon: Article }
    ];

    const adminSettings = [
        { label: 'Reset Services', href: '/resetservices' },
        { label: 'Department Settings', href: '/departments' },
        { label: 'Manage Releasing', href: '/manage' },
        { label: 'Monitor Settings', href: '/monitorset' },
    ];

    return (
        <Sidebar className="border-r bg-emerald-50/50">
            <SidebarContent>
                <div className="p-4 flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 flex items-center justify-center relative">
                        <Image
                            src="/logo.png"
                            alt="NMMC Logo"
                            width={40}
                            height={40}
                            className="rounded-full ring-2 ring-emerald-100 object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm leading-tight text-emerald-950 ml-2"> Northern Mindanao Medical Center</span>
                    </div>
                </div>

                {/*main nav*/}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainSidebar.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild className={`text-emerald-900 text-base px-3 h-auto w-full justify-start ${isActive(item.href) ? 'bg-emerald-200 font-bold' : 'font-medium hover:bg-emerald-200'}`}>
                                        <Link href={item.href}>
                                            <item.Icon size={20} className="text-emerald-700" />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-4">
                    <SidebarGroupLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">
                        Admin Settings
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {adminSettings.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild className={`text-emerald-900 text-base px-3 h-auto w-full justify-start ${isActive(item.href) ? 'bg-emerald-200 font-bold' : 'font-medium hover:bg-emerald-200'}`}>
                                    <Link href={item.href}>
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            {/*SIDEBAR FOOTER*/}
            <SidebarFooter className="border-t p-4 bg-emerald-50/30">
                <SidebarMenu className="gap-2">

                    {/*CONTACT SUPP*/}
                    <SidebarMenuItem className="mb-2">
                        <SidebarMenuButton className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto">
                            <a href="#" className="flex items-left gap-2">
                                <Headset size={20} className="mr-2" />
                                <span> Contact Support </span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/*LOGOUT*/}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="text-red-500 font-medium hover:text-red-700 hover:bg-red-50 text-base px-3 h-auto w-full justify-start cursor-pointer">
                            <div className="flex items-center gap-2">
                                <SignOut size={20} className="mr-2" />
                                <span> Logout </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}