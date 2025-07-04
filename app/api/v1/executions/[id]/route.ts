import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, CommonErrors } from '@/lib/api/responses';
import { Execution, ExecutionStatus } from '@/lib/api/types';

// Mock data - in production, this would come from a database
const mockExecutions: Execution[] = [];

// GET /api/v1/executions/:id - Get a specific execution
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const execution = mockExecutions.find(e => e.id === params.id);
    
    if (!execution) {
      return CommonErrors.notFound('Execution');
    }

    return successResponse(execution);
  } catch (error) {
    console.error('Error getting execution:', error);
    return CommonErrors.internalError('Failed to get execution');
  }
});

// POST /api/v1/executions/:id/cancel - Cancel an execution
export const POST = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const execution = mockExecutions.find(e => e.id === params.id);
    
    if (!execution) {
      return CommonErrors.notFound('Execution');
    }

    // Check if execution can be cancelled
    if (execution.status === ExecutionStatus.COMPLETED || 
        execution.status === ExecutionStatus.FAILED ||
        execution.status === ExecutionStatus.CANCELLED) {
      return CommonErrors.badRequest(`Cannot cancel execution with status: ${execution.status}`);
    }

    // Cancel execution
    execution.status = ExecutionStatus.CANCELLED;
    execution.completedAt = new Date().toISOString();
    
    if (execution.startedAt) {
      execution.metrics.duration = 
        new Date(execution.completedAt).getTime() - 
        new Date(execution.startedAt).getTime();
    }

    return successResponse({
      id: execution.id,
      status: execution.status,
      message: 'Execution cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling execution:', error);
    return CommonErrors.internalError('Failed to cancel execution');
  }
});