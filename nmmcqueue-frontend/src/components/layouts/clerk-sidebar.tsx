"use client"
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
    SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from '@/components/ui/sidebar';
import { authClient } from "@/lib/database/auth-client";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { MdDescription, MdLogout, MdSupportAgent, MdWindow } from 'react-icons/md';

export default function ClerkSidebar() {
    const router = useRouter();

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

    return (
        <Sidebar className="border-r bg-emerald-50/50">
            <SidebarContent>
                <div className="p-4 flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 flex items-center justify-center relative">
                        <Image src="/logo.png" alt="NMMC Logo" width={40} height={40} className="rounded-full ring-2 ring-emerald-100 object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm leading-tight text-emerald-950 ml-2"> NMMC Releasing</span>
                    </div>
                </div>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <Link href="/releasing">
                                        <MdWindow size={20} className="text-emerald-700" />
                                        <span>Window Desk</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                    <Link href="/releasing">
                                        <MdDescription size={20} className="text-emerald-700" />
                                        <span>Reports</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t p-4 bg-emerald-50/30">
                <SidebarMenu className="gap-2">
                    <SidebarMenuItem className="mb-2">
                        <SidebarMenuButton className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto">
                            <a href="#" className="flex items-left gap-2">
                                <MdSupportAgent size={20} className="mr-2" />
                                <span> Contact Support </span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} className="text-red-500 font-medium hover:text-red-700 hover:bg-red-50 text-base px-3 h-auto w-full justify-start cursor-pointer">
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
