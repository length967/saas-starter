/**
 * TCP Agent Platform API Client
 * Example client for interacting with the API
 */

import { 
  Agent, 
  Execution, 
  Session, 
  LogEntry, 
  MetricEntry, 
  Webhook,
  CreateAgentRequest,
  UpdateAgentRequest,
  CreateExecutionRequest,
  CreateSessionRequest,
  CreateWebhookRequest,
  ApiResponse,
  PaginationMeta
} from './types';

export class TCPAgentAPIClient {
  private baseUrl: string;
  private apiKey: string;
  private version: string;

  constructor(config: {
    baseUrl: string;
    apiKey: string;
    version?: string;
  }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.version = config.version || 'v1';
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    queryParams?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}/api/${this.version}${endpoint}`);
    
    // Add query parameters
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Version': this.version,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  }

  // Agent methods
  async listAgents(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
  }): Promise<{ agents: Agent[]; pagination: PaginationMeta }> {
    const response = await this.request<Agent[]>('GET', '/agents', undefined, params);
    return {
      agents: response.data!,
      pagination: response.meta!.pagination!,
    };
  }

  async getAgent(id: string): Promise<Agent> {
    const response = await this.request<Agent>('GET', `/agents/${id}`);
    return response.data!;
  }

  async createAgent(data: CreateAgentRequest): Promise<Agent> {
    const response = await this.request<Agent>('POST', '/agents', data);
    return response.data!;
  }

  async updateAgent(id: string, data: UpdateAgentRequest): Promise<Agent> {
    const response = await this.request<Agent>('PUT', `/agents/${id}`, data);
    return response.data!;
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request('DELETE', `/agents/${id}`);
  }

  // Execution methods
  async listExecutions(params?: {
    page?: number;
    pageSize?: number;
    agentId?: string;
    sessionId?: string;
    status?: string;
  }): Promise<{ executions: Execution[]; pagination: PaginationMeta }> {
    const response = await this.request<Execution[]>('GET', '/executions', undefined, params);
    return {
      executions: response.data!,
      pagination: response.meta!.pagination!,
    };
  }

  async getExecution(id: string): Promise<Execution> {
    const response = await this.request<Execution>('GET', `/executions/${id}`);
    return response.data!;
  }

  async createExecution(data: CreateExecutionRequest): Promise<Execution> {
    const response = await this.request<Execution>('POST', '/executions', data);
    return response.data!;
  }

  async cancelExecution(id: string): Promise<void> {
    await this.request('POST', `/executions/${id}/cancel`);
  }

  // Session methods
  async listSessions(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<{ sessions: Session[]; pagination: PaginationMeta }> {
    const response = await this.request<Session[]>('GET', '/sessions', undefined, params);
    return {
      sessions: response.data!,
      pagination: response.meta!.pagination!,
    };
  }

  async getSession(id: string): Promise<Session> {
    const response = await this.request<Session>('GET', `/sessions/${id}`);
    return response.data!;
  }

  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response = await this.request<Session>('POST', '/sessions', data);
    return response.data!;
  }

  async pauseSession(id: string): Promise<void> {
    await this.request('POST', `/sessions/${id}/pause`);
  }

  async resumeSession(id: string): Promise<void> {
    await this.request('POST', `/sessions/${id}/resume`);
  }

  // Log methods
  async getLogs(params?: {
    page?: number;
    pageSize?: number;
    agentId?: string;
    executionId?: string;
    sessionId?: string;
    level?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<{ logs: LogEntry[]; pagination: PaginationMeta }> {
    const response = await this.request<LogEntry[]>('GET', '/logs', undefined, params);
    return {
      logs: response.data!,
      pagination: response.meta!.pagination!,
    };
  }

  async createLog(data: {
    agentId?: string;
    executionId?: string;
    sessionId?: string;
    level: string;
    message: string;
    context?: Record<string, any>;
  }): Promise<LogEntry> {
    const response = await this.request<LogEntry>('POST', '/logs', data);
    return response.data!;
  }

  // Metric methods
  async getMetrics(params?: {
    page?: number;
    pageSize?: number;
    agentId?: string;
    executionId?: string;
    sessionId?: string;
    name?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<{ metrics: MetricEntry[]; pagination: PaginationMeta }> {
    const response = await this.request<MetricEntry[]>('GET', '/metrics', undefined, params);
    return {
      metrics: response.data!,
      pagination: response.meta!.pagination!,
    };
  }

  async recordMetric(data: {
    agentId?: string;
    executionId?: string;
    sessionId?: string;
    name: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
  }): Promise<MetricEntry> {
    const response = await this.request<MetricEntry>('POST', '/metrics', data);
    return response.data!;
  }

  // Webhook methods
  async listWebhooks(params?: {
    page?: number;
    pageSize?: number;
    active?: boolean;
  }): Promise<{ webhooks: Webhook[]; pagination: PaginationMeta }> {
    const response = await this.request<Webhook[]>('GET', '/webhooks', undefined, params);
    return {
      webhooks: response.data!,
      pagination: response.meta!.pagination!,
    };
  }

  async getWebhook(id: string): Promise<Webhook> {
    const response = await this.request<Webhook>('GET', `/webhooks/${id}`);
    return response.data!;
  }

  async createWebhook(data: CreateWebhookRequest): Promise<Webhook> {
    const response = await this.request<Webhook>('POST', '/webhooks', data);
    return response.data!;
  }

  async updateWebhook(id: string, data: Partial<CreateWebhookRequest>): Promise<Webhook> {
    const response = await this.request<Webhook>('PUT', `/webhooks/${id}`, data);
    return response.data!;
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.request('DELETE', `/webhooks/${id}`);
  }

  // Health check
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    services: Record<string, any>;
  }> {
    const response = await this.request<any>('GET', '/health');
    return response.data!;
  }
}

// Example usage:
/*
const client = new TCPAgentAPIClient({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
});

// Create an agent
const agent = await client.createAgent({
  name: 'My Web Crawler',
  type: AgentType.CRAWLER,
  capabilities: ['web-scraping', 'data-extraction'],
  configuration: {
    maxConcurrency: 5,
    timeout: 30000,
  },
});

// Start an execution
const execution = await client.createExecution({
  agentId: agent.id,
  input: {
    url: 'https://example.com',
    depth: 2,
  },
});

// Check execution status
const status = await client.getExecution(execution.id);
console.log('Execution status:', status.status);
*/