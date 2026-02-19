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
import Image from 'next/image';
import Link from 'next/link';
import {
    MdDashboard,
    MdDescription,
    MdLogout,
    MdMonitor,
    MdPhone,
    MdSupportAgent
} from 'react-icons/md';

import { authClient } from "@/lib/database/auth-client";
import { useRouter } from "next/navigation";

export default function AdminSidebar() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const { error } = await authClient.signOut({
                redirectTo: "/login" // explicit target, avoids URL hashes
            });
            if (error) {
                console.error("Logout error:", error);
                return;
            }
            // pushing again just in case the client didn't redirect
            router.push("/login");
            router.refresh();
        } catch (err) {
            console.error("Unexpected logout failure", err);
        }
    };

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
                            {/*FOR ADMIN*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <Link href="/admin">
                                        <MdDashboard size={20} className="text-emerald-700" />
                                        <span>Admin Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*FOR RELEASING*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <Link href='/releasing'>
                                        <MdDescription size={20} className="text-emerald-700" />
                                        <span>Releasing</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*FOR CALL NUMBER*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <Link href='/caller'>
                                        <MdPhone size={20} className="text-emerald-700" />
                                        <span>Call Number</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*FOR MONITOR*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <Link href='/monitor'>
                                        <MdMonitor size={20} className="text-emerald-700" />
                                        <span>Monitor</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*FOR REPORTS*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <Link href='/reports'>
                                        <MdDescription size={20} className="text-emerald-700" />
                                        <span>Reports</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/*Admin Settings*/}
                <SidebarGroup className="mt-4">
                    <SidebarGroupLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 " >
                        Admin Settings
                    </SidebarGroupLabel>

                    <SidebarGroupContent>
                        <SidebarMenu>

                            {/*RESET SERVICES*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <a href='#'>
                                        <span>Reset Services</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*WINDOW SETTINGS*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <a href='#'>
                                        <span>Window Settings</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*MANAGE RELEASING*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <a href='#'>
                                        <span>Manage Releasing</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*LANE SETTINGS*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <a href='#'>
                                        <span>Lane Settings</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/*SIDEBAR FOOTER*/}
            <SidebarFooter className="border-t p-4 bg-emerald-50/30">
                <SidebarMenu className="gap-2">

                    {/*CONTACT SUPP*/}
                    <SidebarMenuItem className="mb-2">
                        <SidebarMenuButton className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto">
                            <a href="#" className="flex items-left gap-2">
                                <MdSupportAgent size={20} className="mr-2" />
                                <span> Contact Support </span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/*LOGOUT*/}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            type="button"
                            onClick={handleLogout}
                            className="text-red-500 font-medium hover:text-red-700 hover:bg-red-50 text-base px-3 h-auto w-full justify-start cursor-pointer">
                            <div className="flex items-center gap-2">
                                <MdLogout size={20} className="mr-2" />
                                <span> Logout </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}