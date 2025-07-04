import { eq, and, or, desc, asc } from 'drizzle-orm';
import { db } from './drizzle';
import {
  users,
  companies,
  projects,
  companyMembers,
  projectMembers,
  agents,
  agentActivityLogs,
  companyInvitations,
  projectInvitations,
  User,
  Company,
  Project,
  CompanyMember,
  ProjectMember,
  Agent,
} from './tcp-schema';
import { getAuthenticatedUser } from '@/lib/auth/tcp-middleware';

// User queries
export async function getUserById(userId: number): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return user || null;
}

// Company queries
export async function getCompaniesForUser(userId: number) {
  return await db
    .select({
      company: companies,
      membership: companyMembers,
    })
    .from(companyMembers)
    .innerJoin(companies, eq(companyMembers.companyId, companies.id))
    .where(eq(companyMembers.userId, userId))
    .orderBy(asc(companies.name));
}

export async function getCompanyById(companyId: number): Promise<Company | null> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  
  return company || null;
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  
  return company || null;
}

export async function getCompanyMembers(companyId: number) {
  return await db
    .select({
      member: companyMembers,
      user: users,
    })
    .from(companyMembers)
    .innerJoin(users, eq(companyMembers.userId, users.id))
    .where(eq(companyMembers.companyId, companyId))
    .orderBy(asc(users.name));
}

// Project queries
export async function getProjectsForCompany(companyId: number) {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.companyId, companyId))
    .orderBy(asc(projects.name));
}

export async function getProjectsForUser(userId: number) {
  return await db
    .select({
      project: projects,
      membership: projectMembers,
      company: companies,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .innerJoin(companies, eq(projects.companyId, companies.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(asc(projects.name));
}

export async function getProjectById(projectId: number): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  return project || null;
}

export async function getProjectBySlug(companyId: number, slug: string): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.companyId, companyId),
        eq(projects.slug, slug)
      )
    )
    .limit(1);
  
  return project || null;
}

export async function getProjectMembers(projectId: number) {
  return await db
    .select({
      member: projectMembers,
      user: users,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))
    .orderBy(asc(users.name));
}

// Agent queries
export async function getAgentsForProject(projectId: number) {
  return await db
    .select()
    .from(agents)
    .where(
      and(
        eq(agents.projectId, projectId),
        eq(agents.isActive, true)
      )
    )
    .orderBy(asc(agents.name));
}

export async function getAgentById(agentId: number): Promise<Agent | null> {
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);
  
  return agent || null;
}

export async function getAgentByAgentId(agentId: string): Promise<Agent | null> {
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);
  
  return agent || null;
}

export async function getAgentActivityLogs(agentId: number, limit = 100) {
  return await db
    .select()
    .from(agentActivityLogs)
    .where(eq(agentActivityLogs.agentId, agentId))
    .orderBy(desc(agentActivityLogs.timestamp))
    .limit(limit);
}

// Membership queries
export async function getUserCompanyRole(userId: number, companyId: number): Promise<string | null> {
  const [membership] = await db
    .select()
    .from(companyMembers)
    .where(
      and(
        eq(companyMembers.userId, userId),
        eq(companyMembers.companyId, companyId)
      )
    )
    .limit(1);
  
  return membership?.role || null;
}

export async function getUserProjectRole(userId: number, projectId: number): Promise<string | null> {
  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.userId, userId),
        eq(projectMembers.projectId, projectId)
      )
    )
    .limit(1);
  
  return membership?.role || null;
}

// Invitation queries
export async function getCompanyInvitation(token: string) {
  const [invitation] = await db
    .select({
      invitation: companyInvitations,
      company: companies,
      invitedBy: users,
    })
    .from(companyInvitations)
    .innerJoin(companies, eq(companyInvitations.companyId, companies.id))
    .innerJoin(users, eq(companyInvitations.invitedBy, users.id))
    .where(
      and(
        eq(companyInvitations.token, token),
        eq(companyInvitations.status, 'pending')
      )
    )
    .limit(1);
  
  return invitation || null;
}

export async function getProjectInvitation(token: string) {
  const [invitation] = await db
    .select({
      invitation: projectInvitations,
      project: projects,
      company: companies,
      invitedBy: users,
    })
    .from(projectInvitations)
    .innerJoin(projects, eq(projectInvitations.projectId, projects.id))
    .innerJoin(companies, eq(projects.companyId, companies.id))
    .innerJoin(users, eq(projectInvitations.invitedBy, users.id))
    .where(
      and(
        eq(projectInvitations.token, token),
        eq(projectInvitations.status, 'pending')
      )
    )
    .limit(1);
  
  return invitation || null;
}

// Complex queries for user context
export async function getUserFullContext(userId: number) {
  const user = await getUserById(userId);
  if (!user) return null;
  
  const companies = await getCompaniesForUser(userId);
  const projects = await getProjectsForUser(userId);
  
  return {
    user,
    companies,
    projects,
  };
}

// Check if user can access a company
export async function canUserAccessCompany(userId: number, companyId: number): Promise<boolean> {
  const role = await getUserCompanyRole(userId, companyId);
  return role !== null;
}

// Check if user can access a project
export async function canUserAccessProject(userId: number, projectId: number): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);
  return role !== null;
}