'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  companies,
  projects,
  companyMembers,
  projectMembers,
  companyInvitations,
  projectInvitations,
  type NewUser,
  type NewCompany,
  type NewCompanyMember,
  type NewCompanyInvitation,
  CompanyRole,
  ActivityType,
} from '@/lib/db/tcp-schema';
import {
  comparePasswords,
  hashPassword,
  setUserSession,
  clearSession,
  generateRegistrationToken,
} from '@/lib/auth/tcp-session';
import { redirect } from 'next/navigation';
import { createCheckoutSession } from '@/lib/payments/stripe';
import {
  getUserByEmail,
  getCompanyInvitation,
  getProjectInvitation,
} from '@/lib/db/tcp-queries';
import {
  validatedAction,
  validatedActionWithUser,
  validatedActionWithCompany,
} from '@/lib/auth/tcp-middleware';

// Helper to generate unique slugs
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

async function ensureUniqueSlug(table: any, baseSlug: string, companyId?: number): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const query = companyId 
      ? db.select().from(table).where(and(eq(table.slug, slug), eq(table.companyId, companyId)))
      : db.select().from(table).where(eq(table.slug, slug));
    
    const existing = await query.limit(1);
    
    if (existing.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Sign in with company/project context
const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
  companySlug: z.string().optional(),
  projectSlug: z.string().optional(),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password, companySlug, projectSlug } = data;
  
  const user = await getUserByEmail(email);
  if (!user) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }
  
  const isPasswordValid = await comparePasswords(password, user.passwordHash);
  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }
  
  // Get user's companies
  const userCompanies = await db
    .select({
      company: companies,
      member: companyMembers,
    })
    .from(companyMembers)
    .innerJoin(companies, eq(companyMembers.companyId, companies.id))
    .where(eq(companyMembers.userId, user.id!));
  
  if (userCompanies.length === 0) {
    return {
      error: 'User is not associated with any company.',
      email,
      password,
    };
  }
  
  // Determine which company to use
  let selectedCompany = userCompanies[0];
  if (companySlug) {
    const found = userCompanies.find(uc => uc.company.slug === companySlug);
    if (found) {
      selectedCompany = found;
    }
  }
  
  // Set up session context
  let companyContext = {
    id: selectedCompany.company.id,
    slug: selectedCompany.company.slug,
    role: selectedCompany.member.role,
  };
  
  let projectContext;
  if (projectSlug) {
    const userProjects = await db
      .select({
        project: projects,
        member: projectMembers,
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(
        and(
          eq(projectMembers.userId, user.id!),
          eq(projects.companyId, selectedCompany.company.id),
          eq(projects.slug, projectSlug)
        )
      );
    
    if (userProjects.length > 0) {
      projectContext = {
        id: userProjects[0].project.id,
        slug: userProjects[0].project.slug,
        role: userProjects[0].member.role,
      };
    }
  }
  
  await setUserSession(user as User & { id: number }, companyContext, projectContext);
  
  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: selectedCompany.company, priceId });
  }
  
  redirect('/dashboard');
});

// Sign up with optional invitation
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1).max(255).optional(),
  inviteToken: z.string().optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, companyName, inviteToken } = data;
  
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return {
      error: 'An account with this email already exists.',
      email,
      password,
    };
  }
  
  const passwordHash = await hashPassword(password);
  
  // Create user
  const [createdUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
    })
    .returning();
  
  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }
  
  let companyId: number;
  let companySlug: string;
  let userRole: CompanyRole;
  
  if (inviteToken) {
    // Check for company invitation
    const companyInvite = await getCompanyInvitation(inviteToken);
    if (companyInvite && companyInvite.invitation.email === email) {
      companyId = companyInvite.company.id;
      companySlug = companyInvite.company.slug;
      userRole = companyInvite.invitation.role as CompanyRole;
      
      // Accept invitation
      await db
        .update(companyInvitations)
        .set({ status: 'accepted' })
        .where(eq(companyInvitations.id, companyInvite.invitation.id));
    } else {
      // Check for project invitation
      const projectInvite = await getProjectInvitation(inviteToken);
      if (projectInvite && projectInvite.invitation.email === email) {
        companyId = projectInvite.company.id;
        companySlug = projectInvite.company.slug;
        userRole = CompanyRole.MEMBER; // Default company role for project invites
        
        // Add user to company as member
        await db.insert(companyMembers).values({
          companyId,
          userId: createdUser.id,
          role: userRole,
        });
        
        // Add user to project
        await db.insert(projectMembers).values({
          projectId: projectInvite.project.id,
          userId: createdUser.id,
          role: projectInvite.invitation.role,
        });
        
        // Accept invitation
        await db
          .update(projectInvitations)
          .set({ status: 'accepted' })
          .where(eq(projectInvitations.id, projectInvite.invitation.id));
        
        await setUserSession(
          createdUser as User & { id: number },
          { id: companyId, slug: companySlug, role: userRole },
          {
            id: projectInvite.project.id,
            slug: projectInvite.project.slug,
            role: projectInvite.invitation.role,
          }
        );
        
        redirect('/dashboard');
        return;
      } else {
        return { error: 'Invalid or expired invitation.', email, password };
      }
    }
  } else {
    // Create new company
    const name = companyName || `${email.split('@')[0]}'s Company`;
    const slug = await ensureUniqueSlug(companies, generateSlug(name));
    
    const [createdCompany] = await db
      .insert(companies)
      .values({
        name,
        slug,
      })
      .returning();
    
    if (!createdCompany) {
      return {
        error: 'Failed to create company. Please try again.',
        email,
        password,
      };
    }
    
    companyId = createdCompany.id;
    companySlug = createdCompany.slug;
    userRole = CompanyRole.OWNER;
  }
  
  // Add user to company
  await db.insert(companyMembers).values({
    companyId,
    userId: createdUser.id,
    role: userRole,
  });
  
  await setUserSession(
    createdUser as User & { id: number },
    { id: companyId, slug: companySlug, role: userRole }
  );
  
  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);
    
    return createCheckoutSession({ team: company, priceId });
  }
  
  redirect('/dashboard');
});

// Sign out
export async function signOut() {
  await clearSession();
  redirect('/sign-in');
}

// Update password
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, context) => {
    const { currentPassword, newPassword, confirmPassword } = data;
    
    const isPasswordValid = await comparePasswords(
      currentPassword,
      context.user.passwordHash
    );
    
    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.',
      };
    }
    
    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.',
      };
    }
    
    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.',
      };
    }
    
    const newPasswordHash = await hashPassword(newPassword);
    
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, context.user.id));
    
    return {
      success: 'Password updated successfully.',
    };
  }
);

// Switch company context
const switchCompanySchema = z.object({
  companyId: z.number(),
});

export const switchCompany = validatedActionWithUser(
  switchCompanySchema,
  async (data, _, context) => {
    const { companyId } = data;
    
    // Verify user has access to this company
    const [membership] = await db
      .select()
      .from(companyMembers)
      .innerJoin(companies, eq(companyMembers.companyId, companies.id))
      .where(
        and(
          eq(companyMembers.userId, context.user.id),
          eq(companyMembers.companyId, companyId)
        )
      )
      .limit(1);
    
    if (!membership) {
      return { error: 'You do not have access to this company.' };
    }
    
    await setUserSession(
      context.user as User & { id: number },
      {
        id: membership.companies.id,
        slug: membership.companies.slug,
        role: membership.company_members.role,
      }
    );
    
    redirect('/dashboard');
  }
);

// Switch project context
const switchProjectSchema = z.object({
  projectId: z.number(),
});

export const switchProject = validatedActionWithUser(
  switchProjectSchema,
  async (data, _, context) => {
    const { projectId } = data;
    
    // Get project and verify user access
    const [projectData] = await db
      .select({
        project: projects,
        projectMember: projectMembers,
        company: companies,
        companyMember: companyMembers,
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .innerJoin(companies, eq(projects.companyId, companies.id))
      .innerJoin(
        companyMembers,
        and(
          eq(companyMembers.companyId, companies.id),
          eq(companyMembers.userId, context.user.id)
        )
      )
      .where(
        and(
          eq(projectMembers.userId, context.user.id),
          eq(projectMembers.projectId, projectId)
        )
      )
      .limit(1);
    
    if (!projectData) {
      return { error: 'You do not have access to this project.' };
    }
    
    await setUserSession(
      context.user as User & { id: number },
      {
        id: projectData.company.id,
        slug: projectData.company.slug,
        role: projectData.companyMember.role,
      },
      {
        id: projectData.project.id,
        slug: projectData.project.slug,
        role: projectData.projectMember.role,
      }
    );
    
    redirect('/dashboard');
  }
);