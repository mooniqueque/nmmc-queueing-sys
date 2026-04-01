"use client"

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/database/auth-client"
import { useRouter } from "next/navigation"
import { Gear, SignOut } from '@phosphor-icons/react'
import Image from "next/image"

export default function StaffHeader({ title }: { title: string }) {
    const { data } = authClient.useSession()
    const router = useRouter()
    const loggedInUser = data?.user as any

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login")
                    router.refresh()
                }
            }
        })
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Image
                        src="/nmmc-logo.png"
                        alt="NMMC Logo"
                        width={32}
                        height={32}
                        className="object-contain"
                    />
                    <div className="h-4 w-px bg-border hidden sm:block mx-1" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold tracking-tight text-emerald-900">{title}</h1>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest -mt-0.5">
                            Northern Mindanao Medical Center
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-bold leading-none text-emerald-950">
                            {loggedInUser?.name || "Staff"}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">
                            {loggedInUser?.role || "USER"}
                        </span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild suppressHydrationWarning>
                            <Avatar className="h-9 w-9 border border-emerald-100 cursor-pointer hover:ring-2 hover:ring-emerald-500/10 transition-all" suppressHydrationWarning>
                                <AvatarFallback className="font-bold text-xs bg-emerald-50 text-emerald-700" suppressHydrationWarning>
                                    {loggedInUser?.name?.substring(0, 2).toUpperCase() || "ST"}
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
    )
}
