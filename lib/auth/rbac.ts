import { CompanyRole, ProjectRole } from '@/lib/db/tcp-schema';
import { getUserSession } from './tcp-session';

// Permission maps for company roles
const companyPermissions: Record<CompanyRole, string[]> = {
  [CompanyRole.OWNER]: [
    'company:read',
    'company:update',
    'company:delete',
    'company:billing',
    'company:members:read',
    'company:members:write',
    'company:members:delete',
    'company:projects:create',
    'company:projects:delete',
    'company:invites:create',
    'company:invites:revoke',
  ],
  [CompanyRole.BILLING_ADMIN]: [
    'company:read',
    'company:billing',
    'company:members:read',
    'company:projects:read',
  ],
  [CompanyRole.ADMIN]: [
    'company:read',
    'company:update',
    'company:members:read',
    'company:members:write',
    'company:projects:create',
    'company:invites:create',
    'company:invites:revoke',
  ],
  [CompanyRole.MEMBER]: [
    'company:read',
    'company:members:read',
    'company:projects:read',
  ],
};

// Permission maps for project roles
const projectPermissions: Record<ProjectRole, string[]> = {
  [ProjectRole.PROJECT_OWNER]: [
    'project:read',
    'project:update',
    'project:delete',
    'project:members:read',
    'project:members:write',
    'project:members:delete',
    'project:agents:create',
    'project:agents:read',
    'project:agents:update',
    'project:agents:delete',
    'project:invites:create',
    'project:invites:revoke',
    'project:data:read',
    'project:data:write',
    'project:data:delete',
  ],
  [ProjectRole.PROJECT_ADMIN]: [
    'project:read',
    'project:update',
    'project:members:read',
    'project:members:write',
    'project:agents:create',
    'project:agents:read',
    'project:agents:update',
    'project:invites:create',
    'project:data:read',
    'project:data:write',
  ],
  [ProjectRole.DEVELOPER]: [
    'project:read',
    'project:members:read',
    'project:agents:read',
    'project:agents:update',
    'project:data:read',
    'project:data:write',
  ],
  [ProjectRole.ANALYST]: [
    'project:read',
    'project:members:read',
    'project:agents:read',
    'project:data:read',
  ],
};

// Check if a user has a specific permission at company level
export function hasCompanyPermission(role: string, permission: string): boolean {
  const permissions = companyPermissions[role as CompanyRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

// Check if a user has a specific permission at project level
export function hasProjectPermission(role: string, permission: string): boolean {
  const permissions = projectPermissions[role as ProjectRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

// Check if current user has company permission
export async function checkCompanyPermission(permission: string): Promise<boolean> {
  const session = await getUserSession();
  if (!session || !session.company) return false;
  return hasCompanyPermission(session.company.role, permission);
}

// Check if current user has project permission
export async function checkProjectPermission(permission: string): Promise<boolean> {
  const session = await getUserSession();
  if (!session || !session.project) return false;
  return hasProjectPermission(session.project.role, permission);
}

// Middleware to require company permission
export async function requireCompanyPermission(permission: string) {
  const hasPermission = await checkCompanyPermission(permission);
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
}

// Middleware to require project permission
export async function requireProjectPermission(permission: string) {
  const hasPermission = await checkProjectPermission(permission);
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
}

// Get all permissions for a company role
export function getCompanyPermissions(role: CompanyRole): string[] {
  return companyPermissions[role] || [];
}

// Get all permissions for a project role
export function getProjectPermissions(role: ProjectRole): string[] {
  return projectPermissions[role] || [];
}

// Check if a role can perform an action on another role (for role changes)
export function canManageCompanyRole(actorRole: CompanyRole, targetRole: CompanyRole): boolean {
  // Only owners can manage other owners or billing admins
  if (targetRole === CompanyRole.OWNER || targetRole === CompanyRole.BILLING_ADMIN) {
    return actorRole === CompanyRole.OWNER;
  }
  
  // Admins can manage members
  if (targetRole === CompanyRole.MEMBER) {
    return actorRole === CompanyRole.OWNER || actorRole === CompanyRole.ADMIN;
  }
  
  // Admins can manage other admins only if they're owners
  if (targetRole === CompanyRole.ADMIN) {
    return actorRole === CompanyRole.OWNER;
  }
  
  return false;
}

export function canManageProjectRole(actorRole: ProjectRole, targetRole: ProjectRole): boolean {
  // Only project owners can manage other project owners or admins
  if (targetRole === ProjectRole.PROJECT_OWNER || targetRole === ProjectRole.PROJECT_ADMIN) {
    return actorRole === ProjectRole.PROJECT_OWNER;
  }
  
  // Project admins can manage developers and analysts
  if (targetRole === ProjectRole.DEVELOPER || targetRole === ProjectRole.ANALYST) {
    return actorRole === ProjectRole.PROJECT_OWNER || actorRole === ProjectRole.PROJECT_ADMIN;
  }
  
  return false;
}