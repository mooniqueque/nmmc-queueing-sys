/**
 * Role-Based Access Control (RBAC) helpers
 * Provides utilities for checking user roles and enforcing access control
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/database/auth';

export type UserRole = 'admin' | 'user' | 'guest';

/**
 * Read the role from the BetterAuth session. This is now the
 * single source of truth for authorization and removes the need
 * for manually‑managed cookies.
 */
export async function getUserRole(): Promise<UserRole> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = session?.user?.role as string | undefined;

    if (role === 'ADMIN') return 'admin';
    if (role) return 'user';
    return 'guest';
  } catch (error) {
    console.error('Error getting user role from session:', error);
    return 'guest';
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * Check if the current user is a regular user
 */
export async function isUser(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'user';
}

/**
 * Client-side role helpers remain the same; you can still pass in the
 * role value obtained from a server component or session endpoint.
 */
export function isAdminClient(role: UserRole | null): boolean {
  return role === 'admin';
}

export function isUserClient(role: UserRole | null): boolean {
  return role === 'user';
}

/**
 * Require a specific role - redirects to home if user doesn't have it
 * Use this at the top of server components to protect pages
 */
export async function requireRole(requiredRole: UserRole): Promise<UserRole> {
  if (requiredRole === 'guest') {
    return 'guest';
  }

  const role = await getUserRole();

  // Check role hierarchy
  if (requiredRole === 'admin' && role !== 'admin') {
    redirect('/login');
  }

  if (requiredRole === 'user' && role === 'guest') {
    redirect('/login');
  }

  return role;
}

/**
 * Get full session info from BetterAuth.
 * This replaces the old cookie‑parsing placeholder and ensures the
 * data comes straight from the auth database.
 */
export async function getUserInfo() {
  const session = await auth.api.getSession({ headers: await headers() });
  return {
    name: session?.user?.name || 'User',
    email: session?.user?.email || 'user@example.com',
    role: session?.user?.role === 'ADMIN' ? 'admin' : session?.user?.role ? 'user' : 'guest',
  };
}
