"use client"

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { authClient } from "@/lib/database/auth-client";
import { SessionUser } from "@/shared/types/auth";
import { Gear, SignOut } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
    user: SessionUser;
    title: string;
    subtitle?: string;
}

export function AdminHeader({ user, title, subtitle }: AdminHeaderProps) {
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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex h-16 items-center justify-between px-8 lg:px-10">
                <div className="flex items-center gap-5">
                    <SidebarTrigger className="rounded-md transition-colors hover:bg-emerald-50 hover:text-emerald-700 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700" />
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-base font-semibold tracking-tight">{title}</h1>
                            {subtitle && (
                                <p className="text-xs text-muted-foreground font-medium tracking-wide -mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-medium leading-none">{user.name}</span>
                        <span className="text-xs text-muted-foreground tracking-wide mt-1 font-medium">
                            {user.role}
                        </span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-9 w-9 border cursor-pointer transition-all hover:ring-2 hover:ring-emerald-200 hover:shadow-sm">
                                <AvatarFallback className="font-semibold text-xs bg-muted text-muted-foreground">
                                    {user.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer focus:bg-emerald-50 focus:text-emerald-700">
                                <Gear className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={handleLogout}
                                className="text-destructive focus:text-destructive cursor-pointer"
                            >
                                <SignOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
