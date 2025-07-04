import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, errorResponse, paginatedResponse, CommonErrors } from '@/lib/api/responses';
import { Agent, CreateAgentRequest, AgentStatus, AgentType } from '@/lib/api/types';

// Mock data for demonstration
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

// GET /api/v1/agents - List all agents
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Filter agents based on query parameters
    let filteredAgents = [...mockAgents];
    
    if (status) {
      filteredAgents = filteredAgents.filter(agent => agent.status === status);
    }
    
    if (type) {
      filteredAgents = filteredAgents.filter(agent => agent.type === type);
    }

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedAgents = filteredAgents.slice(start, end);

    return paginatedResponse(
      paginatedAgents,
      page,
      pageSize,
      filteredAgents.length
    );
  } catch (error) {
    console.error('Error listing agents:', error);
    return CommonErrors.internalError('Failed to list agents');
  }
});

// POST /api/v1/agents - Create a new agent
export const POST = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const body: CreateAgentRequest = await request.json();

    // Validate request body
    if (!body.name || !body.type || !body.capabilities || !body.configuration) {
      return CommonErrors.badRequest('Missing required fields', {
        required: ['name', 'type', 'capabilities', 'configuration'],
      });
    }

    // Validate agent type
    if (!Object.values(AgentType).includes(body.type)) {
      return CommonErrors.badRequest('Invalid agent type', {
        validTypes: Object.values(AgentType),
      });
    }

    // Create new agent
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: body.name,
      type: body.type,
      status: AgentStatus.ACTIVE,
      capabilities: body.capabilities,
      configuration: body.configuration,
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, save to database
    mockAgents.push(newAgent);

    return successResponse(newAgent, undefined, 201);
  } catch (error) {
    console.error('Error creating agent:', error);
    return CommonErrors.internalError('Failed to create agent');
  }
});