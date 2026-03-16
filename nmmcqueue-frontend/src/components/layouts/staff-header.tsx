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
import { MdLogout, MdSettings, MdSupportAgent } from 'react-icons/md'
import Image from "next/image"

export default function StaffHeader({ title }: { title: string }) {
    const { data } = authClient.useSession()
    const router = useRouter()
    const loggedInUser = data?.user as unknown as { name?: string, role?: string }

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
        <header className='bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm shrink-0 w-full'>
            <div className="flex items-center gap-3">
                <Image
                    src="/nmmc-logo.png"
                    alt="NMMC Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                />
                <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-emerald-800 leading-tight">
                        Northern Mindanao Medical Center
                    </h2>
                    <h1 className="text-xl font-black text-emerald-600">{title}</h1>

                </div>
            </div>

            <div className='flex items-center gap-3'>
                <div className="hidden sm:flex flex-col items-end mr-1">
                    <span className="text-sm font-black text-emerald-900">
                        {loggedInUser?.name || "Staff"}
                    </span>
                    <span className="text-bold font-medium text-slate-500 uppercase tracking-tighter">
                        {loggedInUser?.role || "USER"}
                    </span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                        <Avatar className='size-10 border-2 border-emerald-100 ring-2 ring-emerald-50 hover:ring-emerald-200 transition-all cursor-pointer'>
                            <AvatarFallback className="font-bold bg-emerald-50 text-emerald-700">
                                {loggedInUser?.name?.substring(0, 2).toUpperCase() || "ST"}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56 mt-2 border-slate-200 shadow-xl rounded-xl">
                        <DropdownMenuLabel className="font-bold text-slate-800">My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-900 flex items-center gap-2">
                            <MdSettings size={18} />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-900 flex items-center gap-2">
                            <MdSupportAgent size={18} />
                            <span>Contact Support</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-bold text-red-600 focus:bg-red-50 focus:text-red-700 flex items-center gap-2">
                            <MdLogout size={18} />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
