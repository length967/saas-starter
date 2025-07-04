import { db } from '@/lib/db/supabase-drizzle';
import { 
  companies, 
  projects, 
  agents, 
  users, 
  profiles,
  agentSessions,
  agentTelemetry,
  agentLogs,
  transfers,
  type Company,
  type Project,
  type Agent,
  type User,
  type NewProject,
  type NewAgent,
  type NewAgentSession,
  type NewAgentTelemetry,
  type NewAgentLog
} from '@/lib/db/tcp-schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Service class for TCP Agent Platform operations
 * Ensures proper multi-tenant isolation and type safety
 */
export class TCPService {
  /**
   * Get the current user's company and role
   */
  static async getCurrentUserCompany(userId: string): Promise<{
    company: Company;
    user: User;
  } | null> {
    const result = await db
      .select({
        company: companies,
        user: users,
      })
      .from(users)
      .innerJoin(companies, eq(users.companyId, companies.id))
      .innerJoin(profiles, eq(users.profileId, profiles.id))
      .where(eq(profiles.id, userId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get all projects for a company
   */
  static async getCompanyProjects(companyId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.companyId, companyId),
          eq(projects.status, 'active')
        )
      )
      .orderBy(desc(projects.createdAt));
  }

  /**
   * Create a new project
   */
  static async createProject(
    companyId: string,
    userId: string,
    data: Omit<NewProject, 'companyId' | 'createdBy'>
  ): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({
        ...data,
        companyId,
        createdBy: userId,
      })
      .returning();

    return newProject;
  }

  /**
   * Get all agents for a project
   */
  static async getProjectAgents(
    projectId: string,
    companyId: string
  ): Promise<Agent[]> {
    // Verify project belongs to company
    const project = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.companyId, companyId)
        )
      )
      .limit(1);

    if (!project[0]) {
      throw new Error('Project not found or access denied');
    }

    return await db
      .select()
      .from(agents)
      .where(eq(agents.projectId, projectId))
      .orderBy(desc(agents.createdAt));
  }

  /**
   * Create a new agent
   */
  static async createAgent(
    projectId: string,
    companyId: string,
    data: Omit<NewAgent, 'projectId'>
  ): Promise<Agent> {
    // Verify project belongs to company
    const project = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.companyId, companyId)
        )
      )
      .limit(1);

    if (!project[0]) {
      throw new Error('Project not found or access denied');
    }

    const [newAgent] = await db
      .insert(agents)
      .values({
        ...data,
        projectId,
      })
      .returning();

    return newAgent;
  }

  /**
   * Start an agent session
   */
  static async startAgentSession(
    agentId: string,
    companyId: string,
    sessionData: Omit<NewAgentSession, 'agentId'>
  ): Promise<string> {
    // Verify agent belongs to company
    const agent = await db
      .select()
      .from(agents)
      .innerJoin(projects, eq(agents.projectId, projects.id))
      .where(
        and(
          eq(agents.id, agentId),
          eq(projects.companyId, companyId)
        )
      )
      .limit(1);

    if (!agent[0]) {
      throw new Error('Agent not found or access denied');
    }

    const [session] = await db
      .insert(agentSessions)
      .values({
        ...sessionData,
        agentId,
      })
      .returning();

    // Update agent's last heartbeat
    await db
      .update(agents)
      .set({ lastHeartbeat: new Date() })
      .where(eq(agents.id, agentId));

    return session.id;
  }

  /**
   * Log agent telemetry
   */
  static async logTelemetry(
    agentId: string,
    companyId: string,
    telemetryData: Omit<NewAgentTelemetry, 'agentId'>
  ): Promise<void> {
    // Verify agent belongs to company
    const agent = await db
      .select()
      .from(agents)
      .innerJoin(projects, eq(agents.projectId, projects.id))
      .where(
        and(
          eq(agents.id, agentId),
          eq(projects.companyId, companyId)
        )
      )
      .limit(1);

    if (!agent[0]) {
      throw new Error('Agent not found or access denied');
    }

    await db
      .insert(agentTelemetry)
      .values({
        ...telemetryData,
        agentId,
      });
  }

  /**
   * Log agent messages
   */
  static async logMessage(
    agentId: string,
    companyId: string,
    logData: Omit<NewAgentLog, 'agentId'>
  ): Promise<void> {
    // Verify agent belongs to company
    const agent = await db
      .select()
      .from(agents)
      .innerJoin(projects, eq(agents.projectId, projects.id))
      .where(
        and(
          eq(agents.id, agentId),
          eq(projects.companyId, companyId)
        )
      )
      .limit(1);

    if (!agent[0]) {
      throw new Error('Agent not found or access denied');
    }

    await db
      .insert(agentLogs)
      .values({
        ...logData,
        agentId,
      });
  }

  /**
   * Get agent metrics for a project
   */
  static async getProjectMetrics(
    projectId: string,
    companyId: string
  ): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalSessions: number;
    totalTransfers: number;
  }> {
    // Verify project belongs to company
    const project = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.companyId, companyId)
        )
      )
      .limit(1);

    if (!project[0]) {
      throw new Error('Project not found or access denied');
    }

    const [metrics] = await db
      .select({
        totalAgents: sql<number>`count(distinct ${agents.id})`,
        activeAgents: sql<number>`count(distinct case when ${agents.isActive} then ${agents.id} end)`,
        totalSessions: sql<number>`count(distinct ${agentSessions.id})`,
        totalTransfers: sql<number>`count(distinct ${transfers.id})`,
      })
      .from(agents)
      .leftJoin(agentSessions, eq(agents.id, agentSessions.agentId))
      .leftJoin(transfers, eq(agents.id, transfers.agentId))
      .where(eq(agents.projectId, projectId));

    return {
      totalAgents: Number(metrics.totalAgents) || 0,
      activeAgents: Number(metrics.activeAgents) || 0,
      totalSessions: Number(metrics.totalSessions) || 0,
      totalTransfers: Number(metrics.totalTransfers) || 0,
    };
  }

  /**
   * Check if user has permission for a specific action
   */
  static async checkPermission(
    userId: string,
    companyId: string,
    permission: string
  ): Promise<boolean> {
    const user = await db
      .select()
      .from(users)
      .innerJoin(profiles, eq(users.profileId, profiles.id))
      .where(
        and(
          eq(profiles.id, userId),
          eq(users.companyId, companyId)
        )
      )
      .limit(1);

    if (!user[0]) {
      return false;
    }

    // Owners have all permissions
    if (user[0].users.role === 'owner') {
      return true;
    }

    // Check specific permissions
    const permissions = user[0].users.permissions as string[];
    return permissions.includes(permission) || permissions.includes('*');
  }
}