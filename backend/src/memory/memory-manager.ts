/**
 * Memory Manager Implementation
 *
 * Unified interface for all memory systems.
 * Handles consolidation, cleanup, and statistics.
 *
 * @module memory/memory-manager
 */

import { EventEmitter } from 'events';
import { WorkingMemory, MemoryItem } from './working-memory';
import { EpisodicMemory, Episode } from './episodic-memory';
import { SemanticMemory, SemanticEntry } from './semantic-memory';

export interface MemoryManagerConfig {
  workingMemoryCapacity?: number;
  episodicMemorySize?: number;
  semanticMemorySize?: number;
  consolidationInterval?: number;
  cleanupInterval?: number;
  enablePersistence?: boolean;
}

export interface ConsolidationConfig {
  minImportance?: number;
  maxAge?: number;
  batchSize?: number;
}

export interface MemoryStats {
  working: {
    totalItems: number;
    totalAgents: number;
    averageItemsPerAgent: number;
  };
  episodic: {
    totalEpisodes: number;
    totalAgents: number;
    totalTasks: number;
    averageEpisodesPerAgent: number;
  };
  semantic: {
    totalEntries: number;
    averageAccessCount: number;
  };
  timestamp: Date;
}

export class MemoryManager extends EventEmitter {
  private workingMemory: WorkingMemory;
  private episodicMemory: EpisodicMemory;
  private semanticMemory: SemanticMemory;
  private consolidationInterval: number;
  private cleanupInterval: number;
  private consolidationTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private enablePersistence: boolean;

  constructor(config: MemoryManagerConfig = {}) {
    super();
    this.workingMemory = new WorkingMemory({
      maxCapacity: config.workingMemoryCapacity || 100,
    });
    this.episodicMemory = new EpisodicMemory({
      maxEpisodes: config.episodicMemorySize || 10000,
      persistenceEnabled: config.enablePersistence || false,
    });
    this.semanticMemory = new SemanticMemory({
      maxVectors: config.semanticMemorySize || 5000,
    });
    this.consolidationInterval = config.consolidationInterval || 300000; // 5 minutes
    this.cleanupInterval = config.cleanupInterval || 3600000; // 1 hour
    this.enablePersistence = config.enablePersistence || false;

    this.startConsolidationTimer();
    this.startCleanupTimer();
  }

  /**
   * Add item to working memory
   */
  addToWorking(agentId: string, item: MemoryItem): void {
    this.workingMemory.add(agentId, item);
    this.emit('item-added-working', { agentId, item, timestamp: new Date() });
  }

  /**
   * Store experience in episodic memory
   */
  storeExperience(
    agentId: string,
    taskId: string,
    content: any,
    metadata?: Record<string, any>
  ): Episode {
    const episode = this.episodicMemory.storeEpisode({
      agentId,
      taskId,
      timestamp: new Date(),
      duration: 0,
      observations: [],
      actions: [],
      results: content,
      metadata,
    });
    this.emit('experience-stored', { episode, timestamp: new Date() });
    return episode;
  }

  /**
   * Store knowledge in semantic memory
   */
  storeKnowledge(
    content: string,
    embedding: number[],
    metadata?: Record<string, any>
  ): SemanticEntry {
    const entry = this.semanticMemory.store(content, embedding, metadata);
    this.emit('knowledge-stored', { entry, timestamp: new Date() });
    return entry;
  }

  /**
   * Get working memory for agent
   */
  getWorkingMemory(agentId: string): MemoryItem[] {
    return this.workingMemory.getAll(agentId);
  }

  /**
   * Get episodic memory for agent
   */
  getEpisodicMemory(agentId: string): Episode[] {
    return this.episodicMemory.getByAgent(agentId);
  }

  /**
   * Search semantic memory
   */
  searchSemantic(queryEmbedding: number[], limit: number = 10) {
    return this.semanticMemory.search(queryEmbedding, limit);
  }

  /**
   * Consolidate working memory to episodic
   */
  consolidateMemory(config: ConsolidationConfig = {}): number {
    const minImportance = config.minImportance || 0.5;
    const batchSize = config.batchSize || 10;

    let consolidated = 0;
    const workingStats = this.workingMemory.getStatistics();

    // For each agent, consolidate their working memory
    for (let agentIdx = 0; agentIdx < workingStats.totalAgents; agentIdx++) {
      // Get all agents (simplified - in production would track agent IDs)
      const items = this.workingMemory.getAll(`agent-${agentIdx}`);

      for (let i = 0; i < Math.min(items.length, batchSize); i++) {
        const item = items[i];

        // Calculate importance
        const importance = this.calculateImportance(item);

        if (importance >= minImportance) {
          this.episodicMemory.storeEpisode({
            agentId: `agent-${agentIdx}`,
            taskId: item.data?.taskId || 'unknown',
            timestamp: new Date(),
            duration: 0,
            observations: [],
            actions: [],
            results: item.data,
            metadata: item.data?.tags ? { tags: item.data.tags } : undefined,
          });
          consolidated++;
        }
      }
    }

    this.emit('consolidation-completed', {
      consolidated,
      timestamp: new Date(),
    });

    return consolidated;
  }

  /**
   * Cleanup old and low-importance memories
   */
  cleanup(): { working: number; episodic: number; semantic: number } {
    const stats = {
      working: 0,
      episodic: 0,
      semantic: 0,
    };

    // Cleanup working memory (clear old items)
    const workingStats = this.workingMemory.getStatistics();
    if (workingStats.totalItems > 0) {
      // Clear agents with no recent activity (simplified)
      stats.working = workingStats.totalItems;
    }

    // Cleanup episodic memory (handled internally)
    // Episodic cleanup happens automatically on store

    // Cleanup semantic memory (handled internally)
    // Semantic cleanup happens automatically on store

    this.emit('cleanup-completed', {
      stats,
      timestamp: new Date(),
    });

    return stats;
  }

  /**
   * Get comprehensive memory statistics
   */
  getStatistics(): MemoryStats {
    const workingStats = this.workingMemory.getStatistics();
    const episodicStats = this.episodicMemory.getStatistics();
    const semanticStats = this.semanticMemory.getStatistics();

    return {
      working: {
        totalItems: workingStats.totalItems,
        totalAgents: workingStats.totalAgents,
        averageItemsPerAgent: workingStats.averageItemsPerAgent,
      },
      episodic: {
        totalEpisodes: episodicStats.totalEpisodes,
        totalAgents: episodicStats.totalAgents,
        totalTasks: episodicStats.totalTasks,
        averageEpisodesPerAgent: episodicStats.averageEpisodesPerAgent,
      },
      semantic: {
        totalEntries: semanticStats.totalEntries,
        averageAccessCount: semanticStats.averageAccessCount,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Clear all memories
   */
  clearAll(): void {
    this.workingMemory.clear();
    this.episodicMemory.clear();
    this.semanticMemory.clear();
    this.emit('all-cleared', { timestamp: new Date() });
  }

  /**
   * Clear agent-specific memories
   */
  clearAgent(agentId: string): void {
    this.workingMemory.clear(agentId);
    // Episodic and semantic are not agent-specific in this implementation
    this.emit('agent-cleared', { agentId, timestamp: new Date() });
  }

  /**
   * Export all memories for persistence
   */
  export() {
    return {
      working: this.workingMemory.getAll('all-agents'),
      episodic: this.episodicMemory.export(),
      semantic: this.semanticMemory.getStatistics(),
      timestamp: new Date(),
    };
  }

  /**
   * Import memories from persistence
   */
  import(data: any): void {
    if (data.episodic) {
      this.episodicMemory.import(data.episodic);
    }
    this.emit('import-completed', { timestamp: new Date() });
  }

  /**
   * Get memory health status
   */
  getHealth(): {
    working: { healthy: boolean; utilization: number };
    episodic: { healthy: boolean; count: number };
    semantic: { healthy: boolean; count: number };
  } {
    const workingStats = this.workingMemory.getStatistics();
    const episodicStats = this.episodicMemory.getStatistics();
    const semanticStats = this.semanticMemory.getStatistics();

    return {
      working: {
        healthy: workingStats.totalItems < 1000,
        utilization: (workingStats.totalItems / 100) * 100,
      },
      episodic: {
        healthy: episodicStats.totalEpisodes < 10000,
        count: episodicStats.totalEpisodes,
      },
      semantic: {
        healthy: semanticStats.totalEntries < 5000,
        count: semanticStats.totalEntries,
      },
    };
  }

  /**
   * Start consolidation timer
   */
  private startConsolidationTimer(): void {
    this.consolidationTimer = setInterval(() => {
      this.consolidateMemory();
    }, this.consolidationInterval);
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop all timers
   */
  stop(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Calculate importance score for an item
   */
  private calculateImportance(item: MemoryItem): number {
    let importance = 1;

    // Boost importance for certain data types
    if (item.data?.type === 'success') {
      importance += 0.5;
    }
    if (item.data?.type === 'error') {
      importance += 0.3;
    }
    if (item.data?.critical) {
      importance += 1;
    }

    return Math.min(importance, 2); // Cap at 2
  }
}
