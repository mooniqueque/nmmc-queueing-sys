/**
 * Role-Based Access Control (RBAC) helpers
 * Provides utilities for checking user roles and enforcing access control
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type UserRole = 'admin' | 'user' | 'guest';

/**
 * Get the current user's role from the session
 * In a real app, this would query your auth session/database
 * For now, we use a simple cookie-based approach
 */
export async function getUserRole(): Promise<UserRole> {
  try {
    const headersList = await headers();
    const cookie = headersList.get('cookie');

    // Check for userRole in cookies (set during login)
    // In production, validate this with a real session store/JWT
    if (cookie) {
      const roleMatch = cookie.match(/userRole=([^;]+)/);
      if (roleMatch && (roleMatch[1] === 'admin' || roleMatch[1] === 'user')) {
        return roleMatch[1] as UserRole;
      }
    }

    return 'guest';
  } catch (error) {
    console.error('Error getting user role:', error);
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
 * Client-side role check (requires session data passed from server)
 * Use this in client components after fetching role from parent server component
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
 * Get user info from session (placeholder)
 * Replace with actual session query in production
 */
export async function getUserInfo() {
  const headersList = await headers();
  const cookie = headersList.get('cookie');

  const userMatch = cookie?.match(/userName=([^;]+)/);
  const userEmail = cookie?.match(/userEmail=([^;]+)/);
  const userRole = cookie?.match(/userRole=([^;]+)/);

  return {
    name: userMatch ? decodeURIComponent(userMatch[1]) : 'User',
    email: userEmail ? decodeURIComponent(userEmail[1]) : 'user@example.com',
    role: (userRole?.[1] as UserRole) || 'guest',
  };
}
