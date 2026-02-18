import { requireRole, getUserInfo } from '@/lib/role'
import UserMonitor from '@/components/user/monitor'

export default async function UserMonitorPage() {
  // Ensure user has access
  await requireRole('user')
  
  // Get user info to pass to client component
  const userInfo = await getUserInfo()

  return <UserMonitor userInfo={userInfo} />
}
