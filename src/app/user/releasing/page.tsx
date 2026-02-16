import { requireRole, getUserInfo } from '@/lib/role'
import UserReleasing from '@/components/user/releasing'

export default async function UserReleasingPage() {
  // Ensure user has access
  await requireRole('user')
  
  // Get user info to pass to client component
  const userInfo = await getUserInfo()

  return <UserReleasing userInfo={userInfo} />
}
