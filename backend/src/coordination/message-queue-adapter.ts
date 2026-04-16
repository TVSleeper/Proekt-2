/**
 * Message Queue Adapter
 *
 * Integrates the Redis message queue with the communication protocol.
 * Provides a bridge between the protocol layer and the queue infrastructure.
 *
 * Features:
 * - Publish-subscribe pattern integration
 * - Message persistence and reliability
 * - Retry logic with exponential backoff
 * - Dead letter queue handling
 * - Message deduplication
 * - Queue health monitoring
 *
 * Architecture: Phase 2 - Multi-Agent Coordination
 * Task: Task 21 - Agent Communication Protocol (Week 4)
 *
 * @module coordination/message-queue-adapter
 */

import { EventEmitter } from 'events';
import MessageQueue, { Message, QueueConfig } from '../messaging/queue';
import {
  CommunicationProtocol,
  ProtocolMessage,
  MessageType,
  MessageStatus,
  ProtocolConfig,
} from './communication-protocol';
import { MessageRouter, RouterConfig } from './message-router';

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  queue: QueueConfig;
  protocol?: ProtocolConfig;
  router?: RouterConfig;
  retry?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  deduplication?: {
    enabled: boolean;
    windowMs: number;
  };
  persistence?: {
    enabled: boolean;
    ttl?: number;
  };
}

/**
 * Message delivery status
 */
export interface DeliveryStatus {
  messageId: string;
  status: MessageStatus;
  attempts: number;
  lastAttempt: Date;
  error?: string;
}

/**
 * Adapter statistics
 */
export interface AdapterStats {
  messagesSent: number;
  messagesReceived: number;
  messagesDelivered: number;
  messagesFailed: number;
  messagesRetried: number;
  messagesDeduplicated: number;
  averageDeliveryTime: number;
  queueStats: any;
  protocolStats: any;
  routerStats: any;
}

/**
 * Message Queue Adapter Class
 *
 * Bridges the communication protocol with the Redis message queue,
 * providing reliable message delivery with retry and deduplication.
 */
export class MessageQueueAdapter extends EventEmitter {
  private config: Required<AdapterConfig>;
  private queue: MessageQueue;
  private protocol: CommunicationProtocol;
  private router: MessageRouter;
  private deliveryStatus: Map<string, DeliveryStatus>;
  private messageCache: Map<string, { timestamp: number; message: ProtocolMessage }>;
  private retryTimers: Map<string, NodeJS.Timeout>;
  private stats: AdapterStats;
  private deliveryTimes: number[];
  private isInitialized: boolean;

  constructor(config: AdapterConfig) {
    super();

    this.config = {
      queue: config.queue,
      protocol: config.protocol || {},
      router: config.router || {},
      retry: {
        maxAttempts: config.retry?.maxAttempts || 3,
        initialDelay: config.retry?.initialDelay || 1000,
        maxDelay: config.retry?.maxDelay || 30000,
        backoffMultiplier: config.retry?.backoffMultiplier || 2,
      },
      deduplication: {
        enabled: config.deduplication?.enabled ?? true,
        windowMs: config.deduplication?.windowMs || 60000,
      },
      persistence: {
        enabled: config.persistence?.enabled ?? true,
        ttl: config.persistence?.ttl || 3600000, // 1 hour
      },
    };

    // Initialize components
    this.queue = new MessageQueue(this.config.queue);
    this.protocol = new CommunicationProtocol(this.config.protocol);
    this.router = new MessageRouter(this.config.router);

    // Initialize storage
    this.deliveryStatus = new Map();
    this.messageCache = new Map();
    this.retryTimers = new Map();
    this.deliveryTimes = [];

    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDelivered: 0,
      messagesFailed: 0,
      messagesRetried: 0,
      messagesDeduplicated: 0,
      averageDeliveryTime: 0,
      queueStats: {},
      protocolStats: {},
      routerStats: {},
    };

    this.isInitialized = false;

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the adapter
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Connect to queue
      await this.queue.connect();

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('initialization:error', error);
      throw new Error(`Failed to initialize adapter: ${(error as Error).message}`);
    }
  }

  /**
   * Shutdown the adapter
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Clear retry timers
      const timers = Array.from(this.retryTimers.values());
      for (const timer of timers) {
        clearTimeout(timer);
      }
      this.retryTimers.clear();

      // Disconnect from queue
      await this.queue.disconnect();

      // Shutdown router
      this.router.shutdown();

      this.isInitialized = false;
      this.emit('shutdown');
    } catch (error) {
      this.emit('shutdown:error', error);
      throw new Error(`Failed to shutdown adapter: ${(error as Error).message}`);
    }
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // Queue events
    this.queue.on('message:received', (message: Message) => {
      this.handleQueueMessage(message);
    });

    this.queue.on('message:error', ({ message, error }) => {
      this.emit('queue:error', { message, error });
    });

    // Protocol events
    this.protocol.on('message:acknowledged', ({ messageId, ack }) => {
      this.handleAcknowledgment(messageId, ack);
    });

    this.protocol.on('message:expired', (message) => {
      this.handleExpiredMessage(message);
    });

    // Router events
    this.router.on('message:delivered', ({ message, agentName }) => {
      this.handleDeliverySuccess(message, agentName);
    });

    this.router.on('delivery:error', ({ message, agentName, error }) => {
      this.handleDeliveryError(message, agentName, error);
    });
  }

  /**
   * Send a message
   */
  public async sendMessage(message: ProtocolMessage): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Adapter is not initialized');
    }

    const startTime = Date.now();

    try {
      // Check for duplicates
      if (this.config.deduplication.enabled && this.isDuplicate(message)) {
        this.stats.messagesDeduplicated++;
        this.emit('message:duplicate', message);
        return;
      }

      // Validate message
      const validation = this.protocol.validateMessage(message);
      if (!validation.valid) {
        throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
      }

      // Check rate limit
      if (!this.protocol.checkRateLimit(message.header.sender)) {
        throw new Error(`Rate limit exceeded for sender ${message.header.sender}`);
      }

      // Encrypt if needed
      let processedMessage = message;
      if (message.header.encrypted) {
        processedMessage = this.protocol.encryptMessage(message);
      }

      // Track message
      this.protocol.trackMessage(processedMessage);

      // Convert to queue message
      const queueMessage = this.protocolToQueueMessage(processedMessage);

      // Send to queue
      await this.queue.sendMessage(queueMessage);

      // Initialize delivery status
      this.deliveryStatus.set(message.header.id, {
        messageId: message.header.id,
        status: MessageStatus.SENT,
        attempts: 1,
        lastAttempt: new Date(),
      });

      // Cache for deduplication
      if (this.config.deduplication.enabled) {
        this.cacheMessage(message);
      }

      // Update stats
      this.stats.messagesSent++;
      const deliveryTime = Date.now() - startTime;
      this.updateAverageDeliveryTime(deliveryTime);

      this.emit('message:sent', { message, deliveryTime });
    } catch (error) {
      this.stats.messagesFailed++;
      this.emit('send:error', { message, error });
      throw error;
    }
  }

  /**
   * Subscribe to messages for an agent
   */
  public async subscribe(
    agentName: string,
    handler: (message: ProtocolMessage) => void | Promise<void>
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Adapter is not initialized');
    }

    try {
      // Subscribe to queue
      await this.queue.subscribe(agentName, async (queueMessage: Message) => {
        try {
          // Convert to protocol message
          const protocolMessage = this.queueToProtocolMessage(queueMessage);

          // Decrypt if needed
          let processedMessage = protocolMessage;
          if (protocolMessage.header.encrypted) {
            processedMessage = this.protocol.decryptMessage(protocolMessage);
          }

          // Validate message
          const validation = this.protocol.validateMessage(processedMessage);
          if (!validation.valid) {
            this.emit('validation:error', {
              message: processedMessage,
              errors: validation.errors,
            });
            return;
          }

          // Check if expired
          if (this.protocol.isMessageExpired(processedMessage)) {
            this.handleExpiredMessage(processedMessage);
            return;
          }

          // Call handler
          await handler(processedMessage);

          // Send acknowledgment if enabled
          if (this.config.queue.queue.deadLetterQueueEnabled) {
            await this.sendAcknowledgment(processedMessage, agentName);
          }

          this.stats.messagesReceived++;
        } catch (error) {
          this.emit('handler:error', { message: queueMessage, error });
        }
      });

      this.emit('subscribed', { agentName });
    } catch (error) {
      this.emit('subscribe:error', { agentName, error });
      throw error;
    }
  }

  /**
   * Unsubscribe from messages
   */
  public async unsubscribe(agentName: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Adapter is not initialized');
    }

    try {
      await this.queue.unsubscribe(agentName);
      this.emit('unsubscribed', { agentName });
    } catch (error) {
      this.emit('unsubscribe:error', { agentName, error });
      throw error;
    }
  }

  /**
   * Handle incoming queue message
   */
  private async handleQueueMessage(queueMessage: Message): Promise<void> {
    try {
      const protocolMessage = this.queueToProtocolMessage(queueMessage);

      // Route message
      await this.router.routeMessage(protocolMessage);
    } catch (error) {
      this.emit('routing:error', { message: queueMessage, error });
    }
  }

  /**
   * Handle message acknowledgment
   */
  private handleAcknowledgment(messageId: string, ack: any): void {
    const status = this.deliveryStatus.get(messageId);
    if (status) {
      status.status = MessageStatus.ACKNOWLEDGED;
      this.stats.messagesDelivered++;
      this.emit('message:acknowledged', { messageId, ack });
    }
  }

  /**
   * Handle expired message
   */
  private handleExpiredMessage(message: ProtocolMessage): void {
    const status = this.deliveryStatus.get(message.header.id);
    if (status) {
      status.status = MessageStatus.EXPIRED;
    }

    this.emit('message:expired', message);
  }

  /**
   * Handle successful delivery
   */
  private handleDeliverySuccess(message: ProtocolMessage, agentName: string): void {
    const status = this.deliveryStatus.get(message.header.id);
    if (status) {
      status.status = MessageStatus.DELIVERED;
    }

    this.emit('delivery:success', { message, agentName });
  }

  /**
   * Handle delivery error
   */
  private async handleDeliveryError(
    message: ProtocolMessage,
    agentName: string,
    error: any
  ): Promise<void> {
    const status = this.deliveryStatus.get(message.header.id);
    if (!status) {
      return;
    }

    status.error = (error as Error).message;

    // Check if we should retry
    if (status.attempts < this.config.retry.maxAttempts) {
      await this.scheduleRetry(message, status);
    } else {
      // Max retries reached, move to DLQ
      status.status = MessageStatus.FAILED;
      this.stats.messagesFailed++;
      this.emit('delivery:failed', { message, agentName, error });
    }
  }

  /**
   * Schedule message retry
   */
  private async scheduleRetry(
    message: ProtocolMessage,
    status: DeliveryStatus
  ): Promise<void> {
    const delay = Math.min(
      this.config.retry.initialDelay *
        Math.pow(this.config.retry.backoffMultiplier, status.attempts - 1),
      this.config.retry.maxDelay
    );

    const timer = setTimeout(async () => {
      try {
        status.attempts++;
        status.lastAttempt = new Date();
        this.stats.messagesRetried++;

        await this.sendMessage(message);

        this.retryTimers.delete(message.header.id);
        this.emit('message:retried', { message, attempt: status.attempts });
      } catch (error) {
        this.emit('retry:error', { message, error });
      }
    }, delay);

    this.retryTimers.set(message.header.id, timer);
  }

  /**
   * Send acknowledgment
   */
  private async sendAcknowledgment(
    message: ProtocolMessage,
    agentName: string
  ): Promise<void> {
    try {
      const ackMessage = this.protocol.createAck(
        agentName,
        message.header.sender,
        message.header.id,
        MessageStatus.DELIVERED
      );

      await this.sendMessage(ackMessage);
    } catch (error) {
      this.emit('ack:error', { message, error });
    }
  }

  /**
   * Check if message is duplicate
   */
  private isDuplicate(message: ProtocolMessage): boolean {
    const cached = this.messageCache.get(message.header.id);
    if (!cached) {
      return false;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    return age < this.config.deduplication.windowMs;
  }

  /**
   * Cache message for deduplication
   */
  private cacheMessage(message: ProtocolMessage): void {
    this.messageCache.set(message.header.id, {
      timestamp: Date.now(),
      message,
    });

    // Clean up old entries
    setTimeout(() => {
      this.messageCache.delete(message.header.id);
    }, this.config.deduplication.windowMs);
  }

  /**
   * Convert protocol message to queue message
   */
  private protocolToQueueMessage(message: ProtocolMessage): Message {
    return {
      id: message.header.id,
      from: message.header.sender,
      to: Array.isArray(message.header.receiver)
        ? message.header.receiver[0]
        : message.header.receiver,
      type: message.header.type as any,
      content: {
        header: message.header,
        body: message.body,
      },
      timestamp: message.header.timestamp,
      correlationId: message.header.correlationId,
      priority: message.header.priority,
      ttl: message.header.ttl,
    };
  }

  /**
   * Convert queue message to protocol message
   */
  private queueToProtocolMessage(message: Message): ProtocolMessage {
    return {
      header: message.content.header,
      body: message.content.body,
    };
  }

  /**
   * Update average delivery time
   */
  private updateAverageDeliveryTime(deliveryTime: number): void {
    this.deliveryTimes.push(deliveryTime);

    // Keep only last 100 measurements
    if (this.deliveryTimes.length > 100) {
      this.deliveryTimes.shift();
    }

    const sum = this.deliveryTimes.reduce((acc, time) => acc + time, 0);
    this.stats.averageDeliveryTime = sum / this.deliveryTimes.length;
  }

  /**
   * Get delivery status for message
   */
  public getDeliveryStatus(messageId: string): DeliveryStatus | undefined {
    return this.deliveryStatus.get(messageId);
  }

  /**
   * Get dead letter queue messages
   */
  public async getDeadLetterQueue(): Promise<ProtocolMessage[]> {
    const dlqMessages = await this.queue.getDeadLetterQueue();
    return dlqMessages.map((msg) => this.queueToProtocolMessage(msg));
  }

  /**
   * Clear dead letter queue
   */
  public async clearDeadLetterQueue(): Promise<void> {
    await this.queue.clearDeadLetterQueue();
  }

  /**
   * Get adapter statistics
   */
  public getStats(): AdapterStats {
    return {
      ...this.stats,
      queueStats: this.queue.getStats(),
      protocolStats: this.protocol.getStats(),
      routerStats: this.router.getStats(),
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDelivered: 0,
      messagesFailed: 0,
      messagesRetried: 0,
      messagesDeduplicated: 0,
      averageDeliveryTime: 0,
      queueStats: {},
      protocolStats: {},
      routerStats: {},
    };
    this.deliveryTimes = [];
    this.queue.resetStats();
    this.router.resetStats();
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    details: any;
  }> {
    try {
      const queueHealth = await this.queue.healthCheck();

      return {
        healthy: queueHealth.healthy && this.isInitialized,
        details: {
          initialized: this.isInitialized,
          queue: queueHealth,
          stats: this.getStats(),
          pendingRetries: this.retryTimers.size,
          cachedMessages: this.messageCache.size,
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

  /**
   * Get router instance
   */
  public getRouter(): MessageRouter {
    return this.router;
  }

  /**
   * Get protocol instance
   */
  public getProtocol(): CommunicationProtocol {
    return this.protocol;
  }

  /**
   * Get queue instance
   */
  public getQueue(): MessageQueue {
    return this.queue;
  }
}

export default MessageQueueAdapter;
