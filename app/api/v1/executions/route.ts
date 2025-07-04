import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, errorResponse, paginatedResponse, CommonErrors } from '@/lib/api/responses';
import { Execution, CreateExecutionRequest, ExecutionStatus } from '@/lib/api/types';

// Mock data for demonstration
const mockExecutions: Execution[] = [];

// GET /api/v1/executions - List all executions
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const agentId = searchParams.get('agentId');
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');

    // Filter executions
    let filteredExecutions = [...mockExecutions];
    
    if (agentId) {
      filteredExecutions = filteredExecutions.filter(exec => exec.agentId === agentId);
    }
    
    if (sessionId) {
      filteredExecutions = filteredExecutions.filter(exec => exec.sessionId === sessionId);
    }
    
    if (status) {
      filteredExecutions = filteredExecutions.filter(exec => exec.status === status);
    }

    // Sort by startedAt descending
    filteredExecutions.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedExecutions = filteredExecutions.slice(start, end);

    return paginatedResponse(
      paginatedExecutions,
      page,
      pageSize,
      filteredExecutions.length
    );
  } catch (error) {
    console.error('Error listing executions:', error);
    return CommonErrors.internalError('Failed to list executions');
  }
});

// POST /api/v1/executions - Create a new execution
export const POST = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const body: CreateExecutionRequest = await request.json();

    // Validate request body
    if (!body.agentId || !body.input) {
      return CommonErrors.badRequest('Missing required fields', {
        required: ['agentId', 'input'],
      });
    }

    // Create new execution
    const newExecution: Execution = {
      id: `exec-${Date.now()}`,
      agentId: body.agentId,
      sessionId: body.sessionId,
      status: ExecutionStatus.PENDING,
      input: body.input,
      metrics: {
        itemsProcessed: 0,
      },
      startedAt: new Date().toISOString(),
    };

    // In a real implementation, save to database and queue for processing
    mockExecutions.push(newExecution);

    // Simulate execution start
    setTimeout(() => {
      const execution = mockExecutions.find(e => e.id === newExecution.id);
      if (execution) {
        execution.status = ExecutionStatus.RUNNING;
      }
    }, 1000);

    return successResponse(newExecution, undefined, 201);
  } catch (error) {
    console.error('Error creating execution:', error);
    return CommonErrors.internalError('Failed to create execution');
  }
});