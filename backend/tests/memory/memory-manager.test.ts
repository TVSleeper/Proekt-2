/**
 * Memory Manager Tests
 *
 * Comprehensive test suite for memory manager (unified interface)
 * Tests consolidation, cleanup, and multi-memory coordination
 *
 * @module tests/memory/memory-manager.test
 */

import { MemoryManager } from '../../src/memory/memory-manager';
import { MemoryItem } from '../../src/memory/working-memory';

describe('MemoryManager', () => {
  let manager: MemoryManager;

  beforeEach(() => {
    manager = new MemoryManager({
      workingMemoryCapacity: 100,
      episodicMemorySize: 1000,
      semanticMemorySize: 500,
      consolidationInterval: 60000,
      cleanupInterval: 3600000,
    });
  });

  afterEach(() => {
    manager.stop();
    manager.clearAll();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const newManager = new MemoryManager();
      expect(newManager).toBeDefined();
      newManager.stop();
    });

    it('should initialize with custom config', () => {
      expect(manager).toBeDefined();
      const stats = manager.getStatistics();
      expect(stats).toBeDefined();
    });

    it('should have all memory systems available', () => {
      expect(manager.getWorkingMemory('agent-1')).toBeDefined();
      expect(manager.getEpisodicMemory('agent-1')).toBeDefined();
    });
  });

  describe('Working Memory Operations', () => {
    it('should add item to working memory', () => {
      const item: MemoryItem = { data: 'test', timestamp: new Date() };
      manager.addToWorking('agent-1', item);

      const items = manager.getWorkingMemory('agent-1');
      expect(items).toHaveLength(1);
      expect(items[0].data).toBe('test');
    });

    it('should retrieve working memory for agent', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.addToWorking('agent-1', { data: 'item2', timestamp: new Date() });
      manager.addToWorking('agent-2', { data: 'item3', timestamp: new Date() });

      const agent1Items = manager.getWorkingMemory('agent-1');
      expect(agent1Items).toHaveLength(2);
    });

    it('should emit item-added-working event', (done) => {
      manager.on('item-added-working', (event) => {
        expect(event.agentId).toBe('agent-1');
        expect(event.item.data).toBe('test');
        done();
      });

      manager.addToWorking('agent-1', { data: 'test', timestamp: new Date() });
    });
  });

  describe('Episodic Memory Operations', () => {
    it('should store experience in episodic memory', () => {
      const exp = manager.storeExperience('agent-1', 'task-1', { action: 'test' });

      expect(exp).toBeDefined();
      expect(exp.agentId).toBe('agent-1');
      expect(exp.taskId).toBe('task-1');
    });

    it('should retrieve episodic memory for agent', () => {
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });
      manager.storeExperience('agent-1', 'task-2', { data: 'exp2' });
      manager.storeExperience('agent-2', 'task-1', { data: 'exp3' });

      const agent1Exps = manager.getEpisodicMemory('agent-1');
      expect(agent1Exps).toHaveLength(2);
    });

    it('should emit experience-stored event', (done) => {
      manager.on('experience-stored', (event) => {
        expect(event.episode).toBeDefined();
        expect(event.episode.agentId).toBe('agent-1');
        done();
      });

      manager.storeExperience('agent-1', 'task-1', { data: 'test' });
    });
  });

  describe('Semantic Memory Operations', () => {
    it('should store knowledge in semantic memory', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const entry = manager.storeKnowledge('Test knowledge', embedding, { category: 'test' });

      expect(entry).toBeDefined();
      expect(entry.content).toBe('Test knowledge');
      expect(entry.metadata?.category).toBe('test');
    });

    it('should search semantic memory', () => {
      const embedding1 = new Array(768).fill(0).map(() => Math.random());
      const embedding2 = new Array(768).fill(0).map(() => Math.random());

      manager.storeKnowledge('Knowledge 1', embedding1);
      manager.storeKnowledge('Knowledge 2', embedding2);

      const queryEmbedding = new Array(768).fill(0).map(() => Math.random());
      const results = manager.searchSemantic(queryEmbedding, 5);

      expect(results).toBeDefined();
      expect(results.results).toBeDefined();
    });

    it('should emit knowledge-stored event', (done) => {
      manager.on('knowledge-stored', (event) => {
        expect(event.entry).toBeDefined();
        done();
      });

      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Test', embedding);
    });
  });

  describe('Memory Consolidation', () => {
    it('should consolidate memory', () => {
      manager.addToWorking('agent-1', { data: { type: 'success', taskId: 'task-1' }, timestamp: new Date() });
      manager.addToWorking('agent-1', { data: { type: 'success', taskId: 'task-2' }, timestamp: new Date() });

      const consolidated = manager.consolidateMemory({ minImportance: 0.5, batchSize: 10 });

      expect(consolidated).toBeGreaterThanOrEqual(0);
    });

    it('should emit consolidation-completed event', (done) => {
      manager.on('consolidation-completed', (event) => {
        expect(event.consolidated).toBeGreaterThanOrEqual(0);
        done();
      });

      manager.addToWorking('agent-1', { data: { type: 'success', taskId: 'task-1' }, timestamp: new Date() });
      manager.consolidateMemory();
    });
  });

  describe('Memory Cleanup', () => {
    it('should cleanup memories', () => {
      manager.addToWorking('agent-1', { data: 'test', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp' });

      const stats = manager.cleanup();

      expect(stats).toBeDefined();
      expect(stats.working).toBeGreaterThanOrEqual(0);
      expect(stats.episodic).toBeGreaterThanOrEqual(0);
      expect(stats.semantic).toBeGreaterThanOrEqual(0);
    });

    it('should emit cleanup-completed event', (done) => {
      manager.on('cleanup-completed', (event) => {
        expect(event.stats).toBeDefined();
        done();
      });

      manager.cleanup();
    });
  });

  describe('Statistics', () => {
    it('should get comprehensive statistics', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });

      const stats = manager.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.working).toBeDefined();
      expect(stats.episodic).toBeDefined();
      expect(stats.semantic).toBeDefined();
      expect(stats.timestamp).toBeDefined();
    });

    it('should track working memory stats', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.addToWorking('agent-1', { data: 'item2', timestamp: new Date() });

      const stats = manager.getStatistics();

      expect(stats.working.totalItems).toBeGreaterThan(0);
      expect(stats.working.totalAgents).toBeGreaterThan(0);
    });

    it('should track episodic memory stats', () => {
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });
      manager.storeExperience('agent-2', 'task-2', { data: 'exp2' });

      const stats = manager.getStatistics();

      expect(stats.episodic.totalEpisodes).toBeGreaterThan(0);
      expect(stats.episodic.totalAgents).toBeGreaterThan(0);
      expect(stats.episodic.totalTasks).toBeGreaterThan(0);
    });

    it('should track semantic memory stats', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Test', embedding);

      const stats = manager.getStatistics();

      expect(stats.semantic.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('Memory Health', () => {
    it('should get memory health status', () => {
      const health = manager.getHealth();

      expect(health).toBeDefined();
      expect(health.working).toBeDefined();
      expect(health.episodic).toBeDefined();
      expect(health.semantic).toBeDefined();
    });

    it('should report healthy working memory', () => {
      manager.addToWorking('agent-1', { data: 'test', timestamp: new Date() });

      const health = manager.getHealth();

      expect(health.working.healthy).toBe(true);
      expect(health.working.utilization).toBeGreaterThanOrEqual(0);
    });

    it('should report healthy episodic memory', () => {
      manager.storeExperience('agent-1', 'task-1', { data: 'exp' });

      const health = manager.getHealth();

      expect(health.episodic.healthy).toBe(true);
      expect(health.episodic.count).toBeGreaterThan(0);
    });

    it('should report healthy semantic memory', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Test', embedding);

      const health = manager.getHealth();

      expect(health.semantic.healthy).toBe(true);
      expect(health.semantic.count).toBeGreaterThan(0);
    });
  });

  describe('Memory Clearing', () => {
    it('should clear all memories', () => {
      manager.addToWorking('agent-1', { data: 'test', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp' });

      manager.clearAll();

      const stats = manager.getStatistics();
      expect(stats.working.totalItems).toBe(0);
      expect(stats.episodic.totalEpisodes).toBe(0);
    });

    it('should clear agent-specific memories', () => {
      manager.addToWorking('agent-1', { data: 'test1', timestamp: new Date() });
      manager.addToWorking('agent-2', { data: 'test2', timestamp: new Date() });

      manager.clearAgent('agent-1');

      const agent1Items = manager.getWorkingMemory('agent-1');
      const agent2Items = manager.getWorkingMemory('agent-2');

      expect(agent1Items).toHaveLength(0);
      expect(agent2Items).toHaveLength(1);
    });

    it('should emit all-cleared event', (done) => {
      manager.on('all-cleared', (event) => {
        expect(event.timestamp).toBeDefined();
        done();
      });

      manager.clearAll();
    });

    it('should emit agent-cleared event', (done) => {
      manager.on('agent-cleared', (event) => {
        expect(event.agentId).toBe('agent-1');
        done();
      });

      manager.clearAgent('agent-1');
    });
  });

  describe('Export and Import', () => {
    it('should export all memories', () => {
      manager.addToWorking('agent-1', { data: 'test', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp' });

      const exported = manager.export();

      expect(exported).toBeDefined();
      expect(exported.working).toBeDefined();
      expect(exported.episodic).toBeDefined();
      expect(exported.semantic).toBeDefined();
      expect(exported.timestamp).toBeDefined();
    });

    it('should import memories', () => {
      manager.addToWorking('agent-1', { data: 'test', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp' });

      const exported = manager.export();

      const newManager = new MemoryManager();
      newManager.import(exported);

      expect(newManager).toBeDefined();
      newManager.stop();
    });

    it('should emit import-completed event', (done) => {
      manager.on('import-completed', (event) => {
        expect(event.timestamp).toBeDefined();
        done();
      });

      manager.import({ episodic: [] });
    });
  });

  describe('Event Emission', () => {
    it('should emit events for all operations', (done) => {
      let eventCount = 0;

      manager.on('item-added-working', () => eventCount++);
      manager.on('experience-stored', () => eventCount++);
      manager.on('knowledge-stored', () => eventCount++);

      manager.addToWorking('agent-1', { data: 'test', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp' });

      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Test', embedding);

      setTimeout(() => {
        expect(eventCount).toBe(3);
        done();
      }, 100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty memory operations', () => {
      const stats = manager.getStatistics();
      expect(stats.working.totalItems).toBe(0);
      expect(stats.episodic.totalEpisodes).toBe(0);
    });

    it('should handle multiple agents', () => {
      for (let i = 0; i < 5; i++) {
        manager.addToWorking(`agent-${i}`, { data: `test-${i}`, timestamp: new Date() });
        manager.storeExperience(`agent-${i}`, `task-${i}`, { data: `exp-${i}` });
      }

      const stats = manager.getStatistics();
      expect(stats.working.totalAgents).toBe(5);
      expect(stats.episodic.totalAgents).toBe(5);
    });

    it('should handle rapid consolidation calls', () => {
      manager.addToWorking('agent-1', { data: { type: 'success', taskId: 'task-1' }, timestamp: new Date() });

      const result1 = manager.consolidateMemory();
      const result2 = manager.consolidateMemory();
      const result3 = manager.consolidateMemory();

      expect(result1).toBeGreaterThanOrEqual(0);
      expect(result2).toBeGreaterThanOrEqual(0);
      expect(result3).toBeGreaterThanOrEqual(0);
    });
  });
});
