import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { agents, agentActivityLogs } from '@/lib/db/tcp-schema';
import { eq, and } from 'drizzle-orm';
import { compareAgentSecrets, signAgentToken } from '@/lib/auth/tcp-session';
import { ActivityType } from '@/lib/db/tcp-schema';

const authenticateSchema = z.object({
  agentId: z.string(),
  secret: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = authenticateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const { agentId, secret } = result.data;
    
    // Find agent
    const [agent] = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.agentId, agentId),
          eq(agents.isActive, true)
        )
      )
      .limit(1);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify secret
    const isValidSecret = await compareAgentSecrets(secret, agent.secretHash);
    if (!isValidSecret) {
      // Log failed attempt
      await db.insert(agentActivityLogs).values({
        agentId: agent.id,
        action: 'AUTHENTICATION_FAILED',
        metadata: { reason: 'Invalid secret' },
        timestamp: new Date(),
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Update last seen
    await db
      .update(agents)
      .set({ lastSeenAt: new Date() })
      .where(eq(agents.id, agent.id));
    
    // Log successful authentication
    await db.insert(agentActivityLogs).values({
      agentId: agent.id,
      action: ActivityType.AGENT_AUTHENTICATED,
      timestamp: new Date(),
    });
    
    // Generate new JWT token
    const token = await signAgentToken(agent, secret);
    
    return NextResponse.json({
      success: true,
      token,
      expiresIn: 86400, // 24 hours in seconds
      agent: {
        id: agent.agentId,
        name: agent.name,
        projectId: agent.projectId,
      },
    });
  } catch (error) {
    console.error('Agent authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}