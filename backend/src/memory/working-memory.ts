/**
 * Working Memory Implementation
 *
 * Short-term storage for agent experiences with FIFO eviction policy.
 * Maintains separate memory spaces for each agent with configurable capacity.
 *
 * @module src/memory/working-memory
 */

import { EventEmitter } from 'events';

export interface WorkingMemoryConfig {
  maxCapacity?: number;
}

export interface MemoryItem {
  data: any;
  timestamp?: Date;
  [key: string]: any;
}

export interface MemoryStats {
  totalAgents: number;
  totalItems: number;
  averageItemsPerAgent: number;
}

export interface MemoryUsage {
  used: number;
  capacity: number;
  percentage: number;
}

export interface ItemAddedEvent {
  agentId: string;
  item: MemoryItem;
  timestamp: Date;
}

export interface ItemEvictedEvent {
  agentId: string;
  item: MemoryItem;
  timestamp: Date;
}

export interface ClearedEvent {
  agentId: string;
  itemsCleared: number;
  timestamp: Date;
}

export class WorkingMemory extends EventEmitter {
  private memory: Map<string, MemoryItem[]>;
  private maxCapacity: number;

  constructor(config: WorkingMemoryConfig = {}) {
    super();
    this.memory = new Map();
    this.maxCapacity = config.maxCapacity || 100;
  }

  /**
   * Add item to working memory for an agent
   */
  add(agentId: string, item: MemoryItem): void {
    if (!this.memory.has(agentId)) {
      this.memory.set(agentId, []);
    }

    const agentMemory = this.memory.get(agentId)!;

    // Add timestamp if not present
    if (!item.timestamp) {
      item.timestamp = new Date();
    }

    agentMemory.push(item);

    // Enforce capacity limit with FIFO eviction
    if (agentMemory.length > this.maxCapacity) {
      const evictedItem = agentMemory.shift()!;
      this.emit('item-evicted', {
        agentId,
        item: evictedItem,
        timestamp: new Date(),
      } as ItemEvictedEvent);
    }

    this.emit('item-added', {
      agentId,
      item,
      timestamp: new Date(),
    } as ItemAddedEvent);
  }

  /**
   * Get item at specific index
   */
  get(agentId: string, index: number): MemoryItem | undefined {
    const agentMemory = this.memory.get(agentId);
    if (!agentMemory) {
      return undefined;
    }
    return agentMemory[index];
  }

  /**
   * Get all items for an agent
   */
  getAll(agentId: string): MemoryItem[] {
    return this.memory.get(agentId) || [];
  }

  /**
   * Get recent items for an agent
   */
  getRecent(agentId: string, count: number): MemoryItem[] {
    const agentMemory = this.memory.get(agentId) || [];
    return agentMemory.slice(-count).reverse();
  }

  /**
   * Search items by predicate
   */
  search(agentId: string, predicate: (item: MemoryItem) => boolean): MemoryItem[] {
    const agentMemory = this.memory.get(agentId) || [];
    return agentMemory.filter(predicate);
  }

  /**
   * Get current size of agent's memory
   */
  getSize(agentId: string): number {
    return this.memory.get(agentId)?.length || 0;
  }

  /**
   * Check if agent's memory is at capacity
   */
  isAtCapacity(agentId: string): boolean {
    return this.getSize(agentId) >= this.maxCapacity;
  }

  /**
   * Clear memory for an agent
   */
  clear(agentId?: string): void {
    if (agentId) {
      const itemsCleared = this.getSize(agentId);
      this.memory.delete(agentId);
      this.emit('cleared', {
        agentId,
        itemsCleared,
        timestamp: new Date(),
      } as ClearedEvent);
    } else {
      this.memory.clear();
    }
  }

  /**
   * Get memory statistics
   */
  getStatistics(): MemoryStats {
    const totalAgents = this.memory.size;
    let totalItems = 0;

    for (const items of this.memory.values()) {
      totalItems += items.length;
    }

    const averageItemsPerAgent = totalAgents > 0 ? totalItems / totalAgents : 0;

    return {
      totalAgents,
      totalItems,
      averageItemsPerAgent,
    };
  }

  /**
   * Get memory usage for an agent
   */
  getMemoryUsage(agentId: string): MemoryUsage {
    const used = this.getSize(agentId);
    const capacity = this.maxCapacity;
    const percentage = (used / capacity) * 100;

    return {
      used,
      capacity,
      percentage,
    };
  }
}
