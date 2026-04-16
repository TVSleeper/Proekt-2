/**
 * Base Agent Class with ReAct Loop
 *
 * This is the foundational agent class that implements the ReAct (Reason-Act-Observe) pattern.
 * All specialized agents will extend this base class.
 *
 * Architecture: Phase 1 - Foundation & Infrastructure
 * Task: Task 1 - Base Agent Class with ReAct Loop
 *
 * @module agents/base-agent
 */

import { EventEmitter } from 'events';

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  name: string;
  description: string;
  maxIterations?: number;
  maxTokensPerTurn?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Tool interface for agent actions
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

/**
 * Agent state interface
 */
export interface AgentState {
  currentIteration: number;
  isRunning: boolean;
  lastAction: string | null;
  lastObservation: any | null;
  history: Array<{
    thought: string;
    action: string;
    observation: any;
    timestamp: Date;
  }>;
  error: Error | null;
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
}

/**
 * Base Agent Class
 *
 * Implements the ReAct loop pattern:
 * 1. Reason - Think about what to do next
 * 2. Act - Execute a tool/action
 * 3. Observe - Process the result
 * 4. Repeat until task complete or max iterations reached
 */
export class BaseAgent extends EventEmitter {
  protected config: Required<AgentConfig>;
  protected tools: Map<string, Tool>;
  protected state: AgentState;
  protected logger: any; // Will be replaced with proper logger

  constructor(config: AgentConfig) {
    super();

    // Set default configuration
    this.config = {
      name: config.name,
      description: config.description,
      maxIterations: config.maxIterations || 100,
      maxTokensPerTurn: config.maxTokensPerTurn || 1000,
      timeout: config.timeout || 300000, // 5 minutes
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    // Initialize tools registry
    this.tools = new Map();

    // Initialize state
    this.state = {
      currentIteration: 0,
      isRunning: false,
      lastAction: null,
      lastObservation: null,
      history: [],
      error: null,
    };

    // TODO: Initialize proper logger
    this.logger = console;

    this.log('info', `Agent ${this.config.name} initialized`);
  }

  /**
   * Register a tool for the agent to use
   */
  public registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }

    this.tools.set(tool.name, tool);
    this.log('info', `Tool ${tool.name} registered`);
  }

  /**
   * Unregister a tool
   */
  public unregisterTool(toolName: string): void {
    if (!this.tools.has(toolName)) {
      throw new Error(`Tool ${toolName} is not registered`);
    }

    this.tools.delete(toolName);
    this.log('info', `Tool ${toolName} unregistered`);
  }

  /**
   * Get all registered tools
   */
  public getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get current agent state
   */
  public getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Reset agent state
   */
  public resetState(): void {
    this.state = {
      currentIteration: 0,
      isRunning: false,
      lastAction: null,
      lastObservation: null,
      history: [],
      error: null,
    };
    this.log('info', 'Agent state reset');
  }

  /**
   * Main execution method - implements ReAct loop
   *
   * @param task - The task description for the agent to execute
   * @returns The final result or error
   */
  public async execute(task: string): Promise<any> {
    this.log('info', `Starting execution for task: ${task}`);

    // Check if already running
    if (this.state.isRunning) {
      throw new Error('Agent is already running');
    }

    // Reset state for new execution
    this.resetState();
    this.state.isRunning = true;

    try {
      // Set timeout for entire execution
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Agent execution timeout')), this.config.timeout);
      });

      const executionPromise = this.runReActLoop(task);

      const result = await Promise.race([executionPromise, timeoutPromise]);

      this.log('info', 'Execution completed successfully');
      return result;

    } catch (error) {
      this.state.error = error as Error;
      this.log('error', `Execution failed: ${(error as Error).message}`);
      throw error;

    } finally {
      this.state.isRunning = false;
    }
  }

  /**
   * ReAct loop implementation
   *
   * Implements the Reason-Act-Observe cycle:
   * 1. Reason about what to do next
   * 2. Select and execute an action (tool)
   * 3. Observe the result
   * 4. Repeat until done or max iterations
   */
  protected async runReActLoop(task: string): Promise<any> {
    let result: any = null;

    while (this.state.currentIteration < this.config.maxIterations) {
      this.state.currentIteration++;

      this.log('info', `ReAct iteration ${this.state.currentIteration}/${this.config.maxIterations}`);

      try {
        // Step 1: Reason - Think about what to do next
        const thought = await this.reason(task, this.state.history);
        this.log('debug', `Thought: ${thought}`);

        // Check if task is complete
        if (this.isTaskComplete(thought)) {
          this.log('info', 'Task marked as complete');
          result = this.extractFinalAnswer(thought);
          break;
        }

        // Step 2: Act - Select and execute action
        const action = await this.selectAction(thought);
        this.log('debug', `Action selected: ${action.name}`);

        const observation = await this.executeAction(action.name, action.input);
        this.log('debug', `Observation: ${JSON.stringify(observation)}`);

        // Step 3: Observe - Store the result
        this.state.lastAction = action.name;
        this.state.lastObservation = observation;

        // Add to history
        this.state.history.push({
          thought,
          action: action.name,
          observation,
          timestamp: new Date(),
        });

        // Emit step event
        this.emit('step', {
          iteration: this.state.currentIteration,
          thought,
          action: action.name,
          observation,
        });

        // Check if we got a final result
        if (this.isFinalResult(observation)) {
          result = observation;
          break;
        }

      } catch (error) {
        this.log('error', `Error in ReAct iteration ${this.state.currentIteration}: ${(error as Error).message}`);

        // Retry logic
        const shouldRetry = await this.shouldRetry(error as Error);
        if (!shouldRetry) {
          throw error;
        }

        this.log('info', 'Retrying after error...');
        await this.delay(this.config.retryDelay);
      }
    }

    // Check if we hit max iterations
    if (this.state.currentIteration >= this.config.maxIterations) {
      throw new Error(`Max iterations (${this.config.maxIterations}) reached without completion`);
    }

    return result;
  }

  /**
   * Reason about what to do next
   * This is a placeholder - will be implemented by specialized agents
   */
  protected async reason(task: string, history: AgentState['history']): Promise<string> {
    // TODO: Implement reasoning logic with LLM
    // For now, return a simple thought
    return `Thinking about task: ${task}`;
  }

  /**
   * Select an action based on reasoning
   * This is a placeholder - will be implemented by specialized agents
   */
  protected async selectAction(thought: string): Promise<{ name: string; input: any }> {
    // TODO: Implement action selection logic
    // For now, return a dummy action
    return {
      name: 'dummy_action',
      input: {},
    };
  }

  /**
   * Execute an action (tool)
   */
  protected async executeAction(actionName: string, input: any): Promise<any> {
    const tool = this.tools.get(actionName);

    if (!tool) {
      throw new Error(`Tool ${actionName} not found`);
    }

    this.log('info', `Executing tool: ${actionName}`);

    try {
      // Execute tool with retry logic
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          const result = await tool.execute(input);
          this.log('info', `Tool ${actionName} executed successfully`);
          return result;

        } catch (error) {
          lastError = error as Error;
          this.log('warn', `Tool execution attempt ${attempt} failed: ${lastError.message}`);

          if (attempt < this.config.retryAttempts) {
            await this.delay(this.config.retryDelay * attempt);
          }
        }
      }

      throw lastError || new Error('Tool execution failed');

    } catch (error) {
      this.log('error', `Tool ${actionName} execution failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Check if task is complete based on thought
   */
  protected isTaskComplete(thought: string): boolean {
    // TODO: Implement proper completion detection
    return thought.toLowerCase().includes('task complete') ||
           thought.toLowerCase().includes('final answer');
  }

  /**
   * Check if observation contains final result
   */
  protected isFinalResult(observation: any): boolean {
    // TODO: Implement proper final result detection
    return observation && observation.final === true;
  }

  /**
   * Extract final answer from thought
   */
  protected extractFinalAnswer(thought: string): any {
    // TODO: Implement proper answer extraction
    return thought;
  }

  /**
   * Determine if should retry after error
   */
  protected async shouldRetry(error: Error): Promise<boolean> {
    // Don't retry on certain errors
    if (error.message.includes('timeout') ||
        error.message.includes('max iterations')) {
      return false;
    }

    return true;
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging helper
   */
  protected log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.config.name}] [${level.toUpperCase()}] ${message}`;

    // Emit log event
    this.emit('log', { level, message, timestamp });

    // Log to console (will be replaced with proper logger)
    switch (level) {
      case 'error':
        this.logger.error(logMessage);
        break;
      case 'warn':
        this.logger.warn(logMessage);
        break;
      case 'info':
        this.logger.info(logMessage);
        break;
      case 'debug':
        this.logger.debug(logMessage);
        break;
      default:
        this.logger.log(logMessage);
    }
  }

  /**
   * Stop agent execution
   */
  public stop(): void {
    if (this.state.isRunning) {
      this.log('info', 'Stopping agent execution');
      this.state.isRunning = false;
    }
  }

  /**
   * Get agent info
   */
  public getInfo(): { name: string; description: string; tools: string[] } {
    return {
      name: this.config.name,
      description: this.config.description,
      tools: Array.from(this.tools.keys()),
    };
  }
}

export default BaseAgent;
