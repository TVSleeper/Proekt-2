/**
 * Tool Execution Framework
 *
 * Implements tool execution with parameter validation, error handling,
 * and result processing. Provides a robust framework for agents to execute tools.
 *
 * Architecture: Phase 1 - Foundation & Infrastructure
 * Task: Task 2 - Tool Calling Mechanism
 *
 * @module tools/executor
 */

import { EventEmitter } from 'events';

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
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: any) => Promise<ToolExecutionResult>;
  validate?: (params: any) => ValidationResult;
  metadata?: {
    version: string;
    author: string;
    tags: string[];
    deprecated?: boolean;
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
    timestamp?: Date;
  };
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Tool execution options
 */
export interface ExecutionOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  validateInput?: boolean;
  validateOutput?: boolean;
}

/**
 * Tool Executor Class
 *
 * Manages tool execution with:
 * - Parameter validation
 * - Error handling and retries
 * - Result processing
 * - Execution metrics
 * - Event emission
 */
export class ToolExecutor extends EventEmitter {
  private tools: Map<string, ToolDefinition>;
  private executionStats: Map<string, ExecutionStats>;
  private defaultOptions: Required<ExecutionOptions>;

  constructor(defaultOptions?: ExecutionOptions) {
    super();

    this.tools = new Map();
    this.executionStats = new Map();

    this.defaultOptions = {
      timeout: defaultOptions?.timeout || 30000,
      retryAttempts: defaultOptions?.retryAttempts || 3,
      retryDelay: defaultOptions?.retryDelay || 1000,
      validateInput: defaultOptions?.validateInput ?? true,
      validateOutput: defaultOptions?.validateOutput ?? true,
    };
  }

  /**
   * Register a tool
   */
  public registerTool(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }

    this.tools.set(tool.name, tool);
    this.executionStats.set(tool.name, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      lastExecuted: null,
      errors: [],
    });

    this.emit('tool:registered', { name: tool.name });
  }

  /**
   * Unregister a tool
   */
  public unregisterTool(toolName: string): void {
    if (!this.tools.has(toolName)) {
      throw new Error(`Tool ${toolName} is not registered`);
    }

    this.tools.delete(toolName);
    this.executionStats.delete(toolName);

    this.emit('tool:unregistered', { name: toolName });
  }

  /**
   * Get registered tool
   */
  public getTool(toolName: string): ToolDefinition | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Get all registered tools
   */
  public getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool
   */
  public async execute(
    toolName: string,
    params: any,
    options?: ExecutionOptions
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      // Validate input
      if (mergedOptions.validateInput) {
        const validation = this.validateParameters(tool, params);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
        }
      }

      // Execute with retry logic
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= mergedOptions.retryAttempts; attempt++) {
        try {
          const result = await this.executeWithTimeout(
            tool,
            params,
            mergedOptions.timeout
          );

          // Validate output
          if (mergedOptions.validateOutput && result.data) {
            // Output validation can be extended here
          }

          const executionTime = Date.now() - startTime;
          this.updateStats(toolName, true, executionTime);

          this.emit('tool:executed', {
            toolName,
            success: true,
            executionTime,
            attempt,
          });

          return {
            success: true,
            data: result.data,
            metadata: {
              executionTime,
              retryCount: attempt - 1,
              timestamp: new Date(),
            },
          };

        } catch (error) {
          lastError = error as Error;

          if (attempt < mergedOptions.retryAttempts) {
            this.emit('tool:retry', {
              toolName,
              attempt,
              error: lastError.message,
            });

            await this.delay(mergedOptions.retryDelay * attempt);
          }
        }
      }

      throw lastError || new Error('Tool execution failed');

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateStats(toolName, false, executionTime, error as Error);

      this.emit('tool:error', {
        toolName,
        error: (error as Error).message,
        executionTime,
      });

      return {
        success: false,
        error: (error as Error).message,
        metadata: {
          executionTime,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Execute tool with timeout
   */
  private executeWithTimeout(
    tool: ToolDefinition,
    params: any,
    timeout: number
  ): Promise<ToolExecutionResult> {
    return Promise.race([
      tool.execute(params),
      new Promise<ToolExecutionResult>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
      ),
    ]);
  }

  /**
   * Validate tool parameters
   */
  private validateParameters(tool: ToolDefinition, params: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required parameters
    for (const param of tool.parameters) {
      if (param.required && !(param.name in params)) {
        errors.push(`Missing required parameter: ${param.name}`);
        continue;
      }

      if (!(param.name in params)) {
        continue;
      }

      const value = params[param.name];

      // Type validation
      if (typeof value !== param.type && value !== null && value !== undefined) {
        errors.push(
          `Parameter ${param.name} has wrong type. Expected ${param.type}, got ${typeof value}`
        );
        continue;
      }

      // Custom validation
      if (param.validation) {
        const validation = this.validateParameterValue(param, value);
        if (!validation.valid) {
          errors.push(...(validation.errors || []));
        }
        if (validation.warnings) {
          warnings.push(...validation.warnings);
        }
      }
    }

    // Check for unknown parameters
    for (const key in params) {
      if (!tool.parameters.find(p => p.name === key)) {
        warnings.push(`Unknown parameter: ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate parameter value against constraints
   */
  private validateParameterValue(
    param: ToolParameter,
    value: any
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!param.validation) {
      return { valid: true };
    }

    const v = param.validation;

    // Number validation
    if (param.type === 'number') {
      if (v.min !== undefined && value < v.min) {
        errors.push(`${param.name} must be >= ${v.min}`);
      }
      if (v.max !== undefined && value > v.max) {
        errors.push(`${param.name} must be <= ${v.max}`);
      }
    }

    // String validation
    if (param.type === 'string') {
      if (v.minLength !== undefined && value.length < v.minLength) {
        errors.push(`${param.name} must be at least ${v.minLength} characters`);
      }
      if (v.maxLength !== undefined && value.length > v.maxLength) {
        errors.push(`${param.name} must be at most ${v.maxLength} characters`);
      }
      if (v.pattern && !new RegExp(v.pattern).test(value)) {
        errors.push(`${param.name} does not match pattern ${v.pattern}`);
      }
    }

    // Enum validation
    if (v.enum && !v.enum.includes(value)) {
      errors.push(`${param.name} must be one of: ${v.enum.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Update execution statistics
   */
  private updateStats(
    toolName: string,
    success: boolean,
    executionTime: number,
    error?: Error
  ): void {
    const stats = this.executionStats.get(toolName);

    if (!stats) {
      return;
    }

    stats.totalExecutions++;
    stats.totalExecutionTime += executionTime;
    stats.averageExecutionTime = stats.totalExecutionTime / stats.totalExecutions;
    stats.lastExecuted = new Date();

    if (success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
      if (error) {
        stats.errors.push({
          message: error.message,
          timestamp: new Date(),
        });
        // Keep only last 10 errors
        if (stats.errors.length > 10) {
          stats.errors.shift();
        }
      }
    }
  }

  /**
   * Get execution statistics for a tool
   */
  public getStats(toolName: string): ExecutionStats | undefined {
    return this.executionStats.get(toolName);
  }

  /**
   * Get all execution statistics
   */
  public getAllStats(): Record<string, ExecutionStats> {
    const result: Record<string, ExecutionStats> = {};

    for (const [toolName, stats] of this.executionStats) {
      result[toolName] = stats;
    }

    return result;
  }

  /**
   * Reset statistics for a tool
   */
  public resetStats(toolName: string): void {
    this.executionStats.set(toolName, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      lastExecuted: null,
      errors: [],
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Execution statistics
 */
export interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  lastExecuted: Date | null;
  errors: Array<{ message: string; timestamp: Date }>;
}

export default ToolExecutor;
