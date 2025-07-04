import { NextResponse } from 'next/server';
import { API_VERSION, API_VERSION_HEADER } from './middleware';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMeta {
  version: string;
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: Partial<ApiMeta>,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return NextResponse.json(response, {
    status,
    headers: {
      [API_VERSION_HEADER]: API_VERSION,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      version: API_VERSION,
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, {
    status,
    headers: {
      [API_VERSION_HEADER]: API_VERSION,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create a paginated API response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  meta?: Partial<ApiMeta>
): NextResponse {
  const totalPages = Math.ceil(total / pageSize);
  
  return successResponse(data, {
    ...meta,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
}

/**
 * Common error responses
 */
export const CommonErrors = {
  notFound: (resource: string) =>
    errorResponse('RESOURCE_NOT_FOUND', `${resource} not found`, 404),
  
  unauthorized: (message: string = 'Unauthorized access') =>
    errorResponse('UNAUTHORIZED', message, 401),
  
  forbidden: (message: string = 'Access forbidden') =>
    errorResponse('FORBIDDEN', message, 403),
  
  badRequest: (message: string, details?: any) =>
    errorResponse('BAD_REQUEST', message, 400, details),
  
  internalError: (message: string = 'Internal server error') =>
    errorResponse('INTERNAL_ERROR', message, 500),
  
  validationError: (errors: any) =>
    errorResponse('VALIDATION_ERROR', 'Validation failed', 422, errors),
  
  rateLimitExceeded: () =>
    errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests', 429),
};