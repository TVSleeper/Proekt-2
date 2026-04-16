/**
 * Agent Communication Protocol
 *
 * Implements a robust communication protocol for agent-to-agent messaging.
 * Features:
 * - Structured message format with headers and metadata
 * - Multiple message types (request, response, broadcast, notification)
 * - Message validation and sanitization
 * - Correlation ID for request-response tracking
 * - Message encryption (optional)
 * - Rate limiting and access control
 * - Message acknowledgment and retry logic
 *
 * Architecture: Phase 2 - Multi-Agent Coordination
 * Task: Task 21 - Agent Communication Protocol (Week 4)
 *
 * @module coordination/communication-protocol
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

/**
 * Message types
 */
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  BROADCAST = 'broadcast',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  ACK = 'ack',
  HEARTBEAT = 'heartbeat',
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Message status
 */
export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  ACKNOWLEDGED = 'acknowledged',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * Message header interface
 */
export interface MessageHeader {
  id: string;
  type: MessageType;
  version: string;
  timestamp: Date;
  sender: string;
  receiver: string | string[]; // Single receiver or multiple for broadcast
  correlationId?: string; // For request-response tracking
  replyTo?: string; // For response routing
  priority: MessagePriority;
  ttl?: number; // Time to live in milliseconds
  encrypted?: boolean;
  signature?: string; // Message signature for verification
}

/**
 * Message body interface
 */
export interface MessageBody {
  action?: string; // Action to perform (for requests)
  data?: any; // Message payload
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Complete message structure
 */
export interface ProtocolMessage {
  header: MessageHeader;
  body: MessageBody;
}

/**
 * Message validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Protocol configuration
 */
export interface ProtocolConfig {
  version?: string;
  encryption?: {
    enabled: boolean;
    algorithm?: string;
    key?: string;
  };
  validation?: {
    strictMode?: boolean;
    maxMessageSize?: number; // in bytes
    allowedMessageTypes?: MessageType[];
  };
  rateLimit?: {
    enabled: boolean;
    maxMessagesPerSecond?: number;
    maxMessagesPerMinute?: number;
  };
  reliability?: {
    enableAck: boolean;
    ackTimeout?: number;
    maxRetries?: number;
    retryDelay?: number;
  };
  security?: {
    enableSignature: boolean;
    allowedSenders?: string[];
    allowedReceivers?: string[];
  };
}

/**
 * Message acknowledgment
 */
export interface MessageAck {
  messageId: string;
  status: MessageStatus;
  timestamp: Date;
  receiver: string;
  error?: string;
}

/**
 * Rate limit tracker
 */
interface RateLimitTracker {
  count: number;
  resetTime: number;
}

/**
 * Communication Protocol Class
 *
 * Handles all aspects of agent-to-agent communication including
 * message creation, validation, encryption, and tracking.
 */
export class CommunicationProtocol extends EventEmitter {
  private config: Required<ProtocolConfig>;
  private pendingMessages: Map<string, ProtocolMessage>;
  private messageHistory: Map<string, ProtocolMessage>;
  private acknowledgments: Map<string, MessageAck>;
  private rateLimitTrackers: Map<string, RateLimitTracker>;
  private encryptionKey?: Buffer;

  constructor(config: ProtocolConfig = {}) {
    super();

    // Set default configuration
    this.config = {
      version: config.version || '1.0.0',
      encryption: {
        enabled: config.encryption?.enabled ?? false,
        algorithm: config.encryption?.algorithm || 'aes-256-gcm',
        key: config.encryption?.key || undefined,
      },
      validation: {
        strictMode: config.validation?.strictMode ?? true,
        maxMessageSize: config.validation?.maxMessageSize || 1024 * 1024, // 1MB
        allowedMessageTypes: config.validation?.allowedMessageTypes || Object.values(MessageType),
      },
      rateLimit: {
        enabled: config.rateLimit?.enabled ?? true,
        maxMessagesPerSecond: config.rateLimit?.maxMessagesPerSecond || 100,
        maxMessagesPerMinute: config.rateLimit?.maxMessagesPerMinute || 1000,
      },
      reliability: {
        enableAck: config.reliability?.enableAck ?? true,
        ackTimeout: config.reliability?.ackTimeout || 5000,
        maxRetries: config.reliability?.maxRetries || 3,
        retryDelay: config.reliability?.retryDelay || 1000,
      },
      security: {
        enableSignature: config.security?.enableSignature ?? false,
        allowedSenders: config.security?.allowedSenders || [],
        allowedReceivers: config.security?.allowedReceivers || [],
      },
    };

    // Initialize storage
    this.pendingMessages = new Map();
    this.messageHistory = new Map();
    this.acknowledgments = new Map();
    this.rateLimitTrackers = new Map();

    // Initialize encryption key if enabled
    if (this.config.encryption.enabled && this.config.encryption.key) {
      this.encryptionKey = Buffer.from(this.config.encryption.key, 'hex');
    }
  }

  /**
   * Create a new message
   */
  public createMessage(
    type: MessageType,
    sender: string,
    receiver: string | string[],
    body: MessageBody,
    options?: {
      priority?: MessagePriority;
      ttl?: number;
      correlationId?: string;
      replyTo?: string;
    }
  ): ProtocolMessage {
    const messageId = this.generateMessageId();

    const header: MessageHeader = {
      id: messageId,
      type,
      version: this.config.version,
      timestamp: new Date(),
      sender,
      receiver,
      priority: options?.priority ?? MessagePriority.NORMAL,
      ttl: options?.ttl,
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
      encrypted: this.config.encryption.enabled,
    };

    // Add signature if enabled
    if (this.config.security.enableSignature) {
      header.signature = this.signMessage(header, body);
    }

    const message: ProtocolMessage = {
      header,
      body,
    };

    return message;
  }

  /**
   * Create a request message
   */
  public createRequest(
    sender: string,
    receiver: string,
    action: string,
    data?: any,
    options?: {
      priority?: MessagePriority;
      ttl?: number;
    }
  ): ProtocolMessage {
    return this.createMessage(
      MessageType.REQUEST,
      sender,
      receiver,
      { action, data },
      {
        ...options,
        correlationId: this.generateCorrelationId(),
        replyTo: sender,
      }
    );
  }

  /**
   * Create a response message
   */
  public createResponse(
    sender: string,
    receiver: string,
    correlationId: string,
    data?: any,
    error?: { code: string; message: string; details?: any }
  ): ProtocolMessage {
    return this.createMessage(
      MessageType.RESPONSE,
      sender,
      receiver,
      { data, error },
      { correlationId }
    );
  }

  /**
   * Create a broadcast message
   */
  public createBroadcast(
    sender: string,
    receivers: string[],
    data: any,
    options?: {
      priority?: MessagePriority;
      ttl?: number;
    }
  ): ProtocolMessage {
    return this.createMessage(
      MessageType.BROADCAST,
      sender,
      receivers,
      { data },
      options
    );
  }

  /**
   * Create a notification message
   */
  public createNotification(
    sender: string,
    receiver: string,
    data: any,
    options?: {
      priority?: MessagePriority;
    }
  ): ProtocolMessage {
    return this.createMessage(
      MessageType.NOTIFICATION,
      sender,
      receiver,
      { data },
      options
    );
  }

  /**
   * Create an error message
   */
  public createError(
    sender: string,
    receiver: string,
    error: { code: string; message: string; details?: any },
    correlationId?: string
  ): ProtocolMessage {
    return this.createMessage(
      MessageType.ERROR,
      sender,
      receiver,
      { error },
      { correlationId, priority: MessagePriority.HIGH }
    );
  }

  /**
   * Create an acknowledgment message
   */
  public createAck(
    sender: string,
    receiver: string,
    messageId: string,
    status: MessageStatus
  ): ProtocolMessage {
    return this.createMessage(
      MessageType.ACK,
      sender,
      receiver,
      {
        data: {
          messageId,
          status,
        },
      },
      { priority: MessagePriority.HIGH }
    );
  }

  /**
   * Validate a message
   */
  public validateMessage(message: ProtocolMessage): ValidationResult {
    const errors: string[] = [];

    // Validate header
    if (!message.header) {
      errors.push('Message header is missing');
      return { valid: false, errors };
    }

    // Validate required header fields
    if (!message.header.id) errors.push('Message ID is required');
    if (!message.header.type) errors.push('Message type is required');
    if (!message.header.sender) errors.push('Sender is required');
    if (!message.header.receiver) errors.push('Receiver is required');
    if (!message.header.timestamp) errors.push('Timestamp is required');

    // Validate message type
    if (this.config.validation.allowedMessageTypes && !this.config.validation.allowedMessageTypes.includes(message.header.type)) {
      errors.push(`Message type ${message.header.type} is not allowed`);
    }

    // Validate sender/receiver if access control is enabled
    if (this.config.security.allowedSenders && this.config.security.allowedSenders.length > 0) {
      if (!this.config.security.allowedSenders.includes(message.header.sender)) {
        errors.push(`Sender ${message.header.sender} is not allowed`);
      }
    }

    if (this.config.security.allowedReceivers && this.config.security.allowedReceivers.length > 0) {
      const receivers = Array.isArray(message.header.receiver)
        ? message.header.receiver
        : [message.header.receiver];

      for (const receiver of receivers) {
        if (!this.config.security.allowedReceivers.includes(receiver)) {
          errors.push(`Receiver ${receiver} is not allowed`);
        }
      }
    }

    // Validate message size
    const messageSize = JSON.stringify(message).length;
    if (this.config.validation.maxMessageSize && messageSize > this.config.validation.maxMessageSize) {
      errors.push(
        `Message size ${messageSize} exceeds maximum ${this.config.validation.maxMessageSize}`
      );
    }

    // Validate TTL
    if (message.header.ttl && message.header.ttl < 0) {
      errors.push('TTL must be positive');
    }

    // Validate signature if enabled
    if (this.config.security.enableSignature && message.header.signature) {
      if (!this.verifySignature(message)) {
        errors.push('Message signature verification failed');
      }
    }

    // Validate body based on message type
    if (message.header.type === MessageType.REQUEST && !message.body.action) {
      errors.push('Request message must have an action');
    }

    if (message.header.type === MessageType.ERROR && !message.body.error) {
      errors.push('Error message must have error details');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if message has expired
   */
  public isMessageExpired(message: ProtocolMessage): boolean {
    if (!message.header.ttl) {
      return false;
    }

    const now = Date.now();
    const messageTime = new Date(message.header.timestamp).getTime();
    return now - messageTime > message.header.ttl;
  }

  /**
   * Encrypt message body
   */
  public encryptMessage(message: ProtocolMessage): ProtocolMessage {
    if (!this.config.encryption.enabled || !this.encryptionKey) {
      return message;
    }

    try {
      const iv = crypto.randomBytes(16);
      const algorithm = this.config.encryption.algorithm || 'aes-256-gcm';
      const cipher = crypto.createCipheriv(
        algorithm,
        this.encryptionKey,
        iv
      );

      const bodyString = JSON.stringify(message.body);
      let encrypted = cipher.update(bodyString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = (cipher as any).getAuthTag().toString('hex');

      return {
        header: {
          ...message.header,
          encrypted: true,
        },
        body: {
          data: {
            encrypted,
            iv: iv.toString('hex'),
            authTag,
          },
        },
      };
    } catch (error) {
      this.emit('encryption:error', { message, error });
      throw new Error(`Failed to encrypt message: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt message body
   */
  public decryptMessage(message: ProtocolMessage): ProtocolMessage {
    if (!message.header.encrypted || !this.encryptionKey) {
      return message;
    }

    try {
      const { encrypted, iv, authTag } = message.body.data;

      const algorithm = this.config.encryption.algorithm || 'aes-256-gcm';
      const decipher = crypto.createDecipheriv(
        algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );

      (decipher as any).setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        header: message.header,
        body: JSON.parse(decrypted),
      };
    } catch (error) {
      this.emit('decryption:error', { message, error });
      throw new Error(`Failed to decrypt message: ${(error as Error).message}`);
    }
  }

  /**
   * Sign a message
   */
  private signMessage(header: MessageHeader, body: MessageBody): string {
    const data = JSON.stringify({ header, body });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify message signature
   */
  private verifySignature(message: ProtocolMessage): boolean {
    if (!message.header.signature) {
      return false;
    }

    const expectedSignature = this.signMessage(message.header, message.body);
    return message.header.signature === expectedSignature;
  }

  /**
   * Check rate limit for sender
   */
  public checkRateLimit(sender: string): boolean {
    if (!this.config.rateLimit.enabled) {
      return true;
    }

    const now = Date.now();
    const tracker = this.rateLimitTrackers.get(sender);

    if (!tracker || now > tracker.resetTime) {
      // Reset or create new tracker
      this.rateLimitTrackers.set(sender, {
        count: 1,
        resetTime: now + 1000, // 1 second window
      });
      return true;
    }

    // Check if limit exceeded
    const maxMessages = this.config.rateLimit.maxMessagesPerSecond || 100;
    if (tracker.count >= maxMessages) {
      this.emit('rateLimit:exceeded', { sender, count: tracker.count });
      return false;
    }

    // Increment counter
    tracker.count++;
    return true;
  }

  /**
   * Track pending message
   */
  public trackMessage(message: ProtocolMessage): void {
    this.pendingMessages.set(message.header.id, message);
    this.messageHistory.set(message.header.id, message);

    // Set up TTL cleanup if specified
    if (message.header.ttl) {
      setTimeout(() => {
        if (this.pendingMessages.has(message.header.id)) {
          this.pendingMessages.delete(message.header.id);
          this.emit('message:expired', message);
        }
      }, message.header.ttl);
    }
  }

  /**
   * Record message acknowledgment
   */
  public recordAck(messageId: string, ack: MessageAck): void {
    this.acknowledgments.set(messageId, ack);
    this.pendingMessages.delete(messageId);
    this.emit('message:acknowledged', { messageId, ack });
  }

  /**
   * Get pending messages
   */
  public getPendingMessages(): ProtocolMessage[] {
    return Array.from(this.pendingMessages.values());
  }

  /**
   * Get message by ID
   */
  public getMessage(messageId: string): ProtocolMessage | undefined {
    return this.messageHistory.get(messageId);
  }

  /**
   * Get acknowledgment for message
   */
  public getAck(messageId: string): MessageAck | undefined {
    return this.acknowledgments.get(messageId);
  }

  /**
   * Clear message history
   */
  public clearHistory(): void {
    this.messageHistory.clear();
    this.acknowledgments.clear();
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate correlation ID for request-response tracking
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Serialize message to JSON
   */
  public serializeMessage(message: ProtocolMessage): string {
    return JSON.stringify(message, (key, value) => {
      if (key === 'timestamp' && value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
  }

  /**
   * Deserialize message from JSON
   */
  public deserializeMessage(data: string): ProtocolMessage {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      header: {
        ...parsed.header,
        timestamp: new Date(parsed.header.timestamp),
      },
    };
  }

  /**
   * Get protocol statistics
   */
  public getStats(): {
    pendingMessages: number;
    totalMessages: number;
    acknowledgedMessages: number;
    rateLimitTrackers: number;
  } {
    return {
      pendingMessages: this.pendingMessages.size,
      totalMessages: this.messageHistory.size,
      acknowledgedMessages: this.acknowledgments.size,
      rateLimitTrackers: this.rateLimitTrackers.size,
    };
  }
}

export default CommunicationProtocol;
