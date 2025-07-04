# TCP Agent Platform API v1 Documentation

## Overview

The TCP Agent Platform API v1 provides RESTful endpoints for managing agents, executions, sessions, and monitoring. All endpoints follow the pattern `/api/v1/{resource}`.

## Authentication

All API endpoints (except health check) require authentication. Include one of the following:
- API Key: `X-API-Key: your-api-key`
- Authorization: `Authorization: Bearer your-token`

## Versioning

The API version can be specified in two ways:
1. URL path: `/api/v1/...`
2. Header: `X-API-Version: v1`

## Base URL

```
https://your-domain.com/api/v1
```

## Endpoints

### Agents

#### List Agents
```
GET /api/v1/agents
Query Parameters:
- page (default: 1)
- pageSize (default: 10)
- status (active, inactive, suspended, error)
- type (crawler, analyzer, processor, orchestrator)
```

#### Create Agent
```
POST /api/v1/agents
Body:
{
  "name": "string",
  "type": "crawler|analyzer|processor|orchestrator",
  "capabilities": ["string"],
  "configuration": {
    "maxConcurrency": number,
    "timeout": number,
    "retryPolicy": {...}
  }
}
```

#### Get Agent
```
GET /api/v1/agents/{id}
```

#### Update Agent
```
PUT /api/v1/agents/{id}
Body:
{
  "name": "string",
  "status": "active|inactive|suspended|error",
  "capabilities": ["string"],
  "configuration": {...}
}
```

#### Delete Agent
```
DELETE /api/v1/agents/{id}
```

### Executions

#### List Executions
```
GET /api/v1/executions
Query Parameters:
- page (default: 1)
- pageSize (default: 10)
- agentId
- sessionId
- status (pending, running, completed, failed, cancelled)
```

#### Create Execution
```
POST /api/v1/executions
Body:
{
  "agentId": "string",
  "sessionId": "string",
  "input": {...},
  "priority": number
}
```

#### Get Execution
```
GET /api/v1/executions/{id}
```

#### Cancel Execution
```
POST /api/v1/executions/{id}/cancel
```

### Sessions

#### List Sessions
```
GET /api/v1/sessions
Query Parameters:
- page (default: 1)
- pageSize (default: 10)
- status (active, paused, completed, failed)
```

#### Create Session
```
POST /api/v1/sessions
Body:
{
  "name": "string",
  "agentIds": ["string"],
  "configuration": {
    "executionMode": "parallel|sequential",
    "maxDuration": number,
    "priority": number
  }
}
```

#### Get Session
```
GET /api/v1/sessions/{id}
```

#### Update Session
```
PUT /api/v1/sessions/{id}
Body:
{
  "status": "active|paused|completed|failed",
  "metadata": {...}
}
```

#### Pause Session
```
POST /api/v1/sessions/{id}/pause
```

#### Resume Session
```
POST /api/v1/sessions/{id}/resume
```

### Logs

#### List Logs
```
GET /api/v1/logs
Query Parameters:
- page (default: 1)
- pageSize (default: 50)
- agentId
- executionId
- sessionId
- level (debug, info, warn, error, fatal)
- startTime (ISO 8601)
- endTime (ISO 8601)
```

#### Create Log Entry
```
POST /api/v1/logs
Body:
{
  "agentId": "string",
  "executionId": "string",
  "sessionId": "string",
  "level": "debug|info|warn|error|fatal",
  "message": "string",
  "context": {...}
}
```

### Metrics

#### List Metrics
```
GET /api/v1/metrics
Query Parameters:
- page (default: 1)
- pageSize (default: 100)
- agentId
- executionId
- sessionId
- name
- startTime (ISO 8601)
- endTime (ISO 8601)
```

#### Record Metric
```
POST /api/v1/metrics
Body:
{
  "agentId": "string",
  "executionId": "string",
  "sessionId": "string",
  "name": "string",
  "value": number,
  "unit": "string",
  "tags": {...}
}
```

### Webhooks

#### List Webhooks
```
GET /api/v1/webhooks
Query Parameters:
- page (default: 1)
- pageSize (default: 10)
- active (true|false)
```

#### Create Webhook
```
POST /api/v1/webhooks
Body:
{
  "url": "string",
  "events": ["agent.created", "execution.started", ...],
  "secret": "string",
  "metadata": {...}
}
```

#### Get Webhook
```
GET /api/v1/webhooks/{id}
```

#### Update Webhook
```
PUT /api/v1/webhooks/{id}
Body:
{
  "url": "string",
  "events": ["string"],
  "active": boolean,
  "metadata": {...}
}
```

#### Delete Webhook
```
DELETE /api/v1/webhooks/{id}
```

### Health Check

#### Get Health Status
```
GET /api/v1/health
Response:
{
  "status": "healthy|degraded|unhealthy",
  "version": "string",
  "timestamp": "ISO 8601",
  "services": {
    "api": { "status": "up|down|degraded", "latency": number },
    "database": { "status": "up|down|degraded", "latency": number },
    "agents": { "status": "up|down|degraded", "latency": number },
    "queue": { "status": "up|down|degraded", "latency": number }
  }
}
```

## Response Format

All responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "meta": {
    "version": "v1",
    "timestamp": "2025-07-04T12:00:00Z",
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {...}
  },
  "meta": {
    "version": "v1",
    "timestamp": "2025-07-04T12:00:00Z"
  }
}
```

## Error Codes

- `RESOURCE_NOT_FOUND` - The requested resource was not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access forbidden
- `BAD_REQUEST` - Invalid request parameters
- `VALIDATION_ERROR` - Request validation failed
- `INTERNAL_ERROR` - Internal server error
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Webhook Events

- `agent.created` - Agent was created
- `agent.updated` - Agent was updated
- `agent.deleted` - Agent was deleted
- `execution.started` - Execution started
- `execution.completed` - Execution completed successfully
- `execution.failed` - Execution failed
- `session.created` - Session was created
- `session.completed` - Session completed

## Rate Limiting

API requests are rate-limited to:
- 1000 requests per hour per API key
- 100 requests per minute per API key

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`