import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, paginatedResponse, CommonErrors } from '@/lib/api/responses';
import { LogEntry, LogLevel } from '@/lib/api/types';

// Mock data for demonstration
const mockLogs: LogEntry[] = [];

// GET /api/v1/logs - List logs
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const agentId = searchParams.get('agentId');
    const executionId = searchParams.get('executionId');
    const sessionId = searchParams.get('sessionId');
    const level = searchParams.get('level');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    // Filter logs
    let filteredLogs = [...mockLogs];
    
    if (agentId) {
      filteredLogs = filteredLogs.filter(log => log.agentId === agentId);
    }
    
    if (executionId) {
      filteredLogs = filteredLogs.filter(log => log.executionId === executionId);
    }
    
    if (sessionId) {
      filteredLogs = filteredLogs.filter(log => log.sessionId === sessionId);
    }
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (startTime) {
      const start = new Date(startTime);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
    }
    
    if (endTime) {
      const end = new Date(endTime);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
    }

    // Sort by timestamp descending
    filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedLogs = filteredLogs.slice(start, end);

    return paginatedResponse(
      paginatedLogs,
      page,
      pageSize,
      filteredLogs.length
    );
  } catch (error) {
    console.error('Error listing logs:', error);
    return CommonErrors.internalError('Failed to list logs');
  }
});

// POST /api/v1/logs - Create a log entry
export const POST = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.level || !body.message) {
      return CommonErrors.badRequest('Missing required fields', {
        required: ['level', 'message'],
      });
    }

    // Validate log level
    if (!Object.values(LogLevel).includes(body.level)) {
      return CommonErrors.badRequest('Invalid log level', {
        validLevels: Object.values(LogLevel),
      });
    }

    // Create new log entry
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      agentId: body.agentId,
      executionId: body.executionId,
      sessionId: body.sessionId,
      level: body.level,
      message: body.message,
      context: body.context || {},
      timestamp: new Date().toISOString(),
    };

    // In a real implementation, save to database or log aggregation service
    mockLogs.push(newLog);

    return successResponse(newLog, undefined, 201);
  } catch (error) {
    console.error('Error creating log entry:', error);
    return CommonErrors.internalError('Failed to create log entry');
  }
});