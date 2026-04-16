/**
 * Agent Types and Interfaces
 *
 * Defines all TypeScript types and interfaces used across the agent system.
 *
 * Architecture: Phase 1 - Foundation & Infrastructure
 * Task: Task 1 - Base Agent Class with ReAct Loop
 *
 * @module agents/types
 */

/**
 * Agent role types
 */
export enum AgentRole {
  TEAM_LEAD = 'team_lead',
  FULL_STACK_DEVELOPER = 'full_stack_developer',
  FRONTEND_DEVELOPER = 'frontend_developer',
  UX_DEVELOPER = 'ux_developer',
  QA_TESTER = 'qa_tester',
  CODE_REVIEWER = 'code_reviewer',
  DEVOPS = 'devops',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  DOCUMENTATION = 'documentation',
}

/**
 * Agent status
 */
export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  ACTING = 'acting',
  OBSERVING = 'observing',
  WAITING = 'waiting',
  ERROR = 'error',
  STOPPED = 'stopped',
}

/**
 * Tool execution status
 */
export enum ToolExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  RETRYING = 'retrying',
}

/**
 * Agent priority levels
 */
export enum AgentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  name: string;
  description: string;
  role: AgentRole;
  priority?: AgentPriority;
  maxIterations?: number;
  maxTokensPerTurn?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * Tool interface
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: any) => Promise<ToolExecutionResult>;
  validate?: (params: any) => boolean;
  metadata?: {
    version: string;
    author: string;
    tags: string[];
  };
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    retryCount?: number;
  };
}

/**
 * Agent state interface
 */
export interface AgentState {
  currentIteration: number;
  status: AgentStatus;
  isRunning: boolean;
  lastAction: string | null;
  lastObservation: any | null;
  history: AgentHistoryEntry[];
  error: Error | null;
  startTime?: Date;
  endTime?: Date;
  tokensUsed?: number;
}

/**
 * Agent history entry
 */
export interface AgentHistoryEntry {
  iteration: number;
  thought: string;
  action: string;
  actionInput: any;
  observation: any;
  timestamp: Date;
  tokensUsed?: number;
  executionTime?: number;
}

/**
 * ReAct step result
 */
export interface ReActStep {
  thought: string;
  action: string;
  actionInput: any;
  observation: any;
  timestamp: Date;
  success: boolean;
  error?: string;
}

/**
 * Agent metrics
 */
export interface AgentMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalTokensUsed: number;
  averageTokensPerExecution: number;
  toolUsageStats: Map<string, number>;
  errorStats: Map<string, number>;
}

/**
 * Agent event types
 */
export enum AgentEventType {
  STARTED = 'started',
  STOPPED = 'stopped',
  STEP = 'step',
  TOOL_EXECUTED = 'tool_executed',
  ERROR = 'error',
  COMPLETED = 'completed',
  LOG = 'log',
  STATE_CHANGED = 'state_changed',
}

/**
 * Agent event
 */
export interface AgentEvent {
  type: AgentEventType;
  agentName: string;
  timestamp: Date;
  data?: any;
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: AgentPriority;
  assignedAgent?: AgentRole;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies?: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

/**
 * Agent communication message
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'error';
  content: any;
  timestamp: Date;
  correlationId?: string;
}

/**
 * Agent capabilities
 */
export interface AgentCapabilities {
  canReason: boolean;
  canAct: boolean;
  canObserve: boolean;
  canCommunicate: boolean;
  canLearn: boolean;
  supportedTools: string[];
  supportedLanguages?: string[];
}

/**
 * Agent context
 */
export interface AgentContext {
  task: string;
  history: AgentHistoryEntry[];
  availableTools: Tool[];
  constraints?: {
    maxIterations?: number;
    maxTokens?: number;
    timeout?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Reasoning result
 */
export interface ReasoningResult {
  thought: string;
  confidence: number;
  reasoning: string;
  suggestedAction?: string;
  alternatives?: string[];
}

/**
 * Action selection result
 */
export interface ActionSelection {
  toolName: string;
  input: any;
  confidence: number;
  reasoning: string;
}

/**
 * Agent error types
 */
export enum AgentErrorType {
  CONFIGURATION_ERROR = 'configuration_error',
  TOOL_NOT_FOUND = 'tool_not_found',
  TOOL_EXECUTION_ERROR = 'tool_execution_error',
  TIMEOUT_ERROR = 'timeout_error',
  MAX_ITERATIONS_ERROR = 'max_iterations_error',
  VALIDATION_ERROR = 'validation_error',
  COMMUNICATION_ERROR = 'communication_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Agent error
 */
export class AgentError extends Error {
  public type: AgentErrorType;
  public details?: any;

  constructor(
    type: AgentErrorType,
    message: string,
    details?: any
  ) {
    super(message);
    this.type = type;
    this.details = details;
    this.name = 'AgentError';
  }
}

/**
 * Agent registry entry
 */
export interface AgentRegistryEntry {
  name: string;
  role: AgentRole;
  status: AgentStatus;
  capabilities: AgentCapabilities;
  metrics: AgentMetrics;
  lastActive: Date;
}

/**
 * Tool registry entry
 */
export interface ToolRegistryEntry {
  name: string;
  description: string;
  version: string;
  parameters: ToolParameter[];
  usageCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastUsed?: Date;
}

/**
 * Agent coordination message
 */
export interface CoordinationMessage {
  type: 'task_assignment' | 'status_update' | 'result' | 'error' | 'request_help';
  from: AgentRole;
  to: AgentRole;
  taskId?: string;
  content: any;
  priority: AgentPriority;
  timestamp: Date;
}

/**
 * Memory entry types
 */
export enum MemoryType {
  WORKING = 'working',
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
}

/**
 * Memory entry
 */
export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: any;
  metadata: {
    agentName: string;
    timestamp: Date;
    relevance?: number;
    tags?: string[];
  };
  expiresAt?: Date;
}

/**
 * Agent performance metrics
 */
export interface PerformanceMetrics {
  executionTime: number;
  tokensUsed: number;
  tokensSaved?: number;
  memoryUsed: number;
  cpuUsage?: number;
  successRate: number;
  errorRate: number;
}

/**
 * Agent health status
 */
export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastCheck: Date;
  issues?: string[];
  metrics: PerformanceMetrics;
}
