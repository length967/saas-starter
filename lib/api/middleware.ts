import { NextRequest, NextResponse } from 'next/server';

export const API_VERSION = 'v1';
export const API_VERSION_HEADER = 'X-API-Version';
export const SUPPORTED_VERSIONS = ['v1'];

/**
 * API Versioning Middleware
 * Handles version headers and compatibility checks
 */
export function withApiVersioning(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    // Extract API version from header or URL
    const headerVersion = request.headers.get(API_VERSION_HEADER);
    const urlVersion = extractVersionFromUrl(request.url);
    
    const requestedVersion = headerVersion || urlVersion || API_VERSION;
    
    // Check if version is supported
    if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
      return NextResponse.json(
        {
          error: 'Unsupported API version',
          message: `API version ${requestedVersion} is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
          supportedVersions: SUPPORTED_VERSIONS,
        },
        { 
          status: 400,
          headers: {
            [API_VERSION_HEADER]: API_VERSION,
          }
        }
      );
    }
    
    // Add version to request for downstream handling
    const modifiedRequest = request.clone();
    modifiedRequest.headers.set('X-Requested-Version', requestedVersion);
    
    // Execute the handler
    const response = await handler(modifiedRequest, context);
    
    // Add version headers to response
    response.headers.set(API_VERSION_HEADER, requestedVersion);
    response.headers.set('X-API-Version-Supported', SUPPORTED_VERSIONS.join(', '));
    
    return response;
  };
}

/**
 * Extract version from URL path
 */
function extractVersionFromUrl(url: string): string | null {
  const match = url.match(/\/api\/(v\d+)\//);
  return match ? match[1] : null;
}

/**
 * Middleware to check API authentication
 */
export function withApiAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const apiKey = request.headers.get('X-API-Key');
    const authHeader = request.headers.get('Authorization');
    
    // For now, we'll implement basic checks
    // This should be enhanced with proper authentication
    if (!apiKey && !authHeader) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please provide an API key or authorization token',
        },
        { status: 401 }
      );
    }
    
    return handler(request, context);
  };
}

/**
 * Combine multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: any) => {
    return middlewares.reduceRight((prev, middleware) => {
      return middleware(prev);
    }, handler);
  };
}

/**
 * Agent authentication middleware
 */
export async function withAgentAuth(
  request: NextRequest,
  handler: (agentContext: { agent: any; session: any }) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Missing or invalid authorization header',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Decode token to get agent ID (without verifying yet)
    let decoded: any;
    try {
      decoded = JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid token',
          message: 'Token format is invalid',
        },
        { status: 401 }
      );
    }

    if (!decoded.agentId) {
      return NextResponse.json(
        {
          error: 'Invalid token',
          message: 'Token does not contain agent ID',
        },
        { status: 401 }
      );
    }

    // Import here to avoid circular dependency
    const { db } = await import('@/lib/db/drizzle');
    const { agents, agentSessions } = await import('@/lib/db/tcp-schema');
    const { eq, and } = await import('drizzle-orm');
    const { verify } = await import('jsonwebtoken');

    // Get agent to retrieve JWT secret
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, decoded.agentId))
      .limit(1);

    if (!agent) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Agent not found',
        },
        { status: 401 }
      );
    }

    // Verify token with agent's secret
    try {
      verify(token, agent.jwtSecret);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }

    // Get session
    const [session] = await db
      .select()
      .from(agentSessions)
      .where(
        and(
          eq(agentSessions.agentId, decoded.agentId),
          eq(agentSessions.token, token)
        )
      )
      .limit(1);

    if (!session || new Date() > session.expiresAt) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Session expired or not found',
        },
        { status: 401 }
      );
    }

    // Call handler with agent context
    return handler({ agent, session });
  } catch (error) {
    console.error('Agent auth error:', error);
    return NextResponse.json(
      {
        error: 'Internal error',
        message: 'Authentication failed',
      },
      { status: 500 }
    );
  }
}