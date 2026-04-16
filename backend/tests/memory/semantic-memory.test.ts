/**
 * Semantic Memory Tests
 *
 * Comprehensive test suite for semantic memory (vector-based knowledge storage)
 * Tests embeddings, similarity search, and knowledge retrieval
 *
 * @module tests/memory/semantic-memory.test
 */

import { SemanticMemory } from '../../src/memory/semantic-memory';

describe('SemanticMemory', () => {
  let memory: SemanticMemory;

  beforeEach(() => {
    memory = new SemanticMemory({
      maxVectors: 1000,
      embeddingDim: 768,
      similarityThreshold: 0.5,
    });
  });

  afterEach(() => {
    memory.clear();
  });

  describe('Basic Operations', () => {
    it('should store knowledge with embedding', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const entry = memory.store('Test knowledge', embedding, { category: 'test' });

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.content).toBe('Test knowledge');
      expect(entry.embedding).toEqual(embedding);
      expect(entry.metadata?.category).toBe('test');
    });

    it('should validate embedding dimension', () => {
      const wrongEmbedding = new Array(512).fill(0);

      expect(() => {
        memory.store('Test', wrongEmbedding);
      }).toThrow('Embedding dimension mismatch');
    });

    it('should retrieve knowledge by ID', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const stored = memory.store('Test knowledge', embedding);
      const retrieved = memory.getById(stored.id);

      expect(retrieved).toEqual(stored);
    });

    it('should return undefined for non-existent ID', () => {
      const retrieved = memory.getById('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should get all knowledge entries', () => {
      const embedding1 = new Array(768).fill(0).map(() => Math.random());
      const embedding2 = new Array(768).fill(0).map(() => Math.random());

      memory.store('Knowledge 1', embedding1);
      memory.store('Knowledge 2', embedding2);

      const all = memory.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('Similarity Search', () => {
    it('should search by embedding similarity', () => {
      const embedding1 = new Array(768).fill(0);
      embedding1[0] = 1;
      embedding1[1] = 0.5;

      const embedding2 = new Array(768).fill(0);
      embedding2[0] = 1;
      embedding2[1] = 0.5;

      const embedding3 = new Array(768).fill(0);
      embedding3[0] = -1;
      embedding3[1] = -0.5;

      memory.store('Similar 1', embedding1);
      memory.store('Similar 2', embedding2);
      memory.store('Different', embedding3);

      const queryEmbedding = new Array(768).fill(0);
      queryEmbedding[0] = 1;
      queryEmbedding[1] = 0.5;

      const result = memory.search(queryEmbedding, 10);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].similarity).toBeGreaterThan(0.5);
    });

    it('should respect similarity threshold', () => {
      const embedding1 = new Array(768).fill(0);
      embedding1[0] = 1;

      const embedding2 = new Array(768).fill(0);
      embedding2[0] = -1;

      memory.store('Similar', embedding1);
      memory.store('Different', embedding2);

      const queryEmbedding = new Array(768).fill(0);
      queryEmbedding[0] = 1;

      const result = memory.search(queryEmbedding, 10);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every(r => r.similarity >= 0.5)).toBe(true);
    });

    it('should limit search results', () => {
      for (let i = 0; i < 20; i++) {
        const embedding = new Array(768).fill(0).map(() => Math.random());
        memory.store(`Knowledge ${i}`, embedding);
      }

      const queryEmbedding = new Array(768).fill(0).map(() => Math.random());
      const result = memory.search(queryEmbedding, 5);

      expect(result.results.length).toBeLessThanOrEqual(5);
    });

    it('should measure query time', () => {
      for (let i = 0; i < 100; i++) {
        const embedding = new Array(768).fill(0).map(() => Math.random());
        memory.store(`Knowledge ${i}`, embedding);
      }

      const queryEmbedding = new Array(768).fill(0).map(() => Math.random());
      const result = memory.search(queryEmbedding, 10);

      expect(result.queryTime).toBeGreaterThanOrEqual(0);
      expect(result.queryTime).toBeLessThan(5000);
    });

    it('should sort results by similarity', () => {
      const embedding1 = new Array(768).fill(0);
      embedding1[0] = 1;

      const embedding2 = new Array(768).fill(0);
      embedding2[0] = 0.8;

      const embedding3 = new Array(768).fill(0);
      embedding3[0] = 0.6;

      memory.store('High similarity', embedding1);
      memory.store('Medium similarity', embedding2);
      memory.store('Low similarity', embedding3);

      const queryEmbedding = new Array(768).fill(0);
      queryEmbedding[0] = 1;

      const result = memory.search(queryEmbedding, 10);

      for (let i = 0; i < result.results.length - 1; i++) {
        expect(result.results[i].similarity).toBeGreaterThanOrEqual(
          result.results[i + 1].similarity
        );
      }
    });
  });

  describe('Metadata Management', () => {
    it('should update metadata', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const entry = memory.store('Test', embedding, { version: 1 });

      const updated = memory.updateMetadata(entry.id, { version: 2, updated: true });

      expect(updated?.metadata?.version).toBe(2);
      expect(updated?.metadata?.updated).toBe(true);
    });

    it('should return undefined when updating non-existent entry', () => {
      const updated = memory.updateMetadata('non-existent', { key: 'value' });

      expect(updated).toBeUndefined();
    });

    it('should get all entries', () => {
      const embedding1 = new Array(768).fill(0).map(() => Math.random());
      const embedding2 = new Array(768).fill(0).map(() => Math.random());

      memory.store('Knowledge 1', embedding1, { category: 'A' });
      memory.store('Knowledge 2', embedding2, { category: 'B' });

      const all = memory.getAll();

      expect(all).toHaveLength(2);
      expect(all[0].metadata?.category).toBe('A');
    });
  });

  describe('Access Tracking', () => {
    it('should track access count', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const entry = memory.store('Test', embedding);

      expect(entry.accessCount).toBe(0);

      memory.getById(entry.id);
      const retrieved = memory.getById(entry.id);

      expect(retrieved?.accessCount).toBe(2);
    });

    it('should track last accessed time', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const entry = memory.store('Test', embedding);

      const beforeAccess = new Date();
      memory.getById(entry.id);
      const afterAccess = new Date();

      const retrieved = memory.getById(entry.id);

      expect(retrieved?.lastAccessed.getTime()).toBeGreaterThanOrEqual(beforeAccess.getTime());
      expect(retrieved?.lastAccessed.getTime()).toBeLessThanOrEqual(afterAccess.getTime());
    });

    it('should get most accessed entries', () => {
      const embeddings = Array.from({ length: 5 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      const entries = embeddings.map((emb, i) => memory.store(`Knowledge ${i}`, emb));

      // Access entries different numbers of times
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j <= i; j++) {
          memory.getById(entries[i].id);
        }
      }

      const stats = memory.getStatistics();

      expect(stats.mostAccessed).toBeDefined();
      expect(stats.mostAccessed?.accessCount).toBeGreaterThan(0);
    });

    it('should track access times', () => {
      const embeddings = Array.from({ length: 5 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      const entries = embeddings.map((emb, i) => memory.store(`Knowledge ${i}`, emb));

      // Access in order
      for (const entry of entries) {
        memory.getById(entry.id);
      }

      const all = memory.getAll();

      expect(all).toHaveLength(5);
      expect(all[0].lastAccessed).toBeDefined();
    });
  });

  describe('Deletion Operations', () => {
    it('should delete knowledge entry', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const entry = memory.store('Test', embedding);

      const deleted = memory.delete(entry.id);

      expect(deleted).toBe(true);
      expect(memory.getById(entry.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent entry', () => {
      const deleted = memory.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should clear all knowledge', () => {
      const embeddings = Array.from({ length: 10 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      embeddings.forEach((emb, i) => memory.store(`Knowledge ${i}`, emb));

      expect(memory.getCount()).toBe(10);

      memory.clear();

      expect(memory.getCount()).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics', () => {
      const embeddings = Array.from({ length: 5 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      embeddings.forEach((emb, i) => {
        const entry = memory.store(`Knowledge ${i}`, emb);
        // Access different numbers of times
        for (let j = 0; j < i; j++) {
          memory.getById(entry.id);
        }
      });

      const stats = memory.getStatistics();

      expect(stats.totalEntries).toBe(5);
      expect(stats.averageAccessCount).toBeGreaterThanOrEqual(0);
      expect(stats.mostAccessed).toBeDefined();
      expect(stats.oldestEntry).toBeDefined();
    });

    it('should track oldest and newest entries', () => {
      const embedding1 = new Array(768).fill(0).map(() => Math.random());
      memory.store('First', embedding1);

      const embedding2 = new Array(768).fill(0).map(() => Math.random());
      memory.store('Second', embedding2);

      const stats = memory.getStatistics();

      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
      expect(stats.totalEntries).toBe(2);
    });
  });

  describe('Batch Operations', () => {
    it('should batch search with multiple queries', () => {
      const embeddings = Array.from({ length: 5 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      embeddings.forEach((emb, i) => memory.store(`Knowledge ${i}`, emb));

      const queries = Array.from({ length: 3 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      const results = memory.batchSearch(queries);

      expect(results).toHaveLength(3);
      expect(results[0].results).toBeDefined();
    });

    it('should get similar entries', () => {
      const embedding1 = new Array(768).fill(0).map(() => Math.random());
      const embedding2 = new Array(768).fill(0).map(() => Math.random());

      const entry1 = memory.store('Knowledge 1', embedding1);
      memory.store('Knowledge 2', embedding2);

      const similar = memory.getSimilarTo(entry1.id, 1);

      expect(similar).toBeDefined();
      expect(Array.isArray(similar)).toBe(true);
    });
  });

  describe('Capacity Management', () => {
    it('should enforce maximum vector capacity', () => {
      const smallMemory = new SemanticMemory({
        maxVectors: 10,
        embeddingDim: 768,
      });

      for (let i = 0; i < 20; i++) {
        const embedding = new Array(768).fill(0).map(() => Math.random());
        smallMemory.store(`Knowledge ${i}`, embedding);
      }

      expect(smallMemory.getCount()).toBeLessThanOrEqual(10);
      smallMemory.clear();
    });

    it('should prune least accessed entries when at capacity', () => {
      const smallMemory = new SemanticMemory({
        maxVectors: 5,
        embeddingDim: 768,
      });

      const entries = Array.from({ length: 5 }, (_, i) => {
        const embedding = new Array(768).fill(0).map(() => Math.random());
        return smallMemory.store(`Knowledge ${i}`, embedding);
      });

      // Access some entries to increase their access count
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
          smallMemory.getById(entries[i].id);
        }
      }

      // Add more entries to trigger pruning
      for (let i = 0; i < 10; i++) {
        const embedding = new Array(768).fill(0).map(() => Math.random());
        smallMemory.store(`New Knowledge ${i}`, embedding);
      }

      expect(smallMemory.getCount()).toBeLessThanOrEqual(5);
      smallMemory.clear();
    });
  });

  describe('Entry Management', () => {
    it('should get all entries', () => {
      const embeddings = Array.from({ length: 3 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      embeddings.forEach((emb, i) => memory.store(`Knowledge ${i}`, emb));

      const all = memory.getAll();

      expect(all).toHaveLength(3);
      expect(all[0].content).toBe('Knowledge 0');
    });

    it('should get entry count', () => {
      const embeddings = Array.from({ length: 3 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      embeddings.forEach((emb, i) => memory.store(`Knowledge ${i}`, emb));

      const count = memory.getCount();

      expect(count).toBe(3);
    });
  });

  describe('Events', () => {
    it('should emit entry-stored event', (done) => {
      memory.on('entry-stored', event => {
        expect(event.entry).toBeDefined();
        expect(event.timestamp).toBeDefined();
        done();
      });

      const embedding = new Array(768).fill(0).map(() => Math.random());
      memory.store('Test', embedding);
    });

    it('should emit entry-updated event', (done) => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const entry = memory.store('Test', embedding);

      memory.on('entry-updated', event => {
        expect(event.entry.id).toBe(entry.id);
        done();
      });

      memory.updateMetadata(entry.id, { updated: true });
    });

    it('should emit entry-deleted event', (done) => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const entry = memory.store('Test', embedding);

      memory.on('entry-deleted', event => {
        expect(event.id).toBe(entry.id);
        done();
      });

      memory.delete(entry.id);
    });

    it('should emit cleared event', (done) => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      memory.store('Test', embedding);

      memory.on('cleared', event => {
        expect(event.count).toBe(1);
        done();
      });

      memory.clear();
    });
  });

  describe('Performance', () => {
    it('should store embeddings quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        const embedding = new Array(768).fill(0).map(() => Math.random());
        memory.store(`Knowledge ${i}`, embedding);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should search efficiently', () => {
      for (let i = 0; i < 100; i++) {
        const embedding = new Array(768).fill(0).map(() => Math.random());
        memory.store(`Knowledge ${i}`, embedding);
      }

      const start = Date.now();

      for (let i = 0; i < 50; i++) {
        const queryEmbedding = new Array(768).fill(0).map(() => Math.random());
        memory.search(queryEmbedding, 10);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty memory', () => {
      expect(memory.getCount()).toBe(0);
      expect(memory.getAll()).toHaveLength(0);
    });

    it('should handle zero vectors', () => {
      const zeroEmbedding = new Array(768).fill(0);
      const entry = memory.store('Zero vector', zeroEmbedding);

      expect(entry).toBeDefined();
      expect(memory.getById(entry.id)).toBeDefined();
    });

    it('should handle normalized vectors', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      let norm = 0;
      for (const val of embedding) {
        norm += val * val;
      }
      norm = Math.sqrt(norm);
      const normalized = embedding.map(val => val / norm);

      const entry = memory.store('Normalized', normalized);
      expect(entry).toBeDefined();
    });

    it('should handle very similar embeddings', () => {
      const embedding = new Array(768).fill(0).map(() => Math.random());
      const similar = [...embedding];
      similar[0] += 0.001;

      memory.store('Original', embedding);
      memory.store('Similar', similar);

      const result = memory.search(embedding, 10);
      expect(result.results.length).toBeGreaterThan(0);
    });
  });
});
