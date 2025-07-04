import { NextRequest } from 'next/server';
import { withApiVersioning } from '@/lib/api/middleware';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api/responses';
import { extractPaginationParams } from '@/lib/api/utils';
import { getUser } from '@/lib/db/queries';
import { getUserWithCompanyAndProjects } from '@/lib/db/tcp-queries';
import { db } from '@/lib/db/drizzle';
import { agents } from '@/lib/db/tcp-schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// GET /api/v1/tcp/agents - List agents for authenticated user's projects
export async function GET(req: NextRequest) {
  return withApiVersioning(req, async () => {
    try {
      // Get authenticated user from cookies
      const user = await getUser();
      if (!user) {
        return errorResponse('unauthorized', 'Authentication required');
      }

      // Get user with full context
      const userContext = await getUserWithCompanyAndProjects(user.id);
      if (!userContext) {
        return errorResponse('not_found', 'User context not found');
      }

      const { page, limit } = extractPaginationParams(req);
      const projectId = req.nextUrl.searchParams.get('projectId');
      const status = req.nextUrl.searchParams.get('status');

      // Build query conditions
      const conditions = [];
      
      if (projectId) {
        // Check if user has access to this project
        const hasAccess = userContext.projectMemberships.some(m => m.projectId === projectId);
        if (!hasAccess) {
          return errorResponse('forbidden', 'Access denied to this project');
        }
        conditions.push(eq(agents.projectId, projectId));
      } else {
        // Get all projects user has access to
        const projectIds = userContext.projectMemberships.map(m => m.projectId);
        if (projectIds.length === 0) {
          return paginatedResponse([], page, limit, 0);
        }
        conditions.push(inArray(agents.projectId, projectIds));
      }

      if (status) {
        conditions.push(eq(agents.status, status as any));
      }

      // Fetch agents
      const agentsList = await db
        .select()
        .from(agents)
        .where(and(...conditions))
        .orderBy(desc(agents.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      // Get total count
      const totalResult = await db
        .select({ count: db.$count(agents) })
        .from(agents)
        .where(and(...conditions));

      const total = totalResult[0]?.count || 0;

      // Remove sensitive data
      const sanitizedAgents = agentsList.map(agent => {
        const { jwtSecret, ...rest } = agent;
        return rest;
      });

      return paginatedResponse(
        sanitizedAgents,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Error fetching agents:', error);
      return errorResponse('internal', 'Failed to fetch agents');
    }
  });
}

// POST /api/v1/tcp/agents - Create a new agent
export async function POST(req: NextRequest) {
  return withApiVersioning(req, async () => {
    try {
      // Get authenticated user from cookies
      const user = await getUser();
      if (!user) {
        return errorResponse('unauthorized', 'Authentication required');
      }

      const body = await req.json();
      
      // Validate required fields
      if (!body.name || !body.projectId) {
        return errorResponse('bad_request', 'Name and projectId are required');
      }

      // Verify user has access to create agents in this project
      const userContext = await getUserWithCompanyAndProjects(user.id);
      if (!userContext) {
        return errorResponse('not_found', 'User context not found');
      }

      const projectMembership = userContext.projectMemberships.find(
        m => m.projectId === body.projectId
      );

      if (!projectMembership) {
        return errorResponse('forbidden', 'Access denied to this project');
      }

      // Check if user has permission to create agents
      const canCreateAgent = ['project_owner', 'project_admin'].includes(projectMembership.projectRole);
      if (!canCreateAgent) {
        return errorResponse('forbidden', 'Insufficient permissions to create agents');
      }

      // Generate unique JWT secret for this agent
      const jwtSecret = createId() + '-' + createId(); // Extra long for security

      // Create new agent
      const agentId = createId();
      const newAgent = {
        id: agentId,
        projectId: body.projectId,
        name: body.name,
        hostname: body.hostname || null,
        ipAddress: body.ipAddress || null,
        port: body.port || 8443,
        status: 'offline' as const,
        type: body.type || 'tcp-agent',
        version: body.version || null,
        os: body.os || null,
        location: body.location || null,
        description: body.description || null,
        jwtSecret,
        lastSeen: null,
        capabilities: body.capabilities || {},
        metadata: body.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(agents).values(newAgent);

      // Don't return JWT secret in response
      const { jwtSecret: _, ...agentResponse } = newAgent;

      return successResponse(agentResponse, 'Agent created successfully');
    } catch (error) {
      console.error('Error creating agent:', error);
      return errorResponse('internal', 'Failed to create agent');
    }
  });
}