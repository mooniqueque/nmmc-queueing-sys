import {
  MdDashboard,
  MdDescription,
  MdPhone,
  MdMonitor,
} from 'react-icons/md'
import Link from 'next/link'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'

export default function AdminSidebar() {
  return (
    <Sidebar className="border-r bg-emerald-50/50">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-100">
            NMC
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight text-emerald-950 ml-2">Northern Mindanao Medical Center</span>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/*FOR ADMIN*/}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive className="bg-emerald-100 text-emerald-900 font-medium hover:bg-emerald-200">
                  <Link href="/dashboard">
                    <MdDashboard size={20} className="text-emerald-700" />
                    <span>Admin Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/*FOR RELEASING*/}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive className="bg-emerald-100 text-emerald-900 font-medium hover:bg-emerald-200">
                  <Link href="/releasing">
                    <MdDescription size={20} className="text-emerald-700" />
                    <span>Releasing</span>
                  </Link>
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

        <SidebarFooter />
      </SidebarContent>
    </Sidebar>
  )
}
