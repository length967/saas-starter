import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { agents, agentActivityLogs, projects } from '@/lib/db/tcp-schema';
import { eq, and } from 'drizzle-orm';
import { 
  generateAgentSecret, 
  hashAgentSecret, 
  signAgentToken,
  compareAgentSecrets 
} from '@/lib/auth/tcp-session';
import { ActivityType } from '@/lib/db/tcp-schema';

const registerSchema = z.object({
  registrationToken: z.string(),
  agentName: z.string().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const { registrationToken, agentName } = result.data;
    
    // Find agent by registration token
    const [agent] = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.registrationToken, registrationToken),
          eq(agents.isActive, true)
        )
      )
      .limit(1);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid registration token' },
        { status: 401 }
      );
    }
    
    // Check if token is expired
    if (agent.registrationTokenExpiresAt && new Date(agent.registrationTokenExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Registration token has expired' },
        { status: 401 }
      );
    }
    
    // Generate new secret for the agent
    const secret = await generateAgentSecret();
    const secretHash = await hashAgentSecret(secret);
    
    // Update agent with new secret and clear registration token
    await db
      .update(agents)
      .set({
        name: agentName,
        secretHash,
        registrationToken: null,
        registrationTokenExpiresAt: null,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agent.id));
    
    // Log the registration
    await db.insert(agentActivityLogs).values({
      agentId: agent.id,
      action: ActivityType.REGISTER_AGENT,
      metadata: { agentName },
      timestamp: new Date(),
    });
    
    // Generate JWT for the agent
    const token = await signAgentToken(agent, secret);
    
    // Get project info for response
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, agent.projectId))
      .limit(1);
    
    return NextResponse.json({
      success: true,
      agent: {
        id: agent.agentId,
        name: agentName,
        projectId: agent.projectId,
        projectSlug: project?.slug,
      },
      credentials: {
        agentId: agent.agentId,
        secret: secret, // Only returned once during registration
        token: token, // Initial JWT token
      },
      message: 'Agent registered successfully. Store the secret securely - it cannot be retrieved again.',
    });
  } catch (error) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}