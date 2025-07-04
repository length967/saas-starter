import { NextRequest } from 'next/server';
import { withApiVersioning, withAgentAuth } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/responses';
import { db } from '@/lib/db/drizzle';
import { agents, agentTelemetry } from '@/lib/db/tcp-schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// POST /api/v1/tcp/telemetry - Submit telemetry data (agent auth required)
export async function POST(req: NextRequest) {
  return withApiVersioning(req, async () => {
    return withAgentAuth(req, async (agentContext) => {
      try {
        const body = await req.json();

        // Validate telemetry data
        if (!body.metrics || typeof body.metrics !== 'object') {
          return errorResponse('bad_request', 'Metrics object is required');
        }

        // Update agent last seen and status
        await db
          .update(agents)
          .set({
            status: 'online',
            lastSeen: new Date(),
            metadata: {
              ...agentContext.agent.metadata,
              lastTelemetry: body.metrics
            }
          })
          .where(eq(agents.id, agentContext.agent.id));

        // Store telemetry data
        const telemetryId = createId();
        await db.insert(agentTelemetry).values({
          id: telemetryId,
          agentId: agentContext.agent.id,
          timestamp: new Date(),
          metrics: {
            throughput: body.metrics.throughput || 0,
            rtt: body.metrics.rtt || null,
            packetLoss: body.metrics.packetLoss || 0,
            congestionWindow: body.metrics.congestionWindow || null,
            bufferUtilization: body.metrics.bufferUtilization || 0,
            cpuUsage: body.metrics.cpuUsage || 0,
            memoryUsage: body.metrics.memoryUsage || 0,
            diskUsage: body.metrics.diskUsage || 0,
            activeStreams: body.metrics.activeStreams || 0,
            ...body.metrics
          },
          metadata: body.metadata || {}
        });

        // Check subscription tier for telemetry frequency
        // This would normally check the company's subscription
        const allowedFrequency = 1000; // 1 second for enterprise

        return successResponse({
          accepted: true,
          telemetryId,
          nextSubmissionAfter: new Date(Date.now() + allowedFrequency).toISOString(),
          frequencyMs: allowedFrequency
        }, 'Telemetry data accepted');
      } catch (error) {
        console.error('Error submitting telemetry:', error);
        return errorResponse('internal', 'Failed to submit telemetry');
      }
    });
  });
}

// GET /api/v1/tcp/telemetry - Get telemetry data (user auth required)
export async function GET(req: NextRequest) {
  return withApiVersioning(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const agentId = searchParams.get('agentId');
      const duration = searchParams.get('duration') || '3600'; // Default 1 hour
      
      if (!agentId) {
        return errorResponse('bad_request', 'Agent ID is required');
      }

      // TODO: Add user authentication and permission check here
      // For now, we'll just return the data

      const since = new Date(Date.now() - parseInt(duration) * 1000);

      const telemetryData = await db
        .select()
        .from(agentTelemetry)
        .where(
          and(
            eq(agentTelemetry.agentId, agentId),
            gte(agentTelemetry.timestamp, since)
          )
        )
        .orderBy(desc(agentTelemetry.timestamp))
        .limit(1000); // Limit to prevent huge responses

      return successResponse({
        agentId,
        duration: parseInt(duration),
        dataPoints: telemetryData.length,
        telemetry: telemetryData
      });
    } catch (error) {
      console.error('Error fetching telemetry:', error);
      return errorResponse('internal', 'Failed to fetch telemetry');
    }
  });
}