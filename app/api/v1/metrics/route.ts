import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, paginatedResponse, CommonErrors } from '@/lib/api/responses';
import { MetricEntry } from '@/lib/api/types';

// Mock data for demonstration
const mockMetrics: MetricEntry[] = [];

// GET /api/v1/metrics - List metrics
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const agentId = searchParams.get('agentId');
    const executionId = searchParams.get('executionId');
    const sessionId = searchParams.get('sessionId');
    const name = searchParams.get('name');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    // Filter metrics
    let filteredMetrics = [...mockMetrics];
    
    if (agentId) {
      filteredMetrics = filteredMetrics.filter(metric => metric.agentId === agentId);
    }
    
    if (executionId) {
      filteredMetrics = filteredMetrics.filter(metric => metric.executionId === executionId);
    }
    
    if (sessionId) {
      filteredMetrics = filteredMetrics.filter(metric => metric.sessionId === sessionId);
    }
    
    if (name) {
      filteredMetrics = filteredMetrics.filter(metric => metric.name === name);
    }
    
    if (startTime) {
      const start = new Date(startTime);
      filteredMetrics = filteredMetrics.filter(metric => new Date(metric.timestamp) >= start);
    }
    
    if (endTime) {
      const end = new Date(endTime);
      filteredMetrics = filteredMetrics.filter(metric => new Date(metric.timestamp) <= end);
    }

    // Sort by timestamp descending
    filteredMetrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedMetrics = filteredMetrics.slice(start, end);

    return paginatedResponse(
      paginatedMetrics,
      page,
      pageSize,
      filteredMetrics.length
    );
  } catch (error) {
    console.error('Error listing metrics:', error);
    return CommonErrors.internalError('Failed to list metrics');
  }
});

// POST /api/v1/metrics - Record a metric
export const POST = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.name || body.value === undefined || !body.unit) {
      return CommonErrors.badRequest('Missing required fields', {
        required: ['name', 'value', 'unit'],
      });
    }

    if (typeof body.value !== 'number') {
      return CommonErrors.badRequest('Value must be a number');
    }

    // Create new metric entry
    const newMetric: MetricEntry = {
      id: `metric-${Date.now()}`,
      agentId: body.agentId,
      executionId: body.executionId,
      sessionId: body.sessionId,
      name: body.name,
      value: body.value,
      unit: body.unit,
      tags: body.tags || {},
      timestamp: new Date().toISOString(),
    };

    // In a real implementation, save to time-series database
    mockMetrics.push(newMetric);

    return successResponse(newMetric, undefined, 201);
  } catch (error) {
    console.error('Error recording metric:', error);
    return CommonErrors.internalError('Failed to record metric');
  }
});

// GET /api/v1/metrics/aggregate - Get aggregated metrics
export const aggregate = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const metricName = searchParams.get('name');
    const aggregation = searchParams.get('aggregation') || 'avg';
    const groupBy = searchParams.get('groupBy') || 'hour';

    // In a real implementation, perform aggregation query
    const mockAggregatedData = {
      metric: metricName,
      aggregation,
      groupBy,
      data: [
        {
          timestamp: new Date().toISOString(),
          value: 42.5,
          count: 10,
        },
      ],
    };

    return successResponse(mockAggregatedData);
  } catch (error) {
    console.error('Error aggregating metrics:', error);
    return CommonErrors.internalError('Failed to aggregate metrics');
  }
});