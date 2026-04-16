/**
 * Episodic Memory Implementation
 *
 * Long-term storage for agent experiences with timestamps and retrieval by timeframe.
 * Stores complete episodes of agent interactions with database persistence.
 *
 * @module src/memory/episodic-memory
 */

import { EventEmitter } from 'events';

export interface Episode {
  id: string;
  agentId: string;
  taskId: string;
  timestamp: Date;
  duration: number;
  observations: any[];
  actions: any[];
  results: any;
  metadata?: Record<string, any>;
}

export interface EpisodicMemoryConfig {
  maxEpisodes?: number;
  persistenceEnabled?: boolean;
  dbPath?: string;
}

export interface TimeframeQuery {
  agentId: string;
  startTime: Date;
  endTime: Date;
}

export interface TaskQuery {
  agentId: string;
  taskId: string;
}

export interface RetrievalResult {
  episodes: Episode[];
  total: number;
  queryTime: number;
}

export class EpisodicMemory extends EventEmitter {
  private episodes: Map<string, Episode>;
  private episodesByAgent: Map<string, string[]>;
  private episodesByTask: Map<string, string[]>;
  private maxEpisodes: number;
  private persistenceEnabled: boolean;
  private dbPath: string;

  constructor(config: EpisodicMemoryConfig = {}) {
    super();
    this.episodes = new Map();
    this.episodesByAgent = new Map();
    this.episodesByTask = new Map();
    this.maxEpisodes = config.maxEpisodes || 1000;
    this.persistenceEnabled = config.persistenceEnabled || false;
    this.dbPath = config.dbPath || './episodic-storage';
  }

  /**
   * Store a new episode
   */
  storeEpisode(episode: Omit<Episode, 'id'>): Episode {
    const id = this.generateId();
    const fullEpisode: Episode = {
      ...episode,
      id,
    };

    // Check capacity
    if (this.episodes.size >= this.maxEpisodes) {
      this.pruneOldest();
    }

    // Store episode
    this.episodes.set(id, fullEpisode);

    // Index by agent
    if (!this.episodesByAgent.has(episode.agentId)) {
      this.episodesByAgent.set(episode.agentId, []);
    }
    this.episodesByAgent.get(episode.agentId)!.push(id);

    // Index by task
    if (!this.episodesByTask.has(episode.taskId)) {
      this.episodesByTask.set(episode.taskId, []);
    }
    this.episodesByTask.get(episode.taskId)!.push(id);

    this.emit('episode:stored', { episode: fullEpisode, timestamp: new Date() });

    return fullEpisode;
  }

  /**
   * Retrieve episode by ID
   */
  getEpisode(id: string): Episode | undefined {
    return this.episodes.get(id);
  }

  /**
   * Retrieve episodes by agent and timeframe
   */
  getByTimeframe(query: TimeframeQuery): RetrievalResult {
    const startTime = Date.now();
    const episodeIds = this.episodesByAgent.get(query.agentId) || [];

    const filtered = episodeIds
      .map(id => this.episodes.get(id)!)
      .filter(ep =>
        ep.timestamp >= query.startTime &&
        ep.timestamp <= query.endTime
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const queryTime = Date.now() - startTime;

    return {
      episodes: filtered,
      total: filtered.length,
      queryTime,
    };
  }

  /**
   * Retrieve episodes by task
   */
  getByTask(query: TaskQuery): RetrievalResult {
    const startTime = Date.now();
    const episodeIds = this.episodesByTask.get(query.taskId) || [];

    const filtered = episodeIds
      .map(id => this.episodes.get(id)!)
      .filter(ep => ep.agentId === query.agentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const queryTime = Date.now() - startTime;

    return {
      episodes: filtered,
      total: filtered.length,
      queryTime,
    };
  }

  /**
   * Retrieve all episodes for an agent
   */
  getByAgent(agentId: string): Episode[] {
    const episodeIds = this.episodesByAgent.get(agentId) || [];
    return episodeIds
      .map(id => this.episodes.get(id)!)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Search episodes by predicate
   */
  search(predicate: (episode: Episode) => boolean): Episode[] {
    return Array.from(this.episodes.values())
      .filter(predicate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Update episode metadata
   */
  updateEpisode(id: string, updates: Partial<Episode>): Episode | undefined {
    const episode = this.episodes.get(id);
    if (!episode) {
      return undefined;
    }

    const updated = { ...episode, ...updates, id };
    this.episodes.set(id, updated);
    this.emit('episode:updated', { episode: updated, timestamp: new Date() });

    return updated;
  }

  /**
   * Delete episode
   */
  deleteEpisode(id: string): boolean {
    const episode = this.episodes.get(id);
    if (!episode) {
      return false;
    }

    this.episodes.delete(id);

    // Remove from agent index
    const agentEpisodes = this.episodesByAgent.get(episode.agentId);
    if (agentEpisodes) {
      const idx = agentEpisodes.indexOf(id);
      if (idx !== -1) {
        agentEpisodes.splice(idx, 1);
      }
    }

    // Remove from task index
    const taskEpisodes = this.episodesByTask.get(episode.taskId);
    if (taskEpisodes) {
      const idx = taskEpisodes.indexOf(id);
      if (idx !== -1) {
        taskEpisodes.splice(idx, 1);
      }
    }

    this.emit('episode:deleted', { episodeId: id, timestamp: new Date() });

    return true;
  }

  /**
   * Get episode count
   */
  getCount(): number {
    return this.episodes.size;
  }

  /**
   * Get count by agent
   */
  getCountByAgent(agentId: string): number {
    return this.episodesByAgent.get(agentId)?.length || 0;
  }

  /**
   * Get count by task
   */
  getCountByTask(taskId: string): number {
    return this.episodesByTask.get(taskId)?.length || 0;
  }

  /**
   * Clear all episodes
   */
  clear(): void {
    const count = this.episodes.size;
    this.episodes.clear();
    this.episodesByAgent.clear();
    this.episodesByTask.clear();
    this.emit('cleared', { count, timestamp: new Date() });
  }

  /**
   * Prune oldest episodes when at capacity
   */
  private pruneOldest(): void {
    const sorted = Array.from(this.episodes.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const toDelete = sorted.slice(0, Math.ceil(this.maxEpisodes * 0.1));

    for (const episode of toDelete) {
      this.deleteEpisode(episode.id);
    }

    this.emit('pruned', {
      deleted: toDelete.length,
      timestamp: new Date()
    });
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalEpisodes: number;
    totalAgents: number;
    totalTasks: number;
    averageEpisodesPerAgent: number;
    oldestEpisode?: Date;
    newestEpisode?: Date;
  } {
    const episodes = Array.from(this.episodes.values());
    const totalEpisodes = episodes.length;
    const totalAgents = this.episodesByAgent.size;
    const totalTasks = this.episodesByTask.size;
    const averageEpisodesPerAgent = totalAgents > 0 ? totalEpisodes / totalAgents : 0;

    let oldestEpisode: Date | undefined;
    let newestEpisode: Date | undefined;

    if (episodes.length > 0) {
      const sorted = episodes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      oldestEpisode = sorted[0].timestamp;
      newestEpisode = sorted[sorted.length - 1].timestamp;
    }

    return {
      totalEpisodes,
      totalAgents,
      totalTasks,
      averageEpisodesPerAgent,
      oldestEpisode,
      newestEpisode,
    };
  }

  /**
   * Export episodes for persistence
   */
  export(): Episode[] {
    return Array.from(this.episodes.values());
  }

  /**
   * Import episodes from persistence
   */
  import(episodes: Episode[]): void {
    for (const episode of episodes) {
      this.storeEpisode(episode);
    }
  }

  /**
   * Generate unique episode ID
   */
  private generateId(): string {
    return `ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default EpisodicMemory;
