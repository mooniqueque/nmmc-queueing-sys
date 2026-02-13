import {
  MdDashboard,
  MdDescription,
  MdPhone,
  MdMonitor,
  MdLogout,
  MdSupportAgent,
  MdSettings,
  MdPeople,
  MdPersonAdd,
  MdSearch,
  MdFilterList,
  MdAccessTime,
  MdCheckCircle,
  MdCancel,
  MdPendingActions
} from 'react-icons/md';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Start of the Component
export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      <SidebarProvider>

        {/* sidebar */}
        <Sidebar className="border-r bg-emerald-50/50">
          <SidebarContent>
            <div className="p-4 flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-100">
                {/*green circle*/} NMC
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
                    <SidebarMenuButton asChild isActive className="bg-emerald-100 text-emerald-900 font-medium hover:bg-emerald-200">
                      <a href='#'>
                        <MdDashboard size={20} className="text-emerald-700" />
                        <span>Admin Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/*FOR RELEASING*/}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive className="bg-emerald-100 text-emerald-900 font-medium hover:bg-emerald-200">
                      <a href='#'>
                        <MdDescription size={20} className="text-emerald-700" />
                        <span>Releasing</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/*FOR CALL NUMBER*/}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive className="bg-emerald-100 text-emerald-900 font-medium hover:bg-emerald-200">
                      <a href='#'>
                        <MdPhone size={20} className="text-emerald-700" />
                        <span>Call Number</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/*FOR MONITOR*/}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive className="bg-emerald-100 text-emerald-900 font-medium hover:bg-emerald-200">
                      <a href='#'>
                        <MdMonitor size={20} className="text-emerald-700" />
                        <span>Monitor</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/*FOR REPORTS*/}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive className="bg-emerald-100 text-emerald-900 font-medium hover:bg-emerald-200">
                      <a href='#'>
                        <MdDescription size={20} className="text-emerald-700" />
                        <span>Reports</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>


                </SidebarMenu>
              </SidebarGroupContent>

            </SidebarGroup>


          </SidebarContent>

        </Sidebar>
      </SidebarProvider>

    </div>
  )
}

