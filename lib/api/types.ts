/**
 * TCP Agent Platform API Types
 */

// Agent Types
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  configuration: AgentConfiguration;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export enum AgentType {
  CRAWLER = 'crawler',
  ANALYZER = 'analyzer',
  PROCESSOR = 'processor',
  ORCHESTRATOR = 'orchestrator',
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  ERROR = 'error',
}

export interface AgentConfiguration {
  maxConcurrency?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  resources?: ResourceLimits;
  [key: string]: any;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
}

export interface ResourceLimits {
  maxMemory?: string;
  maxCpu?: string;
  maxStorage?: string;
}

// Execution Types
export interface Execution {
  id: string;
  agentId: string;
  sessionId?: string;
  status: ExecutionStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: ExecutionError;
  metrics: ExecutionMetrics;
  startedAt: string;
  completedAt?: string;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface ExecutionError {
  code: string;
  message: string;
  stack?: string;
  retryable: boolean;
}

export interface ExecutionMetrics {
  duration?: number;
  memoryUsed?: number;
  cpuUsed?: number;
  itemsProcessed?: number;
  [key: string]: any;
}

// Session Types
export interface Session {
  id: string;
  name: string;
  agentIds: string[];
  status: SessionStatus;
  configuration: SessionConfiguration;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface SessionConfiguration {
  executionMode: 'parallel' | 'sequential';
  maxDuration?: number;
  priority?: number;
  [key: string]: any;
}

// Log Types
export interface LogEntry {
  id: string;
  agentId?: string;
  executionId?: string;
  sessionId?: string;
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  timestamp: string;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Metrics Types
export interface MetricEntry {
  id: string;
  agentId?: string;
  executionId?: string;
  sessionId?: string;
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: string;
}

// Webhook Types
export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  secret?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export enum WebhookEvent {
  AGENT_CREATED = 'agent.created',
  AGENT_UPDATED = 'agent.updated',
  AGENT_DELETED = 'agent.deleted',
  EXECUTION_STARTED = 'execution.started',
  EXECUTION_COMPLETED = 'execution.completed',
  EXECUTION_FAILED = 'execution.failed',
  SESSION_CREATED = 'session.created',
  SESSION_COMPLETED = 'session.completed',
}

// Request/Response Types
export interface CreateAgentRequest {
  name: string;
  type: AgentType;
  capabilities: string[];
  configuration: AgentConfiguration;
  metadata?: Record<string, any>;
}

export interface UpdateAgentRequest {
  name?: string;
  status?: AgentStatus;
  capabilities?: string[];
  configuration?: Partial<AgentConfiguration>;
  metadata?: Record<string, any>;
}

export interface CreateExecutionRequest {
  agentId: string;
  sessionId?: string;
  input: Record<string, any>;
  priority?: number;
}

export interface CreateSessionRequest {
  name: string;
  agentIds: string[];
  configuration: SessionConfiguration;
  metadata?: Record<string, any>;
}

export interface CreateWebhookRequest {
  url: string;
  events: WebhookEvent[];
  secret?: string;
  metadata?: Record<string, any>;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: string;
  type?: string;
  createdAfter?: string;
  createdBefore?: string;
  [key: string]: any;
}