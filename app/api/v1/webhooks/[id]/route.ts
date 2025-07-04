import { NextRequest } from 'next/server';
import { withApiVersioning, withApiAuth, composeMiddleware } from '@/lib/api/middleware';
import { successResponse, CommonErrors } from '@/lib/api/responses';
import { Webhook, WebhookEvent } from '@/lib/api/types';

// Mock data - in production, this would come from a database
const mockWebhooks: Webhook[] = [];

// GET /api/v1/webhooks/:id - Get a specific webhook
export const GET = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const webhook = mockWebhooks.find(w => w.id === params.id);
    
    if (!webhook) {
      return CommonErrors.notFound('Webhook');
    }

    return successResponse(webhook);
  } catch (error) {
    console.error('Error getting webhook:', error);
    return CommonErrors.internalError('Failed to get webhook');
  }
});

// PUT /api/v1/webhooks/:id - Update a webhook
export const PUT = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    
    const webhookIndex = mockWebhooks.findIndex(w => w.id === params.id);
    
    if (webhookIndex === -1) {
      return CommonErrors.notFound('Webhook');
    }

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return CommonErrors.badRequest('Invalid webhook URL');
      }
    }

    // Validate events if provided
    if (body.events) {
      const validEvents = Object.values(WebhookEvent);
      const invalidEvents = body.events.filter((event: string) => !validEvents.includes(event as WebhookEvent));
      
      if (invalidEvents.length > 0) {
        return CommonErrors.badRequest('Invalid webhook events', {
          invalidEvents,
          validEvents,
        });
      }
    }

    // Update webhook
    const updatedWebhook: Webhook = {
      ...mockWebhooks[webhookIndex],
      ...(body.url && { url: body.url }),
      ...(body.events && { events: body.events }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.metadata && { 
        metadata: { 
          ...mockWebhooks[webhookIndex].metadata, 
          ...body.metadata 
        } 
      }),
      updatedAt: new Date().toISOString(),
    };

    mockWebhooks[webhookIndex] = updatedWebhook;

    return successResponse(updatedWebhook);
  } catch (error) {
    console.error('Error updating webhook:', error);
    return CommonErrors.internalError('Failed to update webhook');
  }
});

// DELETE /api/v1/webhooks/:id - Delete a webhook
export const DELETE = composeMiddleware(
  withApiVersioning,
  withApiAuth
)(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const webhookIndex = mockWebhooks.findIndex(w => w.id === params.id);
    
    if (webhookIndex === -1) {
      return CommonErrors.notFound('Webhook');
    }

    // Remove webhook
    mockWebhooks.splice(webhookIndex, 1);

    return successResponse({ message: 'Webhook deleted successfully' }, undefined, 204);
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return CommonErrors.internalError('Failed to delete webhook');
  }
});