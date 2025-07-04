import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, CommonErrors } from '@/lib/api/responses';
import { Agent, UpdateAgentRequest, AgentStatus, AgentType } from '@/lib/api/types';

// Mock data - in production, this would come from a database
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Web Crawler Agent',
    type: AgentType.CRAWLER,
    status: AgentStatus.ACTIVE,
    capabilities: ['web-scraping', 'data-extraction'],
    configuration: {
      maxConcurrency: 5,
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
    },
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/v1/agents/:id - Get a specific agent
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const agent = mockAgents.find(a => a.id === params.id);
    
    if (!agent) {
      return CommonErrors.notFound('Agent');
    }

    return successResponse(agent);
  } catch (error) {
    console.error('Error getting agent:', error);
    return CommonErrors.internalError('Failed to get agent');
  }
});

// PUT /api/v1/agents/:id - Update an agent
export const PUT = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body: UpdateAgentRequest = await request.json();
    
    const agentIndex = mockAgents.findIndex(a => a.id === params.id);
    
    if (agentIndex === -1) {
      return CommonErrors.notFound('Agent');
    }

    // Validate status if provided
    if (body.status && !Object.values(AgentStatus).includes(body.status)) {
      return CommonErrors.badRequest('Invalid agent status', {
        validStatuses: Object.values(AgentStatus),
      });
    }

    // Update agent
    const updatedAgent: Agent = {
      ...mockAgents[agentIndex],
      ...(body.name && { name: body.name }),
      ...(body.status && { status: body.status }),
      ...(body.capabilities && { capabilities: body.capabilities }),
      ...(body.configuration && { 
        configuration: { 
          ...mockAgents[agentIndex].configuration, 
          ...body.configuration 
        } 
      }),
      ...(body.metadata && { 
        metadata: { 
          ...mockAgents[agentIndex].metadata, 
          ...body.metadata 
        } 
      }),
      updatedAt: new Date().toISOString(),
    };

    mockAgents[agentIndex] = updatedAgent;

    return successResponse(updatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return CommonErrors.internalError('Failed to update agent');
  }
});

// DELETE /api/v1/agents/:id - Delete an agent
export const DELETE = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const agentIndex = mockAgents.findIndex(a => a.id === params.id);
    
    if (agentIndex === -1) {
      return CommonErrors.notFound('Agent');
    }

    // Remove agent
    mockAgents.splice(agentIndex, 1);

    return successResponse({ message: 'Agent deleted successfully' }, undefined, 204);
  } catch (error) {
    console.error('Error deleting agent:', error);
    return CommonErrors.internalError('Failed to delete agent');
  }
});