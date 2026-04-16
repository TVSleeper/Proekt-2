/**
 * Working Memory Tests
 *
 * Comprehensive test suite for working memory (short-term storage)
 *
 * @module tests/memory/working-memory.test
 */

import { WorkingMemory } from '../../src/memory/working-memory';

describe('WorkingMemory', () => {
  let memory: WorkingMemory;

  beforeEach(() => {
    memory = new WorkingMemory({ maxCapacity: 10 });
  });

  afterEach(() => {
    memory.clear();
  });

  describe('Basic Operations', () => {
    it('should add item to working memory', () => {
      const item = { data: 'test', timestamp: new Date() };
      memory.add('agent-1', item);

      const items = memory.getAll('agent-1');
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(item);
    });

    it('should retrieve item from working memory', () => {
      const item = { data: 'test', timestamp: new Date() };
      memory.add('agent-1', item);

      const retrieved = memory.get('agent-1', 0);
      expect(retrieved).toEqual(item);
    });

    it('should get all items for an agent', () => {
      const item1 = { data: 'test1', timestamp: new Date() };
      const item2 = { data: 'test2', timestamp: new Date() };

      memory.add('agent-1', item1);
      memory.add('agent-1', item2);

      const items = memory.getAll('agent-1');
      expect(items).toHaveLength(2);
    });

    it('should clear working memory for an agent', () => {
      memory.add('agent-1', { data: 'test' });
      memory.clear('agent-1');

      const items = memory.getAll('agent-1');
      expect(items).toHaveLength(0);
    });

    it('should return empty array for non-existent agent', () => {
      const items = memory.getAll('non-existent');
      expect(items).toHaveLength(0);
    });
  });

  describe('Capacity Management', () => {
    it('should enforce maximum capacity', () => {
      const smallMemory = new WorkingMemory({ maxCapacity: 3 });

      smallMemory.add('agent-1', { data: 'item1' });
      smallMemory.add('agent-1', { data: 'item2' });
      smallMemory.add('agent-1', { data: 'item3' });
      smallMemory.add('agent-1', { data: 'item4' });

      const items = smallMemory.getAll('agent-1');
      expect(items).toHaveLength(3);
    });

    it('should use FIFO eviction policy', () => {
      const smallMemory = new WorkingMemory({ maxCapacity: 2 });

      smallMemory.add('agent-1', { data: 'first' });
      smallMemory.add('agent-1', { data: 'second' });
      smallMemory.add('agent-1', { data: 'third' });

      const items = smallMemory.getAll('agent-1');
      expect(items[0].data).toBe('second');
      expect(items[1].data).toBe('third');
    });

    it('should get current size', () => {
      memory.add('agent-1', { data: 'item1' });
      memory.add('agent-1', { data: 'item2' });

      const size = memory.getSize('agent-1');
      expect(size).toBe(2);
    });

    it('should check if at capacity', () => {
      const smallMemory = new WorkingMemory({ maxCapacity: 2 });

      smallMemory.add('agent-1', { data: 'item1' });
      expect(smallMemory.isAtCapacity('agent-1')).toBe(false);

      smallMemory.add('agent-1', { data: 'item2' });
      expect(smallMemory.isAtCapacity('agent-1')).toBe(true);
    });
  });

  describe('Memory Isolation', () => {
    it('should isolate memory between agents', () => {
      memory.add('agent-1', { data: 'agent1-data' });
      memory.add('agent-2', { data: 'agent2-data' });

      const agent1Items = memory.getAll('agent-1');
      const agent2Items = memory.getAll('agent-2');

      expect(agent1Items).toHaveLength(1);
      expect(agent2Items).toHaveLength(1);
      expect(agent1Items[0].data).toBe('agent1-data');
      expect(agent2Items[0].data).toBe('agent2-data');
    });

    it('should not affect other agents when clearing', () => {
      memory.add('agent-1', { data: 'agent1-data' });
      memory.add('agent-2', { data: 'agent2-data' });

      memory.clear('agent-1');

      expect(memory.getAll('agent-1')).toHaveLength(0);
      expect(memory.getAll('agent-2')).toHaveLength(1);
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      memory.add('agent-1', { data: 'test1', type: 'observation' });
      memory.add('agent-1', { data: 'test2', type: 'action' });
      memory.add('agent-1', { data: 'test3', type: 'observation' });
    });

    it('should search items by predicate', () => {
      const results = memory.search('agent-1', item => item.type === 'observation');
      expect(results).toHaveLength(2);
    });

    it('should return empty array for no matches', () => {
      const results = memory.search('agent-1', item => item.type === 'nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should get recent items', () => {
      const recent = memory.getRecent('agent-1', 2);
      expect(recent).toHaveLength(2);
      expect(recent[0].data).toBe('test3');
      expect(recent[1].data).toBe('test2');
    });
  });

  describe('Performance', () => {
    it('should add items quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        memory.add('agent-1', { data: `item-${i}` });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should retrieve items quickly', () => {
      for (let i = 0; i < 10; i++) {
        memory.add('agent-1', { data: `item-${i}` });
      }

      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        memory.get('agent-1', 0);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty memory', () => {
      expect(memory.getAll('agent-1')).toHaveLength(0);
      expect(memory.getSize('agent-1')).toBe(0);
      expect(memory.isAtCapacity('agent-1')).toBe(false);
    });

    it('should handle null/undefined items gracefully', () => {
      memory.add('agent-1', { data: null });
      memory.add('agent-1', { data: undefined });

      const items = memory.getAll('agent-1');
      expect(items).toHaveLength(2);
    });

    it('should handle large objects', () => {
      const largeObject = {
        data: 'x'.repeat(10000),
        nested: { deep: { value: 'test' } }
      };

      memory.add('agent-1', largeObject);
      const retrieved = memory.get('agent-1', 0);

      expect(retrieved).toEqual(largeObject);
    });

    it('should handle rapid additions', () => {
      for (let i = 0; i < 50; i++) {
        memory.add('agent-1', { data: `item-${i}` });
      }

      const items = memory.getAll('agent-1');
      expect(items.length).toBeLessThanOrEqual(10); // Respects capacity
    });
  });

  describe('Statistics', () => {
    it('should get memory statistics', () => {
      memory.add('agent-1', { data: 'item1' });
      memory.add('agent-1', { data: 'item2' });
      memory.add('agent-2', { data: 'item3' });

      const stats = memory.getStatistics();

      expect(stats.totalAgents).toBe(2);
      expect(stats.totalItems).toBe(3);
      expect(stats.averageItemsPerAgent).toBe(1.5);
    });

    it('should track memory usage', () => {
      memory.add('agent-1', { data: 'test' });

      const usage = memory.getMemoryUsage('agent-1');
      expect(usage.used).toBeGreaterThan(0);
      expect(usage.capacity).toBe(10);
      expect(usage.percentage).toBeGreaterThan(0);
    });
  });

  describe('Events', () => {
    it('should emit item-added event', (done) => {
      memory.on('item-added', (event) => {
        expect(event.agentId).toBe('agent-1');
        expect(event.item.data).toBe('test');
        done();
      });

      memory.add('agent-1', { data: 'test' });
    });

    it('should emit item-evicted event when capacity exceeded', (done) => {
      const smallMemory = new WorkingMemory({ maxCapacity: 1 });

      smallMemory.on('item-evicted', (event) => {
        expect(event.agentId).toBe('agent-1');
        expect(event.item.data).toBe('first');
        done();
      });

      smallMemory.add('agent-1', { data: 'first' });
      smallMemory.add('agent-1', { data: 'second' });
    });

    it('should emit cleared event', (done) => {
      memory.add('agent-1', { data: 'test' });

      memory.on('cleared', (event) => {
        expect(event.agentId).toBe('agent-1');
        done();
      });

      memory.clear('agent-1');
    });
  });
});
