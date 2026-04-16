/**
 * Agent State Persistence and Recovery System
 *
 * Handles persistence of agent state to storage and recovery from failures.
 * Supports checkpoint creation, state snapshots, and recovery mechanisms.
 *
 * Architecture: Phase 1 - Foundation & Infrastructure
 * Task: Task 4 - Agent State Management
 *
 * @module state/persistence
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Checkpoint interface
 */
export interface Checkpoint {
  id: string;
  agentName: string;
  timestamp: Date;
  state: any;
  metadata: {
    iteration: number;
    taskId?: string;
    description?: string;
  };
}

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  storageDir: string;
  checkpointInterval?: number;
  maxCheckpoints?: number;
  autoRecover?: boolean;
  compressionEnabled?: boolean;
}

/**
 * State Persistence Manager
 *
 * Manages persistence and recovery of agent state.
 * Features:
 * - Checkpoint creation and storage
 * - State snapshots
 * - Automatic recovery from failures
 * - Checkpoint cleanup and rotation
 * - State validation
 */
export class StatePersistenceManager extends EventEmitter {
  private config: Required<PersistenceConfig>;
  private checkpoints: Map<string, Checkpoint[]>;
  private isInitialized: boolean;

  constructor(config: PersistenceConfig) {
    super();

    this.config = {
      storageDir: config.storageDir || './state-storage',
      checkpointInterval: config.checkpointInterval || 60000,
      maxCheckpoints: config.maxCheckpoints || 10,
      autoRecover: config.autoRecover ?? true,
      compressionEnabled: config.compressionEnabled ?? false,
    };

    this.checkpoints = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize persistence manager
   */
  public async initialize(): Promise<void> {
    try {
      // Create storage directory if it doesn't exist
      await fs.mkdir(this.config.storageDir, { recursive: true });

      // Load existing checkpoints
      await this.loadCheckpoints();

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      throw new Error(`Failed to initialize persistence manager: ${(error as Error).message}`);
    }
  }

  /**
   * Create a checkpoint for agent state
   */
  public async createCheckpoint(
    agentName: string,
    state: any,
    metadata?: { iteration?: number; taskId?: string; description?: string }
  ): Promise<Checkpoint> {
    if (!this.isInitialized) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      const checkpoint: Checkpoint = {
        id: this.generateCheckpointId(),
        agentName,
        timestamp: new Date(),
        state,
        metadata: {
          iteration: metadata?.iteration || 0,
          taskId: metadata?.taskId,
          description: metadata?.description,
        },
      };

      // Store checkpoint
      await this.storeCheckpoint(checkpoint);

      // Add to in-memory cache
      if (!this.checkpoints.has(agentName)) {
        this.checkpoints.set(agentName, []);
      }
      this.checkpoints.get(agentName)!.push(checkpoint);

      // Cleanup old checkpoints
      await this.cleanupOldCheckpoints(agentName);

      this.emit('checkpoint:created', checkpoint);

      return checkpoint;
    } catch (error) {
      throw new Error(`Failed to create checkpoint: ${(error as Error).message}`);
    }
  }

  /**
   * Get latest checkpoint for agent
   */
  public async getLatestCheckpoint(agentName: string): Promise<Checkpoint | null> {
    if (!this.isInitialized) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      const checkpoints = this.checkpoints.get(agentName);

      if (!checkpoints || checkpoints.length === 0) {
        return null;
      }

      return checkpoints[checkpoints.length - 1];
    } catch (error) {
      throw new Error(`Failed to get latest checkpoint: ${(error as Error).message}`);
    }
  }

  /**
   * Get all checkpoints for agent
   */
  public async getCheckpoints(agentName: string): Promise<Checkpoint[]> {
    if (!this.isInitialized) {
      throw new Error('Persistence manager not initialized');
    }

    return this.checkpoints.get(agentName) || [];
  }

  /**
   * Restore agent state from checkpoint
   */
  public async restoreFromCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    if (!this.isInitialized) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      // Search for checkpoint
      for (const [, checkpoints] of this.checkpoints) {
        const checkpoint = checkpoints.find(cp => cp.id === checkpointId);
        if (checkpoint) {
          this.emit('checkpoint:restored', checkpoint);
          return checkpoint;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to restore from checkpoint: ${(error as Error).message}`);
    }
  }

  /**
   * Delete checkpoint
   */
  public async deleteCheckpoint(checkpointId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      const filePath = path.join(this.config.storageDir, `${checkpointId}.json`);
      await fs.unlink(filePath);

      // Remove from cache
      for (const [agentName, checkpoints] of this.checkpoints) {
        const index = checkpoints.findIndex(cp => cp.id === checkpointId);
        if (index !== -1) {
          checkpoints.splice(index, 1);
          break;
        }
      }

      this.emit('checkpoint:deleted', checkpointId);
    } catch (error) {
      throw new Error(`Failed to delete checkpoint: ${(error as Error).message}`);
    }
  }

  /**
   * Store checkpoint to disk
   */
  private async storeCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const filePath = path.join(this.config.storageDir, `${checkpoint.id}.json`);
    const data = JSON.stringify(checkpoint, null, 2);

    await fs.writeFile(filePath, data, 'utf-8');
  }

  /**
   * Load checkpoints from disk
   */
  private async loadCheckpoints(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.storageDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.storageDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const checkpoint: Checkpoint = JSON.parse(data);
          checkpoint.timestamp = new Date(checkpoint.timestamp);

          if (!this.checkpoints.has(checkpoint.agentName)) {
            this.checkpoints.set(checkpoint.agentName, []);
          }
          this.checkpoints.get(checkpoint.agentName)!.push(checkpoint);
        }
      }

      // Sort checkpoints by timestamp
      for (const [, checkpoints] of this.checkpoints) {
        checkpoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      }
    } catch (error) {
      // Directory might not exist yet, which is fine
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Cleanup old checkpoints
   */
  private async cleanupOldCheckpoints(agentName: string): Promise<void> {
    const checkpoints = this.checkpoints.get(agentName);

    if (!checkpoints || checkpoints.length <= this.config.maxCheckpoints) {
      return;
    }

    // Remove oldest checkpoints
    const toRemove = checkpoints.length - this.config.maxCheckpoints;

    for (let i = 0; i < toRemove; i++) {
      const checkpoint = checkpoints.shift();
      if (checkpoint) {
        await this.deleteCheckpoint(checkpoint.id);
      }
    }
  }

  /**
   * Generate unique checkpoint ID
   */
  private generateCheckpointId(): string {
    return `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get persistence statistics
   */
  public async getStats(): Promise<{
    totalCheckpoints: number;
    checkpointsByAgent: Record<string, number>;
    storageSize: number;
  }> {
    try {
      let totalCheckpoints = 0;
      const checkpointsByAgent: Record<string, number> = {};

      for (const [agentName, checkpoints] of this.checkpoints) {
        checkpointsByAgent[agentName] = checkpoints.length;
        totalCheckpoints += checkpoints.length;
      }

      // Calculate storage size
      const files = await fs.readdir(this.config.storageDir);
      let storageSize = 0;

      for (const file of files) {
        const filePath = path.join(this.config.storageDir, file);
        const stats = await fs.stat(filePath);
        storageSize += stats.size;
      }

      return {
        totalCheckpoints,
        checkpointsByAgent,
        storageSize,
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${(error as Error).message}`);
    }
  }

  /**
   * Clear all checkpoints
   */
  public async clearAll(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.storageDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.storageDir, file);
          await fs.unlink(filePath);
        }
      }

      this.checkpoints.clear();
      this.emit('cleared');
    } catch (error) {
      throw new Error(`Failed to clear checkpoints: ${(error as Error).message}`);
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      await fs.access(this.config.storageDir);

      const stats = await this.getStats();

      return {
        healthy: true,
        details: {
          initialized: this.isInitialized,
          stats,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: (error as Error).message,
        },
      };
    }
  }
}

export default StatePersistenceManager;
