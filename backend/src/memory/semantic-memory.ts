/**
 * Semantic Memory Implementation
 *
 * Vector-based storage for knowledge with similarity search.
 * Supports embeddings and semantic retrieval.
 *
 * @module memory/semantic-memory
 */

import { EventEmitter } from 'events';

export interface SemanticMemoryConfig {
  maxVectors?: number;
  embeddingDim?: number;
  similarityThreshold?: number;
}

export interface SemanticEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface SimilarityResult {
  entry: SemanticEntry;
  similarity: number;
}

export interface SearchResult {
  results: SimilarityResult[];
  queryTime: number;
}

export class SemanticMemory extends EventEmitter {
  private entries: Map<string, SemanticEntry>;
  private contentIndex: Map<string, string>;
  private maxVectors: number;
  private embeddingDim: number;
  private similarityThreshold: number;

  constructor(config: SemanticMemoryConfig = {}) {
    super();
    this.entries = new Map();
    this.contentIndex = new Map();
    this.maxVectors = config.maxVectors || 5000;
    this.embeddingDim = config.embeddingDim || 768;
    this.similarityThreshold = config.similarityThreshold || 0.5;
  }

  /**
   * Store semantic knowledge with embedding
   */
  store(content: string, embedding: number[], metadata?: Record<string, any>): SemanticEntry {
    // Validate embedding dimension
    if (embedding.length !== this.embeddingDim) {
      throw new Error(
        `Embedding dimension mismatch. Expected ${this.embeddingDim}, got ${embedding.length}`
      );
    }

    // Check capacity and cleanup if needed
    if (this.entries.size >= this.maxVectors) {
      this.pruneByAccess();
    }

    const id = this.generateId();
    const now = new Date();

    const entry: SemanticEntry = {
      id,
      content,
      embedding,
      metadata,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.entries.set(id, entry);
    this.contentIndex.set(content, id);

    this.emit('entry-stored', { entry, timestamp: now });

    return entry;
  }

  /**
   * Search by similarity to query embedding
   */
  search(queryEmbedding: number[], limit: number = 10): SearchResult {
    const startTime = Date.now();

    // Validate query embedding
    if (queryEmbedding.length !== this.embeddingDim) {
      throw new Error(
        `Query embedding dimension mismatch. Expected ${this.embeddingDim}, got ${queryEmbedding.length}`
      );
    }

    const results: SimilarityResult[] = [];

    for (const entry of this.entries.values()) {
      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);

      if (similarity >= this.similarityThreshold) {
        results.push({ entry, similarity });
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    // Limit results
    const limited = results.slice(0, limit);

    // Update access counts
    for (const result of limited) {
      result.entry.accessCount++;
      result.entry.lastAccessed = new Date();
    }

    const queryTime = Date.now() - startTime;

    this.emit('search-completed', {
      queryTime,
      resultsCount: limited.length,
      timestamp: new Date(),
    });

    return { results: limited, queryTime };
  }

  /**
   * Search by content similarity
   */
  searchByContent(queryContent: string, limit: number = 10): SearchResult {
    // Generate embedding for query content
    const queryEmbedding = this.generateEmbedding(queryContent);
    return this.search(queryEmbedding, limit);
  }

  /**
   * Get entry by ID
   */
  getById(id: string): SemanticEntry | undefined {
    const entry = this.entries.get(id);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = new Date();
    }
    return entry;
  }

  /**
   * Get entry by content
   */
  getByContent(content: string): SemanticEntry | undefined {
    const id = this.contentIndex.get(content);
    if (id) {
      return this.getById(id);
    }
    return undefined;
  }

  /**
   * Update entry metadata
   */
  updateMetadata(id: string, metadata: Record<string, any>): SemanticEntry | undefined {
    const entry = this.entries.get(id);
    if (!entry) {
      return undefined;
    }

    if (!entry.metadata) {
      entry.metadata = {};
    }

    entry.metadata = { ...entry.metadata, ...metadata };
    this.emit('entry-updated', { entry, timestamp: new Date() });

    return entry;
  }

  /**
   * Delete entry
   */
  delete(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    this.entries.delete(id);
    this.contentIndex.delete(entry.content);

    this.emit('entry-deleted', { id, timestamp: new Date() });

    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    const count = this.entries.size;
    this.entries.clear();
    this.contentIndex.clear();

    this.emit('cleared', { count, timestamp: new Date() });
  }

  /**
   * Get entry count
   */
  getCount(): number {
    return this.entries.size;
  }

  /**
   * Get all entries
   */
  getAll(): SemanticEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalEntries: number;
    averageAccessCount: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    mostAccessed?: SemanticEntry;
  } {
    const entries = Array.from(this.entries.values());

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        averageAccessCount: 0,
      };
    }

    let totalAccess = 0;
    let oldestTime = Infinity;
    let newestTime = -Infinity;
    let mostAccessed = entries[0];

    for (const entry of entries) {
      totalAccess += entry.accessCount;
      oldestTime = Math.min(oldestTime, entry.timestamp.getTime());
      newestTime = Math.max(newestTime, entry.timestamp.getTime());

      if (entry.accessCount > mostAccessed.accessCount) {
        mostAccessed = entry;
      }
    }

    return {
      totalEntries: entries.length,
      averageAccessCount: totalAccess / entries.length,
      oldestEntry: oldestTime === Infinity ? undefined : new Date(oldestTime),
      newestEntry: newestTime === -Infinity ? undefined : new Date(newestTime),
      mostAccessed,
    };
  }

  /**
   * Batch search for multiple queries
   */
  batchSearch(queryEmbeddings: number[][], limit: number = 10): SearchResult[] {
    return queryEmbeddings.map(embedding => this.search(embedding, limit));
  }

  /**
   * Get similar entries to a stored entry
   */
  getSimilarTo(id: string, limit: number = 10): SimilarityResult[] {
    const entry = this.entries.get(id);
    if (!entry) {
      return [];
    }

    const results = this.search(entry.embedding, limit + 1);
    // Filter out the entry itself
    return results.results.filter(r => r.entry.id !== id).slice(0, limit);
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Generate embedding for content (mock implementation)
   */
  private generateEmbedding(content: string): number[] {
    // Mock embedding generation - in production, use actual embedding model
    const embedding: number[] = [];
    const hash = this.hashString(content);

    for (let i = 0; i < this.embeddingDim; i++) {
      const seed = (hash + i) * 73856093;
      const x = Math.sin(seed) * 10000;
      embedding.push(x - Math.floor(x));
    }

    // Normalize
    let norm = 0;
    for (const val of embedding) {
      norm += val * val;
    }
    norm = Math.sqrt(norm);

    return embedding.map(val => val / norm);
  }

  /**
   * Simple hash function for string
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Prune entries by access count
   */
  private pruneByAccess(): void {
    const sorted = Array.from(this.entries.values())
      .sort((a, b) => a.accessCount - b.accessCount);

    const toDelete = sorted.slice(0, Math.ceil(this.maxVectors * 0.1));

    for (const entry of toDelete) {
      this.delete(entry.id);
    }

    this.emit('pruned', {
      deleted: toDelete.length,
      timestamp: new Date(),
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `sem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
