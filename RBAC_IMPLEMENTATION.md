## Role-Based Access Control (RBAC)

This document describes the role-based access control system implemented in the NMMC Queue System.

### Overview

The application supports two main user roles:
- **Admin**: Can access administrative features, manage releases, and view all users
- **User**: Can view queue status and monitor calls

### Architecture Notes

#### Routing Strategy

This project uses a **hybrid routing approach**:
- **Admin routes** use `src/app/(admin)/` (routing group - hidden from URL)
  - Routes resolve to: `/dashboard`, `/releasing`
- **User routes** use `src/app/user/` (URL prefix - visible in URL)
  - Routes resolve to: `/user/releasing`, `/user/call-number`, `/user/monitor`

**Why dual approach?** Routing groups (parentheses) provide better code organization but would create URL conflicts since both admin and user had a `/releasing` page. Using a URL prefix for user routes avoids this conflict while keeping admin routes clean.

Once your application scales beyond two roles, consider a middleware-based approach or use routing groups with distinct final route names (e.g., `/admin-dashboard`, `/admin-releasing` for admin).

The `role.ts` file provides utilities for checking and enforcing user roles:

```typescript
// Get current user's role from session
const role = await getUserRole(); // Returns: 'admin' | 'user' | 'guest'

// Check if user is admin
const adminCheck = await isAdmin(); // Returns: boolean

// Check if user is regular user
const userCheck = await isUser(); // Returns: boolean

// Require specific role (redirects to login if access denied)
await requireRole('admin'); // Protects admin pages
await requireRole('user');  // Protects user pages

// Get user info (name, email, role)
const userInfo = await getUserInfo();
```

#### Session Management (Cookie-Based)

Currently, roles are stored in cookies for demonstration. In production, replace this with:
- NextAuth.js or similar session library
- JWT tokens
- Database session store

Initially the project stored roles in a cookie for simplicity:
```
userRole=admin|user
userName=John%20Doe
userEmail=john@example.com
```
Those helper functions lived in `src/lib/role.ts` and parsed `document.cookie`.

> **Update:** the system now uses BetterAuth's session API instead of manual
> cookies. `requireRole()` and friends call `auth.api.getSession()` under the
> hood so you don't need any client code to manage cookies. Login redirects
> also consult the session endpoint. This approach is more secure and avoids
> inconsistencies between client and server state.

### Routing Structure

#### Admin Routes
- **Location**: `src/app/(admin)/`
- **Protected**: Yes, requires `admin` role
- **Pages**:
  - `/dashboard` - Admin dashboard with user management
  - `/releasing` - Ticket releasing management

#### User Routes
- **Location**: `src/app/user/`
- **URL Prefix**: `/user/` (required to avoid routing conflicts with admin routes)
- **Protected**: Yes, requires `user` role
- **Pages**:
  - `/user/releasing` - View ticket status and queue position
  - `/user/call-number` - Monitor current and recent calls
  - `/user/monitor` - View system-wide queue status

### Components

#### Admin Components (`src/components/admin/`)
- `dashboard-admin.tsx` - Admin dashboard with user management, statistics
- `releasing-admin.tsx` - Admin ticket releasing interface
- `dashboard-releasing.tsx` - Releasing dashboard (empty, placeholder)

**Admin-Only Controls**:
- Add Users button
- Pending Users button
- User role management
- Service reset controls
- Window and lane settings

#### User Components (`src/components/user/`)
- `releasing.tsx` - User-friendly ticket status display
- `call-number.tsx` - Call queue monitor
- `monitor.tsx` - System queue status viewer

**User Restrictions**:
- No add/edit/delete buttons
- Read-only interface
- View-only access to queue information
- Status monitoring only

### Implementation Pattern

#### Server-Side Protection (Pages)

All user and admin pages use `requireRole()` to protect access:

```typescript
// src/app/(user)/releasing/page.tsx
import { requireRole } from '@/lib/role'

export default async function UserReleasingPage() {
  await requireRole('user') // Redirect to /login if not user
  return <UserReleasing />
}

// src/app/(admin)/dashboard/page.tsx
import { requireRole } from '@/lib/role'

export default async function AdminDashboardPage() {
  await requireRole('admin') // Redirect to /login if not admin
  return <AdminDashboard />
}
```

#### Layout Protection

The `(user)` and `(admin)` layout files validate role at the group level:

```typescript
// src/app/(user)/layout.tsx
export default async function UserLayout({ children }) {
  await requireRole('user')
  return <div>{children}</div>
}
```

#### Client-Side Helpers

For client components that need role-checking (optional):

```typescript
import { isAdminClient, isUserClient } from '@/lib/role'

export default function MyComponent({ role }) {
  if (isAdminClient(role)) {
    return <AdminSection />
  }
  return <UserSection />
}
```

### Sidebar Navigation

Both admin and user sidebars are embedded in their respective components:

- **Admin sidebar** (`releasing-admin.tsx`, `dashboard-admin.tsx`):
  - Dashboard link
  - Releasing link
  - Call Number link
  - Monitor link
  - Reports link
  - Admin Settings section (Reset Services, Window Settings, etc.)

- **User sidebar** (all user components):
  - Releasing link
  - Call Number link
  - Monitor link
  - No admin settings

To update navigation items, edit the `<SidebarMenu>` sections in:
- `src/components/admin/releasing-admin.tsx`
- `src/components/admin/dashboard-admin.tsx`
- `src/components/user/releasing.tsx`
- `src/components/user/call-number.tsx`
- `src/components/user/monitor.tsx`

### Testing the Role System

1. **Test Admin Access**:
   ```bash
   # Set admin cookie (manually in browser DevTools)
   Document.cookie = "userRole=admin; path=/"
   Document.cookie = "userName=Admin%20User; path=/"
   
   # Navigate to /dashboard - should work
   # Navigate to /releasing - should work
   ```

2. **Test User Access**:
   ```bash
   # Set user cookie
   Document.cookie = "userRole=user; path=/"
   Document.cookie = "userName=Patient%20User; path=/"
   
   # Navigate to /releasing - should work
   # Navigate to /dashboard - should redirect to /login
   ```

3. **Test Access Denial**:
   ```bash
   # Clear cookies or don't set userRole
   # Navigate to any protected page - should redirect to /login
   ```

### Adding New Roles

To add a new role (e.g., 'nurse', 'doctor'):

1. Update `UserRole` type in `src/lib/role.ts`:
   ```typescript
   export type UserRole = 'admin' | 'user' | 'nurse' | 'doctor' | 'guest'
   ```

2. Create new route group:
   ```
   src/app/(nurse)/
   src/app/(nurse)/layout.tsx
   ```

3. Apply role check:
   ```typescript
   await requireRole('nurse')
   ```

### Security Notes

⚠️ **Important**: The current cookie-based session is for demonstration only!

For production:
1. **Use NextAuth.js** or similar library
2. **Implement server-side session validation** with database
3. **Use secure HTTP-only cookies**
4. **Add CSRF protection**
5. **Implement logout functionality** (clear session)
6. **Add logout endpoint** to reset cookies

Example production approach with NextAuth:
```typescript
import { auth } from '@/lib/auth'

export async function getUserRole() {
  const session = await auth()
  return session?.user?.role || 'guest'
}
```

### File Structure Summary

```
src/
├── lib/
│   └── role.ts                    # RBAC helpers
├── components/
│   ├── admin/
│   │   ├── dashboard-admin.tsx    # Admin dashboard
│   │   ├── releasing-admin.tsx    # Admin releasing
│   │   └── dashboard-releasing.tsx
│   ├── user/
│   │   ├── releasing.tsx          # User ticket status
│   │   ├── call-number.tsx        # User call monitor
│   │   └── monitor.tsx            # User queue status
│   └── ui/
│       └── sidebar.tsx            # shadcn UI sidebar
└── app/
    ├── (admin)/
    │   ├── layout.tsx             # Admin layout (role protected)
    │   ├── dashboard/
    │   │   └── page.tsx
    │   └── releasing/
    │       └── page.tsx
    └── user/                      # URL prefix for user routes
        ├── layout.tsx             # User layout (role protected)
        ├── releasing/
        │   └── page.tsx
        ├── call-number/
        │   └── page.tsx
        └── monitor/
            └── page.tsx
```

### Next Steps

1. Replace cookie-based session with proper auth solution (NextAuth.js recommended)
2. Implement actual database user roles
3. Add logout functionality
4. Implement server actions for admin features with role validation
5. Add middleware for additional security checks
6. Implement audit logging for admin actions
