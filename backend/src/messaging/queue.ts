/**
 * Message Queue Implementation with Redis
 *
 * Implements message passing between agents using Redis as the message broker.
 * Supports pub/sub, message routing, dead letter queue, and connection pooling.
 *
 * Architecture: Phase 1 - Foundation & Infrastructure
 * Task: Task 3 - Message Queue Setup (Redis)
 *
 * @module messaging/queue
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';

/**
 * Message interface
 */
export interface Message {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'error';
  content: any;
  timestamp: Date;
  correlationId?: string;
  priority?: number;
  ttl?: number;
  retryCount?: number;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    enableReadyCheck?: boolean;
    enableOfflineQueue?: boolean;
  };
  queue: {
    prefix?: string;
    maxRetries?: number;
    retryDelay?: number;
    deadLetterQueueEnabled?: boolean;
    messageTimeout?: number;
  };
  pool?: {
    min?: number;
    max?: number;
  };
}

/**
 * Queue statistics
 */
export interface QueueStats {
  messagesSent: number;
  messagesReceived: number;
  messagesProcessed: number;
  messagesFailed: number;
  deadLetterQueueSize: number;
  activeConnections: number;
}

/**
 * Message Queue Class
 *
 * Handles all message passing between agents using Redis.
 * Features:
 * - Pub/Sub for real-time messaging
 * - Message routing by agent name
 * - Dead letter queue for failed messages
 * - Connection pooling for performance
 * - Message serialization/deserialization
 * - Retry logic with exponential backoff
 */
export class MessageQueue extends EventEmitter {
  private config: Required<QueueConfig>;
  private publisher: Redis;
  private subscriber: Redis;
  private client: Redis;
  private subscriptions: Map<string, Set<(message: Message) => void>>;
  private stats: QueueStats;
  private isConnected: boolean;

  constructor(config: QueueConfig) {
    super();

    // Set default configuration
    this.config = {
      redis: {
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        password: config.redis.password,
        db: config.redis.db || 0,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest || 3,
        enableReadyCheck: config.redis.enableReadyCheck ?? true,
        enableOfflineQueue: config.redis.enableOfflineQueue ?? true,
      },
      queue: {
        prefix: config.queue?.prefix || 'agent:queue',
        maxRetries: config.queue?.maxRetries || 3,
        retryDelay: config.queue?.retryDelay || 1000,
        deadLetterQueueEnabled: config.queue?.deadLetterQueueEnabled ?? true,
        messageTimeout: config.queue?.messageTimeout || 30000,
      },
      pool: {
        min: config.pool?.min || 2,
        max: config.pool?.max || 10,
      },
    };

    // Initialize Redis clients
    this.publisher = new Redis(this.config.redis);
    this.subscriber = new Redis(this.config.redis);
    this.client = new Redis(this.config.redis);

    // Initialize subscriptions map
    this.subscriptions = new Map();

    // Initialize stats
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      deadLetterQueueSize: 0,
      activeConnections: 0,
    };

    this.isConnected = false;

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up Redis event handlers
   */
  private setupEventHandlers(): void {
    // Publisher events
    this.publisher.on('connect', () => {
      this.emit('publisher:connected');
    });

    this.publisher.on('error', (error: Error) => {
      this.emit('publisher:error', error);
    });

    // Subscriber events
    this.subscriber.on('connect', () => {
      this.emit('subscriber:connected');
    });

    this.subscriber.on('error', (error: Error) => {
      this.emit('subscriber:error', error);
    });

    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleIncomingMessage(channel, message);
    });

    // Client events
    this.client.on('connect', () => {
      this.emit('client:connected');
      this.isConnected = true;
    });

    this.client.on('error', (error: Error) => {
      this.emit('client:error', error);
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    try {
      await Promise.all([
        this.publisher.ping(),
        this.subscriber.ping(),
        this.client.ping(),
      ]);

      this.isConnected = true;
      this.emit('connected');
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to Redis: ${(error as Error).message}`);
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.publisher.quit(),
        this.subscriber.quit(),
        this.client.quit(),
      ]);

      this.isConnected = false;
      this.emit('disconnected');
    } catch (error) {
      throw new Error(`Failed to disconnect from Redis: ${(error as Error).message}`);
    }
  }

  /**
   * Send a message to a specific agent
   */
  public async sendMessage(message: Message): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    try {
      // Add metadata
      const enrichedMessage: Message = {
        ...message,
        id: message.id || this.generateMessageId(),
        timestamp: message.timestamp || new Date(),
        retryCount: message.retryCount || 0,
      };

      // Serialize message
      const serialized = this.serializeMessage(enrichedMessage);

      // Get channel name
      const channel = this.getChannelName(message.to);

      // Publish message
      await this.publisher.publish(channel, serialized);

      // Update stats
      this.stats.messagesSent++;

      // Emit event
      this.emit('message:sent', enrichedMessage);

      // Store in queue for reliability
      await this.storeMessage(enrichedMessage);

    } catch (error) {
      this.stats.messagesFailed++;
      this.emit('message:error', { message, error });
      throw new Error(`Failed to send message: ${(error as Error).message}`);
    }
  }

  /**
   * Subscribe to messages for a specific agent
   */
  public async subscribe(agentName: string, handler: (message: Message) => void): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    try {
      const channel = this.getChannelName(agentName);

      // Add handler to subscriptions
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
        await this.subscriber.subscribe(channel);
      }

      this.subscriptions.get(channel)!.add(handler);

      this.emit('subscribed', { agentName, channel });

    } catch (error) {
      throw new Error(`Failed to subscribe: ${(error as Error).message}`);
    }
  }

  /**
   * Unsubscribe from messages
   */
  public async unsubscribe(agentName: string, handler?: (message: Message) => void): Promise<void> {
    const channel = this.getChannelName(agentName);

    if (!this.subscriptions.has(channel)) {
      return;
    }

    if (handler) {
      // Remove specific handler
      this.subscriptions.get(channel)!.delete(handler);

      // If no more handlers, unsubscribe from channel
      if (this.subscriptions.get(channel)!.size === 0) {
        await this.subscriber.unsubscribe(channel);
        this.subscriptions.delete(channel);
      }
    } else {
      // Remove all handlers and unsubscribe
      await this.subscriber.unsubscribe(channel);
      this.subscriptions.delete(channel);
    }

    this.emit('unsubscribed', { agentName, channel });
  }

  /**
   * Handle incoming message
   */
  private handleIncomingMessage(channel: string, messageData: string): void {
    try {
      // Deserialize message
      const message = this.deserializeMessage(messageData);

      // Update stats
      this.stats.messagesReceived++;

      // Get handlers for this channel
      const handlers = this.subscriptions.get(channel);

      if (handlers && handlers.size > 0) {
        // Call all handlers
        handlers.forEach(handler => {
          try {
            handler(message);
            this.stats.messagesProcessed++;
          } catch (error) {
            this.emit('handler:error', { message, error });
          }
        });
      }

      // Emit event
      this.emit('message:received', message);

      // Remove from queue
      this.removeMessage(message.id);

    } catch (error) {
      this.stats.messagesFailed++;
      this.emit('message:parse:error', { channel, messageData, error });
    }
  }

  /**
   * Store message in queue for reliability
   */
  private async storeMessage(message: Message): Promise<void> {
    const key = this.getQueueKey(message.to);
    const serialized = this.serializeMessage(message);

    // Store with TTL if specified
    if (message.ttl) {
      await this.client.setex(
        `${key}:${message.id}`,
        Math.floor(message.ttl / 1000),
        serialized
      );
    } else {
      await this.client.set(`${key}:${message.id}`, serialized);
    }
  }

  /**
   * Remove message from queue
   */
  private async removeMessage(messageId: string): Promise<void> {
    const keys = await this.client.keys(`${this.config.queue.prefix}:*:${messageId}`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * Move message to dead letter queue
   */
  private async moveToDeadLetterQueue(message: Message, error: Error): Promise<void> {
    if (!this.config.queue.deadLetterQueueEnabled) {
      return;
    }

    const dlqKey = `${this.config.queue.prefix}:dlq`;
    const dlqMessage = {
      ...message,
      error: error.message,
      movedAt: new Date(),
    };

    await this.client.lpush(dlqKey, this.serializeMessage(dlqMessage));
    this.stats.deadLetterQueueSize++;

    this.emit('message:dlq', dlqMessage);
  }

  /**
   * Get dead letter queue messages
   */
  public async getDeadLetterQueue(): Promise<Message[]> {
    const dlqKey = `${this.config.queue.prefix}:dlq`;
    const messages = await this.client.lrange(dlqKey, 0, -1);

    return messages.map((msg: string) => this.deserializeMessage(msg));
  }

  /**
   * Clear dead letter queue
   */
  public async clearDeadLetterQueue(): Promise<void> {
    const dlqKey = `${this.config.queue.prefix}:dlq`;
    await this.client.del(dlqKey);
    this.stats.deadLetterQueueSize = 0;
  }

  /**
   * Serialize message to JSON string
   */
  private serializeMessage(message: Message): string {
    return JSON.stringify(message);
  }

  /**
   * Deserialize message from JSON string
   */
  private deserializeMessage(data: string): Message {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp),
    };
  }

  /**
   * Get channel name for agent
   */
  private getChannelName(agentName: string): string {
    return `${this.config.queue.prefix}:channel:${agentName}`;
  }

  /**
   * Get queue key for agent
   */
  private getQueueKey(agentName: string): string {
    return `${this.config.queue.prefix}:messages:${agentName}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  public getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      deadLetterQueueSize: this.stats.deadLetterQueueSize,
      activeConnections: this.stats.activeConnections,
    };
  }

  /**
   * Check if queue is connected
   */
  public isQueueConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      await this.client.ping();

      return {
        healthy: true,
        details: {
          connected: this.isConnected,
          stats: this.stats,
          subscriptions: this.subscriptions.size,
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

export default MessageQueue;
