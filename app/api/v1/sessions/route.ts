import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, paginatedResponse, CommonErrors } from '@/lib/api/responses';
import { Session, CreateSessionRequest, SessionStatus } from '@/lib/api/types';

// Mock data for demonstration
const mockSessions: Session[] = [];

// GET /api/v1/sessions - List all sessions
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');

    // Filter sessions
    let filteredSessions = [...mockSessions];
    
    if (status) {
      filteredSessions = filteredSessions.filter(session => session.status === status);
    }

    // Sort by createdAt descending
    filteredSessions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedSessions = filteredSessions.slice(start, end);

    return paginatedResponse(
      paginatedSessions,
      page,
      pageSize,
      filteredSessions.length
    );
  } catch (error) {
    console.error('Error listing sessions:', error);
    return CommonErrors.internalError('Failed to list sessions');
  }
});

// POST /api/v1/sessions - Create a new session
export const POST = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const body: CreateSessionRequest = await request.json();

    // Validate request body
    if (!body.name || !body.agentIds || !body.configuration) {
      return CommonErrors.badRequest('Missing required fields', {
        required: ['name', 'agentIds', 'configuration'],
      });
    }

    if (!Array.isArray(body.agentIds) || body.agentIds.length === 0) {
      return CommonErrors.badRequest('agentIds must be a non-empty array');
    }

    // Validate execution mode
    if (!['parallel', 'sequential'].includes(body.configuration.executionMode)) {
      return CommonErrors.badRequest('Invalid execution mode', {
        validModes: ['parallel', 'sequential'],
      });
    }

    // Create new session
    const newSession: Session = {
      id: `session-${Date.now()}`,
      name: body.name,
      agentIds: body.agentIds,
      status: SessionStatus.ACTIVE,
      configuration: body.configuration,
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, save to database
    mockSessions.push(newSession);

    return successResponse(newSession, undefined, 201);
  } catch (error) {
    console.error('Error creating session:', error);
    return CommonErrors.internalError('Failed to create session');
  }
});