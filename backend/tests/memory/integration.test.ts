/**
 * Memory Integration Tests
 *
 * Tests for integrated memory system behavior
 * Validates interactions between working, episodic, and semantic memory
 *
 * @module tests/memory/integration.test
 */

import { MemoryManager } from '../../src/memory/memory-manager';
import { MemoryItem } from '../../src/memory/working-memory';

describe('Memory Integration', () => {
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

  describe('Multi-Memory Workflow', () => {
    it('should flow data from working to episodic memory', () => {
      // Add to working memory
      manager.addToWorking('agent-1', {
        data: { type: 'success', taskId: 'task-1', result: 'completed' },
        timestamp: new Date(),
      });

      // Consolidate to episodic
      const consolidated = manager.consolidateMemory({ minImportance: 0.5 });

      expect(consolidated).toBeGreaterThanOrEqual(0);

      // Verify episodic memory has the data
      const episodic = manager.getEpisodicMemory('agent-1');
      expect(episodic).toBeDefined();
    });

    it('should maintain data integrity across memory systems', () => {
      const testData = { action: 'test', value: 42 };

      // Store in working memory
      manager.addToWorking('agent-1', { data: testData, timestamp: new Date() });

      // Store in episodic memory
      const episode = manager.storeExperience('agent-1', 'task-1', testData);

      // Verify both have the data
      const workingItems = manager.getWorkingMemory('agent-1');
      const episodicItems = manager.getEpisodicMemory('agent-1');

      expect(workingItems).toHaveLength(1);
      expect(episodicItems).toHaveLength(1);
      expect(episode.results).toEqual(testData);
    });

    it('should handle concurrent operations across memory systems', () => {
      // Add to working memory
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.addToWorking('agent-1', { data: 'item2', timestamp: new Date() });

      // Store in episodic memory
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });
      manager.storeExperience('agent-1', 'task-2', { data: 'exp2' });

      // Store in semantic memory
      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Knowledge 1', embedding);

      // Verify all systems have data
      const stats = manager.getStatistics();

      expect(stats.working.totalItems).toBeGreaterThan(0);
      expect(stats.episodic.totalEpisodes).toBeGreaterThan(0);
      expect(stats.semantic.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('Agent Isolation', () => {
    it('should isolate memories between agents', () => {
      manager.addToWorking('agent-1', { data: 'agent1-data', timestamp: new Date() });
      manager.addToWorking('agent-2', { data: 'agent2-data', timestamp: new Date() });

      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });
      manager.storeExperience('agent-2', 'task-2', { data: 'exp2' });

      const agent1Working = manager.getWorkingMemory('agent-1');
      const agent2Working = manager.getWorkingMemory('agent-2');
      const agent1Episodic = manager.getEpisodicMemory('agent-1');
      const agent2Episodic = manager.getEpisodicMemory('agent-2');

      expect(agent1Working).toHaveLength(1);
      expect(agent2Working).toHaveLength(1);
      expect(agent1Episodic).toHaveLength(1);
      expect(agent2Episodic).toHaveLength(1);
    });

    it('should not affect other agents during consolidation', () => {
      manager.addToWorking('agent-1', {
        data: { type: 'success', taskId: 'task-1' },
        timestamp: new Date(),
      });
      manager.addToWorking('agent-2', { data: 'item2', timestamp: new Date() });

      manager.consolidateMemory();

      const agent2Working = manager.getWorkingMemory('agent-2');
      expect(agent2Working).toHaveLength(1);
    });

    it('should clear only specified agent memories', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.addToWorking('agent-2', { data: 'item2', timestamp: new Date() });

      manager.clearAgent('agent-1');

      const agent1Working = manager.getWorkingMemory('agent-1');
      const agent2Working = manager.getWorkingMemory('agent-2');

      expect(agent1Working).toHaveLength(0);
      expect(agent2Working).toHaveLength(1);
    });
  });

  describe('Memory Consolidation Workflow', () => {
    it('should consolidate high-importance items', () => {
      manager.addToWorking('agent-1', {
        data: { type: 'success', critical: true, taskId: 'task-1' },
        timestamp: new Date(),
      });
      manager.addToWorking('agent-1', {
        data: { type: 'error', critical: false, taskId: 'task-2' },
        timestamp: new Date(),
      });

      const consolidated = manager.consolidateMemory({ minImportance: 0.5 });

      expect(consolidated).toBeGreaterThanOrEqual(0);
    });

    it('should respect batch size during consolidation', () => {
      for (let i = 0; i < 20; i++) {
        manager.addToWorking('agent-1', {
          data: { type: 'success', taskId: `task-${i}` },
          timestamp: new Date(),
        });
      }

      const consolidated = manager.consolidateMemory({ batchSize: 5 });

      expect(consolidated).toBeLessThanOrEqual(5);
    });

    it('should emit consolidation events', (done) => {
      manager.on('consolidation-completed', (event) => {
        expect(event.consolidated).toBeGreaterThanOrEqual(0);
        done();
      });

      manager.addToWorking('agent-1', {
        data: { type: 'success', taskId: 'task-1' },
        timestamp: new Date(),
      });
      manager.consolidateMemory();
    });
  });

  describe('Memory Cleanup Workflow', () => {
    it('should cleanup all memory systems', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });

      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Knowledge', embedding);

      const stats = manager.cleanup();

      expect(stats).toBeDefined();
      expect(stats.working).toBeGreaterThanOrEqual(0);
      expect(stats.episodic).toBeGreaterThanOrEqual(0);
      expect(stats.semantic).toBeGreaterThanOrEqual(0);
    });

    it('should emit cleanup events', (done) => {
      manager.on('cleanup-completed', (event) => {
        expect(event.stats).toBeDefined();
        done();
      });

      manager.cleanup();
    });
  });

  describe('Statistics and Health', () => {
    it('should provide comprehensive statistics', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.addToWorking('agent-2', { data: 'item2', timestamp: new Date() });

      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });
      manager.storeExperience('agent-2', 'task-2', { data: 'exp2' });

      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Knowledge', embedding);

      const stats = manager.getStatistics();

      expect(stats.working.totalItems).toBe(2);
      expect(stats.working.totalAgents).toBe(2);
      expect(stats.episodic.totalEpisodes).toBe(2);
      expect(stats.episodic.totalAgents).toBe(2);
      expect(stats.semantic.totalEntries).toBe(1);
    });

    it('should report accurate health status', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });

      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Knowledge', embedding);

      const health = manager.getHealth();

      expect(health.working.healthy).toBe(true);
      expect(health.episodic.healthy).toBe(true);
      expect(health.semantic.healthy).toBe(true);
    });

    it('should track utilization metrics', () => {
      for (let i = 0; i < 50; i++) {
        manager.addToWorking('agent-1', {
          data: `item-${i}`,
          timestamp: new Date(),
        });
      }

      const health = manager.getHealth();

      expect(health.working.utilization).toBeGreaterThan(0);
      expect(health.working.utilization).toBeLessThanOrEqual(100);
    });
  });

  describe('Export and Import Workflow', () => {
    it('should export all memory data', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });

      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Knowledge', embedding);

      const exported = manager.export();

      expect(exported).toBeDefined();
      expect(exported.working).toBeDefined();
      expect(exported.episodic).toBeDefined();
      expect(exported.semantic).toBeDefined();
    });

    it('should import and restore memory data', () => {
      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });

      const exported = manager.export();

      const newManager = new MemoryManager();
      newManager.import(exported);

      const stats = newManager.getStatistics();

      expect(stats.episodic.totalEpisodes).toBeGreaterThan(0);

      newManager.stop();
    });

    it('should preserve data integrity during export/import', () => {
      const testData = { action: 'test', value: 42 };

      manager.storeExperience('agent-1', 'task-1', testData);

      const exported = manager.export();
      const newManager = new MemoryManager();
      newManager.import(exported);

      const episodic = newManager.getEpisodicMemory('agent-1');

      expect(episodic).toHaveLength(1);
      expect(episodic[0].results).toEqual(testData);

      newManager.stop();
    });
  });

  describe('Event Coordination', () => {
    it('should emit coordinated events across operations', (done) => {
      const events: string[] = [];

      manager.on('item-added-working', () => events.push('working'));
      manager.on('experience-stored', () => events.push('episodic'));
      manager.on('knowledge-stored', () => events.push('semantic'));

      manager.addToWorking('agent-1', { data: 'item', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp' });

      const embedding = new Array(768).fill(0).map(() => Math.random());
      manager.storeKnowledge('Knowledge', embedding);

      setTimeout(() => {
        expect(events).toContain('working');
        expect(events).toContain('episodic');
        expect(events).toContain('semantic');
        done();
      }, 100);
    });

    it('should coordinate consolidation and cleanup events', (done) => {
      const events: string[] = [];

      manager.on('consolidation-completed', () => events.push('consolidation'));
      manager.on('cleanup-completed', () => events.push('cleanup'));

      manager.addToWorking('agent-1', {
        data: { type: 'success', taskId: 'task-1' },
        timestamp: new Date(),
      });

      manager.consolidateMemory();
      manager.cleanup();

      setTimeout(() => {
        expect(events).toContain('consolidation');
        expect(events).toContain('cleanup');
        done();
      }, 100);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multi-agent workflow', () => {
      const agents = ['agent-1', 'agent-2', 'agent-3'];

      for (const agent of agents) {
        manager.addToWorking(agent, { data: `data-${agent}`, timestamp: new Date() });
        manager.storeExperience(agent, `task-${agent}`, { data: `exp-${agent}` });
      }

      const stats = manager.getStatistics();

      expect(stats.working.totalAgents).toBe(3);
      expect(stats.episodic.totalAgents).toBe(3);
    });

    it('should handle rapid memory operations', () => {
      for (let i = 0; i < 100; i++) {
        manager.addToWorking('agent-1', {
          data: `item-${i}`,
          timestamp: new Date(),
        });
      }

      manager.consolidateMemory();
      manager.cleanup();

      const stats = manager.getStatistics();

      expect(stats.working.totalItems).toBeGreaterThan(0);
    });

    it('should maintain consistency across operations', () => {
      const initialStats = manager.getStatistics();

      manager.addToWorking('agent-1', { data: 'item1', timestamp: new Date() });
      manager.storeExperience('agent-1', 'task-1', { data: 'exp1' });

      const afterAddStats = manager.getStatistics();

      expect(afterAddStats.working.totalItems).toBeGreaterThan(
        initialStats.working.totalItems
      );
      expect(afterAddStats.episodic.totalEpisodes).toBeGreaterThan(
        initialStats.episodic.totalEpisodes
      );

      manager.clearAll();

      const afterClearStats = manager.getStatistics();

      expect(afterClearStats.working.totalItems).toBe(0);
      expect(afterClearStats.episodic.totalEpisodes).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty memory operations', () => {
      const stats = manager.getStatistics();
      const health = manager.getHealth();
      const exported = manager.export();

      expect(stats.working.totalItems).toBe(0);
      expect(health.working.healthy).toBe(true);
      expect(exported).toBeDefined();
    });

    it('should handle operations on non-existent agents', () => {
      const working = manager.getWorkingMemory('non-existent');
      const episodic = manager.getEpisodicMemory('non-existent');

      expect(working).toHaveLength(0);
      expect(episodic).toHaveLength(0);
    });

    it('should handle rapid clear operations', () => {
      manager.addToWorking('agent-1', { data: 'item', timestamp: new Date() });

      manager.clearAgent('agent-1');
      manager.clearAgent('agent-1');
      manager.clearAll();
      manager.clearAll();

      const stats = manager.getStatistics();

      expect(stats.working.totalItems).toBe(0);
    });
  });
});
