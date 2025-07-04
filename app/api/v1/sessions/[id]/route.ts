import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, CommonErrors } from '@/lib/api/responses';
import { Session, SessionStatus } from '@/lib/api/types';

// Mock data - in production, this would come from a database
const mockSessions: Session[] = [];

// GET /api/v1/sessions/:id - Get a specific session
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const session = mockSessions.find(s => s.id === params.id);
    
    if (!session) {
      return CommonErrors.notFound('Session');
    }

    return successResponse(session);
  } catch (error) {
    console.error('Error getting session:', error);
    return CommonErrors.internalError('Failed to get session');
  }
});

// PUT /api/v1/sessions/:id - Update a session
export const PUT = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    
    const sessionIndex = mockSessions.findIndex(s => s.id === params.id);
    
    if (sessionIndex === -1) {
      return CommonErrors.notFound('Session');
    }

    // Validate status if provided
    if (body.status && !Object.values(SessionStatus).includes(body.status)) {
      return CommonErrors.badRequest('Invalid session status', {
        validStatuses: Object.values(SessionStatus),
      });
    }

    // Update session
    const updatedSession: Session = {
      ...mockSessions[sessionIndex],
      ...(body.status && { status: body.status }),
      ...(body.metadata && { 
        metadata: { 
          ...mockSessions[sessionIndex].metadata, 
          ...body.metadata 
        } 
      }),
      updatedAt: new Date().toISOString(),
    };

    mockSessions[sessionIndex] = updatedSession;

    return successResponse(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return CommonErrors.internalError('Failed to update session');
  }
});

// POST /api/v1/sessions/:id/pause - Pause a session
export const POST = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const path = request.nextUrl.pathname;
    
    if (path.endsWith('/pause')) {
      const session = mockSessions.find(s => s.id === params.id);
      
      if (!session) {
        return CommonErrors.notFound('Session');
      }

      if (session.status !== SessionStatus.ACTIVE) {
        return CommonErrors.badRequest(`Cannot pause session with status: ${session.status}`);
      }

      session.status = SessionStatus.PAUSED;
      session.updatedAt = new Date().toISOString();

      return successResponse({
        id: session.id,
        status: session.status,
        message: 'Session paused successfully',
      });
    }
    
    if (path.endsWith('/resume')) {
      const session = mockSessions.find(s => s.id === params.id);
      
      if (!session) {
        return CommonErrors.notFound('Session');
      }

      if (session.status !== SessionStatus.PAUSED) {
        return CommonErrors.badRequest(`Cannot resume session with status: ${session.status}`);
      }

      session.status = SessionStatus.ACTIVE;
      session.updatedAt = new Date().toISOString();

      return successResponse({
        id: session.id,
        status: session.status,
        message: 'Session resumed successfully',
      });
    }

    return CommonErrors.notFound('Endpoint');
  } catch (error) {
    console.error('Error managing session:', error);
    return CommonErrors.internalError('Failed to manage session');
  }
});