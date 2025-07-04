import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, paginatedResponse, CommonErrors } from '@/lib/api/responses';
import { Webhook, CreateWebhookRequest, WebhookEvent } from '@/lib/api/types';
import crypto from 'crypto';

// Mock data for demonstration
const mockWebhooks: Webhook[] = [];

// GET /api/v1/webhooks - List all webhooks
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const active = searchParams.get('active');

    // Filter webhooks
    let filteredWebhooks = [...mockWebhooks];
    
    if (active !== null) {
      const isActive = active === 'true';
      filteredWebhooks = filteredWebhooks.filter(webhook => webhook.active === isActive);
    }

    // Sort by createdAt descending
    filteredWebhooks.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedWebhooks = filteredWebhooks.slice(start, end);

    return paginatedResponse(
      paginatedWebhooks,
      page,
      pageSize,
      filteredWebhooks.length
    );
  } catch (error) {
    console.error('Error listing webhooks:', error);
    return CommonErrors.internalError('Failed to list webhooks');
  }
});

// POST /api/v1/webhooks - Create a new webhook
export const POST = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest) => {
  try {
    const body: CreateWebhookRequest = await request.json();

    // Validate request body
    if (!body.url || !body.events || !Array.isArray(body.events)) {
      return CommonErrors.badRequest('Missing required fields', {
        required: ['url', 'events'],
      });
    }

    // Validate URL
    try {
      new URL(body.url);
    } catch {
      return CommonErrors.badRequest('Invalid webhook URL');
    }

    // Validate events
    const validEvents = Object.values(WebhookEvent);
    const invalidEvents = body.events.filter(event => !validEvents.includes(event));
    
    if (invalidEvents.length > 0) {
      return CommonErrors.badRequest('Invalid webhook events', {
        invalidEvents,
        validEvents,
      });
    }

    // Generate webhook secret if not provided
    const secret = body.secret || crypto.randomBytes(32).toString('hex');

    // Create new webhook
    const newWebhook: Webhook = {
      id: `webhook-${Date.now()}`,
      url: body.url,
      events: body.events,
      active: true,
      secret,
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, save to database
    mockWebhooks.push(newWebhook);

    return successResponse(newWebhook, undefined, 201);
  } catch (error) {
    console.error('Error creating webhook:', error);
    return CommonErrors.internalError('Failed to create webhook');
  }
});