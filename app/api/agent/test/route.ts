import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/auth/tcp-middleware';
import { db } from '@/lib/db/drizzle';
import { projects } from '@/lib/db/tcp-schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const agentContext = await authenticateAgent(authHeader);
    
    if (!agentContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get project details
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, agentContext.agent.projectId))
      .limit(1);
    
    return NextResponse.json({
      message: 'Agent authenticated successfully',
      agent: {
        id: agentContext.agent.agentId,
        name: agentContext.agent.name,
        capabilities: agentContext.agent.capabilities,
      },
      project: {
        id: project?.id,
        name: project?.name,
        slug: project?.slug,
      },
    });
  } catch (error) {
    console.error('Agent test endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}