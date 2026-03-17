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
import { SessionUser } from "@/types/auth";
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
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold tracking-tight">{title}</h1>
                        {subtitle && (
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest -mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-bold leading-none">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">
                            {user.role}
                        </span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-9 w-9 border cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all">
                                <AvatarFallback className="font-bold text-xs bg-muted text-muted-foreground">
                                    {user.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
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
