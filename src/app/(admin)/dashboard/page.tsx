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
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-100"> {/*green circle*/}
                NMC
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight text-emerald-950 ml-2"> Northern Mindanao Medical Center</span>
              </div>
            </div>

            {/*main sidebar*/}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>

                </SidebarMenu>
              </SidebarGroupContent>

            </SidebarGroup>


          </SidebarContent>

        </Sidebar>
      </SidebarProvider>

    </div>
  )
}

