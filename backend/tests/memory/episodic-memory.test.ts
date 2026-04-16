/**
 * Episodic Memory Tests
 *
 * Comprehensive test suite for episodic memory (long-term storage)
 *
 * @module tests/memory/episodic-memory.test
 */

import { EpisodicMemory, Episode } from '../../src/memory/episodic-memory';

describe('EpisodicMemory', () => {
  let memory: EpisodicMemory;

  beforeEach(() => {
    memory = new EpisodicMemory({ maxEpisodes: 1000 });
  });

  afterEach(() => {
    memory.clear();
  });

  describe('Basic Operations', () => {
    it('should store an episode', () => {
      const episode = memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [{ type: 'observation' }],
        actions: [{ type: 'action' }],
        results: { success: true },
      });

      expect(episode).toBeDefined();
      expect(episode.id).toBeDefined();
      expect(episode.agentId).toBe('agent-1');
      expect(episode.taskId).toBe('task-1');
    });

    it('should retrieve episode by ID', () => {
      const stored = memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: { data: 'test' },
      });

      const retrieved = memory.getEpisode(stored.id);

      expect(retrieved).toEqual(stored);
    });

    it('should return undefined for non-existent episode', () => {
      const retrieved = memory.getEpisode('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should get all episodes for an agent', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: { data: 'exp1' },
      });

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: { data: 'exp2' },
      });

      memory.storeEpisode({
        agentId: 'agent-2',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: { data: 'exp3' },
      });

      const agent1Episodes = memory.getByAgent('agent-1');

      expect(agent1Episodes).toHaveLength(2);
      expect(agent1Episodes.every(e => e.agentId === 'agent-1')).toBe(true);
    });
  });

  describe('Retrieval Operations', () => {
    it('should retrieve episodes by timeframe', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 10000);
      const future = new Date(now.getTime() + 10000);

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: now,
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      const result = memory.getByTimeframe({
        agentId: 'agent-1',
        startTime: past,
        endTime: future,
      });

      expect(result.episodes).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should retrieve episodes by task', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-2',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      const result = memory.getByTask({
        agentId: 'agent-1',
        taskId: 'task-1',
      });

      expect(result.episodes).toHaveLength(1);
      expect(result.episodes[0].agentId).toBe('agent-1');
    });

    it('should search episodes by predicate', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: { success: true },
      });

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: { success: false },
      });

      const successful = memory.search((ep: Episode) => ep.results?.success === true);

      expect(successful).toHaveLength(1);
      expect(successful[0].taskId).toBe('task-1');
    });
  });

  describe('Update Operations', () => {
    it('should update episode metadata', () => {
      const episode = memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
        metadata: { version: 1 },
      });

      const updated = memory.updateEpisode(episode.id, {
        metadata: { version: 2, updated: true },
      });

      expect(updated?.metadata?.version).toBe(2);
      expect(updated?.metadata?.updated).toBe(true);
    });

    it('should return undefined when updating non-existent episode', () => {
      const updated = memory.updateEpisode('non-existent', { duration: 200 });

      expect(updated).toBeUndefined();
    });
  });

  describe('Deletion Operations', () => {
    it('should delete episode', () => {
      const episode = memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      const deleted = memory.deleteEpisode(episode.id);

      expect(deleted).toBe(true);
      expect(memory.getEpisode(episode.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent episode', () => {
      const deleted = memory.deleteEpisode('non-existent');

      expect(deleted).toBe(false);
    });

    it('should clear all episodes', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.clear();

      expect(memory.getCount()).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-2',
        taskId: 'task-2',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      const stats = memory.getStatistics();

      expect(stats.totalEpisodes).toBe(2);
      expect(stats.totalAgents).toBe(2);
      expect(stats.totalTasks).toBe(2);
      expect(stats.averageEpisodesPerAgent).toBe(1);
    });

    it('should track oldest and newest episodes', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000);

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: past,
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        timestamp: now,
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      const stats = memory.getStatistics();

      expect(stats.oldestEpisode).toBeDefined();
      expect(stats.newestEpisode).toBeDefined();
      expect(stats.oldestEpisode?.getTime()).toBeLessThan(stats.newestEpisode?.getTime() || 0);
    });
  });

  describe('Count Operations', () => {
    it('should get total episode count', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      expect(memory.getCount()).toBe(2);
    });

    it('should get count by agent', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-2',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      expect(memory.getCountByAgent('agent-1')).toBe(2);
      expect(memory.getCountByAgent('agent-2')).toBe(1);
    });

    it('should get count by task', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-2',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      expect(memory.getCountByTask('task-1')).toBe(2);
    });
  });

  describe('Export and Import', () => {
    it('should export all episodes', () => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      const exported = memory.export();

      expect(exported).toHaveLength(2);
      expect(exported[0].id).toBeDefined();
    });

    it('should import episodes', () => {
      const episode1 = memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      const exported = memory.export();
      const newMemory = new EpisodicMemory({ maxEpisodes: 1000 });

      newMemory.import(exported);

      expect(newMemory.getCount()).toBe(1);
      expect(newMemory.getEpisode(episode1.id)).toBeDefined();
    });
  });

  describe('Capacity Management', () => {
    it('should enforce maximum episode capacity', () => {
      const smallMemory = new EpisodicMemory({ maxEpisodes: 5 });

      for (let i = 0; i < 10; i++) {
        smallMemory.storeEpisode({
          agentId: 'agent-1',
          taskId: `task-${i}`,
          timestamp: new Date(),
          duration: 100,
          observations: [],
          actions: [],
          results: {},
        });
      }

      expect(smallMemory.getCount()).toBeLessThanOrEqual(5);
    });
  });

  describe('Events', () => {
    it('should emit episode:stored event', (done) => {
      memory.on('episode:stored', (data) => {
        expect(data.episode).toBeDefined();
        expect(data.timestamp).toBeDefined();
        done();
      });

      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });
    });

    it('should emit episode:updated event', (done) => {
      const episode = memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.on('episode:updated', (data) => {
        expect(data.episode).toBeDefined();
        done();
      });

      memory.updateEpisode(episode.id, { duration: 200 });
    });

    it('should emit episode:deleted event', (done) => {
      const episode = memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.on('episode:deleted', (data) => {
        expect(data.episodeId).toBe(episode.id);
        done();
      });

      memory.deleteEpisode(episode.id);
    });

    it('should emit cleared event', (done) => {
      memory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        timestamp: new Date(),
        duration: 100,
        observations: [],
        actions: [],
        results: {},
      });

      memory.on('cleared', (data) => {
        expect(data.count).toBe(1);
        done();
      });

      memory.clear();
    });
  });
});
