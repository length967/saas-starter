import { NextRequest } from 'next/server';
import { withApiVersioning } from '@/lib/api/middleware';
import { successResponse } from '@/lib/api/responses';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      latency?: number;
      message?: string;
    };
  };
}

// GET /api/v1/health - Health check endpoint
export const GET = withApiVersioning(async (request: NextRequest) => {
  try {
    // Check various services
    const services = await checkServices();
    
    // Determine overall health status
    const serviceStatuses = Object.values(services).map(s => s.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (serviceStatuses.includes('down')) {
      overallStatus = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      services,
    };

    // Return appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return successResponse(healthStatus, undefined, statusCode);
  } catch (error) {
    console.error('Health check error:', error);
    
    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'down',
          message: 'Health check failed',
        },
      },
    };

    return successResponse(errorStatus, undefined, 503);
  }
});

async function checkServices() {
  const services: HealthStatus['services'] = {};

  // Check API service
  services.api = {
    status: 'up',
    latency: 1,
  };

  // Check database (mock check)
  try {
    const dbStart = Date.now();
    // In production, perform actual database query
    await new Promise(resolve => setTimeout(resolve, 10));
    services.database = {
      status: 'up',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    services.database = {
      status: 'down',
      message: 'Database connection failed',
    };
  }

  // Check agent service (mock check)
  try {
    const agentStart = Date.now();
    // In production, check agent service health
    await new Promise(resolve => setTimeout(resolve, 5));
    services.agents = {
      status: 'up',
      latency: Date.now() - agentStart,
    };
  } catch (error) {
    services.agents = {
      status: 'degraded',
      message: 'Some agents are unresponsive',
    };
  }

  // Check queue service (mock check)
  try {
    const queueStart = Date.now();
    // In production, check message queue health
    await new Promise(resolve => setTimeout(resolve, 3));
    services.queue = {
      status: 'up',
      latency: Date.now() - queueStart,
    };
  } catch (error) {
    services.queue = {
      status: 'down',
      message: 'Queue service unavailable',
    };
  }

  return services;
}