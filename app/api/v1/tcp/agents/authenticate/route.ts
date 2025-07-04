import { NextRequest, NextResponse } from 'next/server';
import { withApiVersioning } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/responses';
import { db } from '@/lib/db/drizzle';
import { agents, agentRegistrationTokens, agentSessions } from '@/lib/db/tcp-schema';
import { eq, and } from 'drizzle-orm';
import { verify, sign } from 'jsonwebtoken';
import { createId } from '@paralleldrive/cuid2';

// POST /api/v1/tcp/agents/authenticate - Authenticate agent with registration token
export async function POST(req: NextRequest) {
  return withApiVersioning(req, async () => {
    try {
      const body = await req.json();

      // Validate required fields
      if (!body.registrationToken || !body.apiKey) {
        return errorResponse('bad_request', 'Registration token and API key are required');
      }

      // Verify registration token
      let tokenPayload: any;
      try {
        tokenPayload = verify(
          body.registrationToken,
          process.env.JWT_SECRET || 'development-secret'
        );
      } catch (error) {
        return errorResponse('unauthorized', 'Invalid or expired registration token');
      }

      // Find the registration token in database
      const [tokenRecord] = await db
        .select()
        .from(agentRegistrationTokens)
        .where(
          and(
            eq(agentRegistrationTokens.id, tokenPayload.tokenId),
            eq(agentRegistrationTokens.token, body.registrationToken)
          )
        )
        .limit(1);

      if (!tokenRecord) {
        return errorResponse('unauthorized', 'Registration token not found');
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expiresAt) {
        return errorResponse('unauthorized', 'Registration token has expired');
      }

      // Check if token has been used
      if (tokenRecord.usedAt) {
        return errorResponse('unauthorized', 'Registration token has already been used');
      }

      // Get the agent
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, tokenPayload.agentId))
        .limit(1);

      if (!agent) {
        return errorResponse('not_found', 'Agent not found');
      }

      // Mark token as used
      await db
        .update(agentRegistrationTokens)
        .set({ usedAt: new Date() })
        .where(eq(agentRegistrationTokens.id, tokenRecord.id));

      // Update agent with API key
      await db
        .update(agents)
        .set({
          status: 'online',
          lastSeen: new Date(),
          updatedAt: new Date()
        })
        .where(eq(agents.id, agent.id));

      // Create agent session
      const sessionId = createId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Generate JWT token for agent using agent's unique secret
      const agentToken = sign(
        {
          sessionId,
          agentId: agent.id,
          projectId: agent.projectId,
          type: 'agent'
        },
        agent.jwtSecret,
        { expiresIn: '24h' }
      );

      // Generate refresh token
      const refreshToken = sign(
        {
          sessionId,
          agentId: agent.id,
          type: 'refresh'
        },
        agent.jwtSecret,
        { expiresIn: '30d' }
      );

      // Store session
      await db.insert(agentSessions).values({
        id: sessionId,
        agentId: agent.id,
        token: agentToken,
        refreshToken,
        expiresAt,
        metadata: {
          apiKey: body.apiKey,
          registeredVia: 'registration_token',
          userAgent: req.headers.get('user-agent') || null
        },
        createdAt: new Date()
      });

      return successResponse({
        agentId: agent.id,
        projectId: agent.projectId,
        token: agentToken,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
        jwtSecret: agent.jwtSecret // Agent needs this to validate future requests
      }, 'Agent authenticated successfully');
    } catch (error) {
      console.error('Error authenticating agent:', error);
      return errorResponse('internal', 'Failed to authenticate agent');
    }
  });
}

// POST /api/v1/tcp/agents/refresh - Refresh agent token
export async function PUT(req: NextRequest) {
  return withApiVersioning(req, async () => {
    try {
      const body = await req.json();

      if (!body.refreshToken || !body.agentId) {
        return errorResponse('bad_request', 'Refresh token and agent ID are required');
      }

      // Get the agent
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, body.agentId))
        .limit(1);

      if (!agent) {
        return errorResponse('not_found', 'Agent not found');
      }

      // Verify refresh token
      let tokenPayload: any;
      try {
        tokenPayload = verify(body.refreshToken, agent.jwtSecret);
      } catch (error) {
        return errorResponse('unauthorized', 'Invalid or expired refresh token');
      }

      // Find the session
      const [session] = await db
        .select()
        .from(agentSessions)
        .where(
          and(
            eq(agentSessions.id, tokenPayload.sessionId),
            eq(agentSessions.agentId, body.agentId),
            eq(agentSessions.refreshToken, body.refreshToken)
          )
        )
        .limit(1);

      if (!session) {
        return errorResponse('unauthorized', 'Session not found');
      }

      // Generate new tokens
      const newToken = sign(
        {
          sessionId: session.id,
          agentId: agent.id,
          projectId: agent.projectId,
          type: 'agent'
        },
        agent.jwtSecret,
        { expiresIn: '24h' }
      );

      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update session
      await db
        .update(agentSessions)
        .set({
          token: newToken,
          expiresAt: newExpiresAt,
          updatedAt: new Date()
        })
        .where(eq(agentSessions.id, session.id));

      // Update agent last seen
      await db
        .update(agents)
        .set({ lastSeen: new Date() })
        .where(eq(agents.id, agent.id));

      return successResponse({
        token: newToken,
        expiresAt: newExpiresAt.toISOString()
      }, 'Token refreshed successfully');
    } catch (error) {
      console.error('Error refreshing token:', error);
      return errorResponse('internal', 'Failed to refresh token');
    }
  });
}