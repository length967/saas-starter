import { NextRequest } from 'next/server';
import { withApiVersioning } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/responses';
import { getUser } from '@/lib/db/queries';
import { getUserWithCompanyAndProjects } from '@/lib/db/tcp-queries';
import { db } from '@/lib/db/drizzle';
import { agents, agentRegistrationTokens } from '@/lib/db/tcp-schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { sign } from 'jsonwebtoken';

// POST /api/v1/tcp/agents/:id/register - Generate registration token for agent
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiVersioning(req, async () => {
    try {
      // Get authenticated user from cookies
      const user = await getUser();
      if (!user) {
        return errorResponse('unauthorized', 'Authentication required');
      }

      const agentId = params.id;

      // Get the agent
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1);

      if (!agent) {
        return errorResponse('not_found', 'Agent not found');
      }

      // Verify user has access to this agent's project
      const userContext = await getUserWithCompanyAndProjects(user.id);
      if (!userContext) {
        return errorResponse('not_found', 'User context not found');
      }

      const projectMembership = userContext.projectMemberships.find(
        m => m.projectId === agent.projectId
      );

      if (!projectMembership) {
        return errorResponse('forbidden', 'Access denied to this agent');
      }

      // Check if user has permission to manage agents
      const canManageAgent = ['project_owner', 'project_admin'].includes(projectMembership.projectRole);
      if (!canManageAgent) {
        return errorResponse('forbidden', 'Insufficient permissions to manage agents');
      }

      // Delete any existing registration tokens for this agent
      await db
        .delete(agentRegistrationTokens)
        .where(eq(agentRegistrationTokens.agentId, agentId));

      // Generate new registration token
      const tokenId = createId();
      const token = sign(
        {
          tokenId,
          agentId,
          projectId: agent.projectId,
          type: 'registration'
        },
        process.env.JWT_SECRET || 'development-secret',
        { expiresIn: '15m' }
      );

      // Store token in database
      await db.insert(agentRegistrationTokens).values({
        id: tokenId,
        agentId,
        token,
        createdBy: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        createdAt: new Date()
      });

      return successResponse({
        token,
        agentId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        agentName: agent.name
      }, 'Registration token generated successfully');
    } catch (error) {
      console.error('Error generating registration token:', error);
      return errorResponse('internal', 'Failed to generate registration token');
    }
  });
}