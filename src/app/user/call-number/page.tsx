import { requireRole, getUserInfo } from '@/lib/role'
import UserCallNumber from '@/components/user/call-number'

export default async function UserCallNumberPage() {
  // Ensure user has access
  await requireRole('user')
  
  // Get user info to pass to client component
  const userInfo = await getUserInfo()

  return <UserCallNumber userInfo={userInfo} />
}
