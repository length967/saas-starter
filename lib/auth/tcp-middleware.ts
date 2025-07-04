import { z } from 'zod';
import { User, CompanyMember, ProjectMember, Agent } from '@/lib/db/tcp-schema';
import { db } from '@/lib/db/drizzle';
import { users, companyMembers, projectMembers, agents } from '@/lib/db/tcp-schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getUserSession, getSessionFromHeader, verifyAgentToken } from './tcp-session';
import { checkCompanyPermission, checkProjectPermission } from './rbac';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

// Context types for actions
export type CompanyContext = {
  company: CompanyMember & {
    id: number;
    slug: string;
    name: string;
  };
  role: string;
};

export type ProjectContext = {
  project: ProjectMember & {
    id: number;
    slug: string;
    name: string;
    companyId: number;
  };
  role: string;
};

export type UserContext = {
  user: User;
  company?: CompanyContext;
  project?: ProjectContext;
};

export type AgentContext = {
  agent: Agent;
  project: {
    id: number;
    companyId: number;
  };
};

// Get user from session
export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await getUserSession();
  if (!session) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return user || null;
}

// Get user with full context
export async function getUserContext(): Promise<UserContext | null> {
  const session = await getUserSession();
  if (!session) return null;

  const user = await getAuthenticatedUser();
  if (!user) return null;

  const context: UserContext = { user };

  // Add company context if present
  if (session.company) {
    const [companyMember] = await db
      .select()
      .from(companyMembers)
      .where(
        and(
          eq(companyMembers.companyId, session.company.id),
          eq(companyMembers.userId, user.id)
        )
      )
      .limit(1);

    if (companyMember) {
      context.company = {
        company: {
          ...companyMember,
          id: session.company.id,
          slug: session.company.slug,
          name: '', // Will be populated by join in real queries
        },
        role: session.company.role,
      };
    }
  }

  // Add project context if present
  if (session.project) {
    const [projectMember] = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, session.project.id),
          eq(projectMembers.userId, user.id)
        )
      )
      .limit(1);

    if (projectMember) {
      context.project = {
        project: {
          ...projectMember,
          id: session.project.id,
          slug: session.project.slug,
          name: '', // Will be populated by join in real queries
          companyId: session.company?.id || 0,
        },
        role: session.project.role,
      };
    }
  }

  return context;
}

// Validated action types
type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  context: UserContext
) => Promise<T>;

type ValidatedActionWithCompanyFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  context: UserContext & Required<Pick<UserContext, 'company'>>
) => Promise<T>;

type ValidatedActionWithProjectFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  context: UserContext & Required<Pick<UserContext, 'project'>>
) => Promise<T>;

// Basic validated action
export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData);
  };
}

// Validated action with authenticated user
export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
    const context = await getUserContext();
    if (!context) {
      redirect('/sign-in');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, context);
  };
}

// Validated action requiring company context
export function validatedActionWithCompany<S extends z.ZodType<any, any>, T>(
  schema: S,
  permission?: string,
  action?: ValidatedActionWithCompanyFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
    const context = await getUserContext();
    if (!context) {
      redirect('/sign-in');
    }

    if (!context.company) {
      return { error: 'No company context. Please select a company.' };
    }

    // Check permission if specified
    if (permission && !(await checkCompanyPermission(permission))) {
      return { error: 'Insufficient permissions' };
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const fullContext = context as UserContext & Required<Pick<UserContext, 'company'>>;
    return action!(result.data, formData, fullContext);
  };
}

// Validated action requiring project context
export function validatedActionWithProject<S extends z.ZodType<any, any>, T>(
  schema: S,
  permission?: string,
  action?: ValidatedActionWithProjectFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
    const context = await getUserContext();
    if (!context) {
      redirect('/sign-in');
    }

    if (!context.project) {
      return { error: 'No project context. Please select a project.' };
    }

    // Check permission if specified
    if (permission && !(await checkProjectPermission(permission))) {
      return { error: 'Insufficient permissions' };
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const fullContext = context as UserContext & Required<Pick<UserContext, 'project'>>;
    return action!(result.data, formData, fullContext);
  };
}

// API route middleware for agent authentication
export async function authenticateAgent(
  authHeader: string | null
): Promise<AgentContext | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // Extract agent ID from token (basic JWT decode without verification first)
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.type !== 'agent' || !payload.agent?.agentId) return null;

    // Get agent and verify token with agent's secret
    const [agent] = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.agentId, payload.agent.agentId),
          eq(agents.isActive, true)
        )
      )
      .limit(1);

    if (!agent) return null;

    // Verify token with agent's secret
    const sessionData = await verifyAgentToken(token, agent.secretHash);
    if (!sessionData) return null;

    // Update last seen
    await db
      .update(agents)
      .set({ lastSeenAt: new Date() })
      .where(eq(agents.id, agent.id));

    return {
      agent,
      project: {
        id: agent.projectId,
        companyId: 0, // Will be populated by join in real usage
      },
    };
  } catch (error) {
    return null;
  }
}

// Wrapper for API routes that require user authentication
export function withUserAuth<T extends any[], R>(
  handler: (context: UserContext, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const context = await getUserContext();
    if (!context) {
      throw new Error('Unauthorized');
    }
    return handler(context, ...args);
  };
}

// Wrapper for API routes that require agent authentication
export function withAgentAuth<T extends any[], R>(
  handler: (context: AgentContext, ...args: T) => Promise<R>
) {
  return async (authHeader: string | null, ...args: T): Promise<R> => {
    const context = await authenticateAgent(authHeader);
    if (!context) {
      throw new Error('Unauthorized');
    }
    return handler(context, ...args);
  };
}

// Wrapper for API routes that accept either user or agent authentication
export function withAuth<T extends any[], R>(
  handler: (context: UserContext | AgentContext, ...args: T) => Promise<R>
) {
  return async (authHeader: string | null, ...args: T): Promise<R> => {
    // Try user auth first (from cookie)
    const userContext = await getUserContext();
    if (userContext) {
      return handler(userContext, ...args);
    }

    // Try agent auth (from header)
    const agentContext = await authenticateAgent(authHeader);
    if (agentContext) {
      return handler(agentContext, ...args);
    }

    throw new Error('Unauthorized');
  };
}