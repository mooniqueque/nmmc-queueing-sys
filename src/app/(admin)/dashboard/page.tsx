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
} from 'react-icons/md'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Start of the Component
export default function AdminDashboard() {
  return (
    <div className="p-6">
      <div>
        <h2 className="text-2xl font-semibold text-emerald-800 mb-4">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to the admin dashboard</p>
      </div>
    </div>
  )
}


import AdminDashboard from '@/components/admin/dashboard-admin'

export default function Page() {
  return <AdminDashboard />
}