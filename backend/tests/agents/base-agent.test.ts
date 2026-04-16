/**
 * Base Agent Unit Tests
 *
 * Comprehensive test suite for the BaseAgent class.
 * Tests ReAct loop, tool execution, state management, and error handling.
 *
 * Architecture: Phase 1 - Foundation & Infrastructure
 * Task: Task 5 - Framework Tests (85%+ coverage)
 *
 * @module tests/agents/base-agent.test.ts
 */

import { BaseAgent } from '../../src/agents/base-agent';
import type { AgentConfig, Tool, AgentState } from '../../src/agents/base-agent';

describe('BaseAgent', () => {
  let agent: BaseAgent;
  let mockTool: Tool;

  beforeEach(() => {
    // Create test agent
    const config: AgentConfig = {
      name: 'test-agent',
      description: 'Test agent for unit tests',
      maxIterations: 10,
      maxTokensPerTurn: 1000,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 100,
    };

    agent = new BaseAgent(config);

    // Create mock tool
    mockTool = {
      name: 'test-tool',
      description: 'Test tool for unit tests',
      parameters: [
        {
          name: 'input',
          type: 'string',
          description: 'Test input',
          required: true,
        },
      ],
      execute: jest.fn().mockResolvedValue({ success: true, data: 'test result' }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      const info = agent.getInfo();
      expect(info.name).toBe('test-agent');
      expect(info.description).toBe('Test agent for unit tests');
      expect(info.tools).toEqual([]);
    });

    it('should initialize with default state', () => {
      const state = agent.getState();
      expect(state.currentIteration).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.lastAction).toBeNull();
      expect(state.lastObservation).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.error).toBeNull();
    });

    it('should emit initialized event', (done) => {
      const newAgent = new BaseAgent({
        name: 'test-agent-2',
        description: 'Test agent 2',
      });

      newAgent.on('log', (log) => {
        if (log.message.includes('initialized')) {
          done();
        }
      });
    });
  });

  describe('Tool Management', () => {
    it('should register a tool', () => {
      agent.registerTool(mockTool);
      const tools = agent.getTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });

    it('should throw error when registering duplicate tool', () => {
      agent.registerTool(mockTool);
      expect(() => agent.registerTool(mockTool)).toThrow('Tool test-tool is already registered');
    });

    it('should unregister a tool', () => {
      agent.registerTool(mockTool);
      agent.unregisterTool('test-tool');
      const tools = agent.getTools();
      expect(tools).toHaveLength(0);
    });

    it('should throw error when unregistering non-existent tool', () => {
      expect(() => agent.unregisterTool('non-existent')).toThrow('Tool non-existent is not registered');
    });

    it('should get all registered tools', () => {
      const tool2: Tool = {
        name: 'test-tool-2',
        description: 'Second test tool',
        parameters: [],
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      agent.registerTool(mockTool);
      agent.registerTool(tool2);

      const tools = agent.getTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toEqual(['test-tool', 'test-tool-2']);
    });
  });

  describe('State Management', () => {
    it('should get current state', () => {
      const state = agent.getState();
      expect(state).toBeDefined();
      expect(state.currentIteration).toBe(0);
      expect(state.isRunning).toBe(false);
    });

    it('should reset state', () => {
      // Modify state
      const state = agent.getState();
      state.currentIteration = 5;

      // Reset
      agent.resetState();

      // Check reset
      const newState = agent.getState();
      expect(newState.currentIteration).toBe(0);
      expect(newState.history).toEqual([]);
      expect(newState.error).toBeNull();
    });

    it('should prevent concurrent execution', async () => {
      agent.registerTool(mockTool);

      // Start first execution
      const promise1 = agent.execute('task 1');

      // Try to start second execution
      await expect(agent.execute('task 2')).rejects.toThrow('Agent is already running');

      // Wait for first to complete
      await promise1;
    });
  });

  describe('Tool Execution', () => {
    it('should execute registered tool', async () => {
      agent.registerTool(mockTool);

      const result = await (agent as any).executeAction('test-tool', { input: 'test' });

      expect(result).toEqual({ success: true, data: 'test result' });
      expect(mockTool.execute).toHaveBeenCalledWith({ input: 'test' });
    });

    it('should throw error for non-existent tool', async () => {
      await expect((agent as any).executeAction('non-existent', {})).rejects.toThrow(
        'Tool non-existent not found'
      );
    });

    it('should retry on tool execution failure', async () => {
      const failingTool: Tool = {
        name: 'failing-tool',
        description: 'Tool that fails',
        parameters: [],
        execute: jest.fn()
          .mockRejectedValueOnce(new Error('First attempt failed'))
          .mockRejectedValueOnce(new Error('Second attempt failed'))
          .mockResolvedValueOnce({ success: true, data: 'success' }),
      };

      agent.registerTool(failingTool);

      const result = await (agent as any).executeAction('failing-tool', {});

      expect(result).toEqual({ success: true, data: 'success' });
      expect(failingTool.execute).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const failingTool: Tool = {
        name: 'always-failing',
        description: 'Tool that always fails',
        parameters: [],
        execute: jest.fn().mockRejectedValue(new Error('Always fails')),
      };

      agent.registerTool(failingTool);

      await expect((agent as any).executeAction('always-failing', {})).rejects.toThrow(
        'Tool execution failed'
      );

      expect(failingTool.execute).toHaveBeenCalledTimes(3); // retryAttempts = 3
    });
  });

  describe('Event Emission', () => {
    it('should emit step event during execution', (done) => {
      agent.registerTool(mockTool);

      agent.on('step', (step) => {
        expect(step).toBeDefined();
        expect(step.iteration).toBeDefined();
        done();
      });

      agent.execute('test task').catch(() => {
        // Ignore execution errors for this test
      });
    });

    it('should emit log events', (done) => {
      let logCount = 0;

      agent.on('log', (log) => {
        logCount++;
        expect(log.level).toBeDefined();
        expect(log.message).toBeDefined();
        expect(log.timestamp).toBeDefined();

        if (logCount >= 2) {
          done();
        }
      });

      agent.registerTool(mockTool);
    });
  });

  describe('Error Handling', () => {
    it('should handle execution timeout', async () => {
      const slowTool: Tool = {
        name: 'slow-tool',
        description: 'Slow tool',
        parameters: [],
        execute: jest.fn(() => new Promise(resolve => setTimeout(resolve, 10000))),
      };

      agent.registerTool(slowTool);

      await expect(agent.execute('slow task')).rejects.toThrow('timeout');
    });

    it('should handle max iterations', async () => {
      const config: AgentConfig = {
        name: 'limited-agent',
        description: 'Agent with limited iterations',
        maxIterations: 1,
      };

      const limitedAgent = new BaseAgent(config);
      limitedAgent.registerTool(mockTool);

      await expect(limitedAgent.execute('task')).rejects.toThrow('Max iterations');
    });

    it('should store error in state', async () => {
      const config: AgentConfig = {
        name: 'error-agent',
        description: 'Agent that will error',
        maxIterations: 1,
      };

      const errorAgent = new BaseAgent(config);

      try {
        await errorAgent.execute('task');
      } catch (error) {
        // Expected
      }

      const state = errorAgent.getState();
      expect(state.error).toBeDefined();
    });
  });

  describe('Agent Info', () => {
    it('should return agent info', () => {
      agent.registerTool(mockTool);

      const info = agent.getInfo();

      expect(info.name).toBe('test-agent');
      expect(info.description).toBe('Test agent for unit tests');
      expect(info.tools).toEqual(['test-tool']);
    });
  });

  describe('Agent Stop', () => {
    it('should stop running agent', async () => {
      agent.registerTool(mockTool);

      const executePromise = agent.execute('task');

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 100));

      agent.stop();

      const state = agent.getState();
      expect(state.isRunning).toBe(false);
    });

    it('should not error when stopping idle agent', () => {
      expect(() => agent.stop()).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should complete a simple task', async () => {
      agent.registerTool(mockTool);

      // Override reasoning to return completion
      (agent as any).reason = jest.fn().mockResolvedValue('Task complete');
      (agent as any).isTaskComplete = jest.fn().mockReturnValue(true);
      (agent as any).extractFinalAnswer = jest.fn().mockReturnValue('Final answer');

      const result = await agent.execute('simple task');

      expect(result).toBe('Final answer');
    });

    it('should track execution history', async () => {
      agent.registerTool(mockTool);

      // Override methods for predictable behavior
      (agent as any).reason = jest.fn().mockResolvedValue('Thinking...');
      (agent as any).selectAction = jest.fn().mockResolvedValue({
        name: 'test-tool',
        input: { test: 'input' },
      });
      (agent as any).isTaskComplete = jest.fn().mockReturnValue(true);

      try {
        await agent.execute('task');
      } catch (error) {
        // Ignore
      }

      const state = agent.getState();
      expect(state.history.length).toBeGreaterThan(0);
    });
  });
});
