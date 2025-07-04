import { NextRequest } from 'next/server';
import { PaginationParams, FilterParams } from './types';

/**
 * Extract pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);
  
  return {
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '10'),
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
  };
}

/**
 * Extract filter parameters from request
 */
export function getFilterParams(request: NextRequest): FilterParams {
  const { searchParams } = new URL(request.url);
  const filters: FilterParams = {};
  
  // Common filters
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const createdAfter = searchParams.get('createdAfter');
  const createdBefore = searchParams.get('createdBefore');
  
  if (status) filters.status = status;
  if (type) filters.type = type;
  if (createdAfter) filters.createdAfter = createdAfter;
  if (createdBefore) filters.createdBefore = createdBefore;
  
  // Add all other query parameters as filters
  searchParams.forEach((value, key) => {
    if (!['page', 'pageSize', 'sortBy', 'sortOrder'].includes(key)) {
      filters[key] = value;
    }
  });
  
  return filters;
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Validate webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate webhook signature
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this key
    const requests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
  
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
  
  getResetTime(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }
}