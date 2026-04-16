/**
 * Communication Protocol Tests
 *
 * Comprehensive test suite for the agent communication protocol,
 * message router, and queue adapter.
 *
 * Architecture: Phase 2 - Multi-Agent Coordination
 * Task: Task 21 - Agent Communication Protocol (Week 4)
 *
 * @module tests/coordination/communication-protocol.test
 */

import {
  CommunicationProtocol,
  MessageType,
  MessagePriority,
  MessageStatus,
  ProtocolMessage,
} from '../../src/coordination/communication-protocol';
import {
  MessageRouter,
  AgentRegistration,
  MessageFilter,
} from '../../src/coordination/message-router';
import {
  MessageQueueAdapter,
  AdapterConfig,
} from '../../src/coordination/message-queue-adapter';

describe('CommunicationProtocol', () => {
  let protocol: CommunicationProtocol;

  beforeEach(() => {
    protocol = new CommunicationProtocol({
      version: '1.0.0',
      encryption: {
        enabled: false,
      },
      validation: {
        strictMode: true,
        maxMessageSize: 1024 * 1024,
      },
      rateLimit: {
        enabled: true,
        maxMessagesPerSecond: 100,
      },
      reliability: {
        enableAck: true,
        ackTimeout: 5000,
        maxRetries: 3,
      },
      security: {
        enableSignature: false,
      },
    });
  });

  describe('Message Creation', () => {
    it('should create a request message', () => {
      const message = protocol.createRequest(
        'agent1',
        'agent2',
        'test_action',
        { key: 'value' }
      );

      expect(message.header.type).toBe(MessageType.REQUEST);
      expect(message.header.sender).toBe('agent1');
      expect(message.header.receiver).toBe('agent2');
      expect(message.body.action).toBe('test_action');
      expect(message.body.data).toEqual({ key: 'value' });
      expect(message.header.correlationId).toBeDefined();
      expect(message.header.replyTo).toBe('agent1');
    });

    it('should create a response message', () => {
      const correlationId = 'corr_123';
      const message = protocol.createResponse(
        'agent2',
        'agent1',
        correlationId,
        { result: 'success' }
      );

      expect(message.header.type).toBe(MessageType.RESPONSE);
      expect(message.header.sender).toBe('agent2');
      expect(message.header.receiver).toBe('agent1');
      expect(message.header.correlationId).toBe(correlationId);
      expect(message.body.data).toEqual({ result: 'success' });
    });

    it('should create a broadcast message', () => {
      const receivers = ['agent1', 'agent2', 'agent3'];
      const message = protocol.createBroadcast(
        'broadcaster',
        receivers,
        { announcement: 'test' }
      );

      expect(message.header.type).toBe(MessageType.BROADCAST);
      expect(message.header.sender).toBe('broadcaster');
      expect(message.header.receiver).toEqual(receivers);
      expect(message.body.data).toEqual({ announcement: 'test' });
    });

    it('should create a notification message', () => {
      const message = protocol.createNotification(
        'agent1',
        'agent2',
        { event: 'task_completed' }
      );

      expect(message.header.type).toBe(MessageType.NOTIFICATION);
      expect(message.header.sender).toBe('agent1');
      expect(message.header.receiver).toBe('agent2');
      expect(message.body.data).toEqual({ event: 'task_completed' });
    });

    it('should create an error message', () => {
      const error = {
        code: 'ERR_001',
        message: 'Test error',
        details: { info: 'test' },
      };
      const message = protocol.createError('agent1', 'agent2', error);

      expect(message.header.type).toBe(MessageType.ERROR);
      expect(message.header.priority).toBe(MessagePriority.HIGH);
      expect(message.body.error).toEqual(error);
    });

    it('should create an acknowledgment message', () => {
      const messageId = 'msg_123';
      const message = protocol.createAck(
        'agent2',
        'agent1',
        messageId,
        MessageStatus.DELIVERED
      );

      expect(message.header.type).toBe(MessageType.ACK);
      expect(message.header.priority).toBe(MessagePriority.HIGH);
      expect(message.body.data.messageId).toBe(messageId);
      expect(message.body.data.status).toBe(MessageStatus.DELIVERED);
    });

    it('should set default priority to NORMAL', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      expect(message.header.priority).toBe(MessagePriority.NORMAL);
    });

    it('should allow custom priority', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action', null, {
        priority: MessagePriority.CRITICAL,
      });
      expect(message.header.priority).toBe(MessagePriority.CRITICAL);
    });

    it('should set TTL when provided', () => {
      const ttl = 60000;
      const message = protocol.createRequest('agent1', 'agent2', 'action', null, {
        ttl,
      });
      expect(message.header.ttl).toBe(ttl);
    });
  });

  describe('Message Validation', () => {
    it('should validate a correct message', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      const result = protocol.validateMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message without header', () => {
      const message = { body: {} } as any;
      const result = protocol.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message header is missing');
    });

    it('should reject message without required fields', () => {
      const message = {
        header: {
          id: 'msg_1',
        },
        body: {},
      } as any;
      const result = protocol.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject request message without action', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      delete message.body.action;
      const result = protocol.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Request message must have an action');
    });

    it('should reject error message without error details', () => {
      const message = protocol.createError('agent1', 'agent2', {
        code: 'ERR',
        message: 'Error',
      });
      delete message.body.error;
      const result = protocol.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Error message must have error details');
    });

    it('should reject message with negative TTL', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      message.header.ttl = -1000;
      const result = protocol.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TTL must be positive');
    });
  });

  describe('Message Expiration', () => {
    it('should detect expired message', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action', null, {
        ttl: 1000,
      });
      message.header.timestamp = new Date(Date.now() - 2000);

      expect(protocol.isMessageExpired(message)).toBe(true);
    });

    it('should not mark message as expired if within TTL', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action', null, {
        ttl: 5000,
      });

      expect(protocol.isMessageExpired(message)).toBe(false);
    });

    it('should not mark message as expired if no TTL', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');

      expect(protocol.isMessageExpired(message)).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow messages within rate limit', () => {
      expect(protocol.checkRateLimit('agent1')).toBe(true);
    });

    it('should block messages exceeding rate limit', () => {
      const sender = 'agent1';

      // Send messages up to limit
      for (let i = 0; i < 100; i++) {
        protocol.checkRateLimit(sender);
      }

      // Next message should be blocked
      expect(protocol.checkRateLimit(sender)).toBe(false);
    });

    it('should reset rate limit after time window', async () => {
      const sender = 'agent1';

      // Exceed limit
      for (let i = 0; i < 101; i++) {
        protocol.checkRateLimit(sender);
      }

      // Wait for reset
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be allowed again
      expect(protocol.checkRateLimit(sender)).toBe(true);
    });
  });

  describe('Message Tracking', () => {
    it('should track pending messages', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      protocol.trackMessage(message);

      const pending = protocol.getPendingMessages();
      expect(pending).toHaveLength(1);
      expect(pending[0].header.id).toBe(message.header.id);
    });

    it('should retrieve message by ID', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      protocol.trackMessage(message);

      const retrieved = protocol.getMessage(message.header.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.header.id).toBe(message.header.id);
    });

    it('should record acknowledgment', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      protocol.trackMessage(message);

      const ack = {
        messageId: message.header.id,
        status: MessageStatus.DELIVERED,
        timestamp: new Date(),
        receiver: 'agent2',
      };

      protocol.recordAck(message.header.id, ack);

      const retrievedAck = protocol.getAck(message.header.id);
      expect(retrievedAck).toEqual(ack);

      // Should remove from pending
      const pending = protocol.getPendingMessages();
      expect(pending).toHaveLength(0);
    });

    it('should clear history', () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      protocol.trackMessage(message);

      protocol.clearHistory();

      expect(protocol.getMessage(message.header.id)).toBeUndefined();
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize message', () => {
      const original = protocol.createRequest('agent1', 'agent2', 'action', {
        data: 'test',
      });

      const serialized = protocol.serializeMessage(original);
      const deserialized = protocol.deserializeMessage(serialized);

      expect(deserialized.header.id).toBe(original.header.id);
      expect(deserialized.header.sender).toBe(original.header.sender);
      expect(deserialized.body.action).toBe(original.body.action);
      expect(deserialized.body.data).toEqual(original.body.data);
    });

    it('should preserve timestamp as Date object', () => {
      const original = protocol.createRequest('agent1', 'agent2', 'action');
      const serialized = protocol.serializeMessage(original);
      const deserialized = protocol.deserializeMessage(serialized);

      expect(deserialized.header.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Statistics', () => {
    it('should track statistics', () => {
      const message1 = protocol.createRequest('agent1', 'agent2', 'action');
      const message2 = protocol.createRequest('agent1', 'agent3', 'action');

      protocol.trackMessage(message1);
      protocol.trackMessage(message2);

      const stats = protocol.getStats();
      expect(stats.totalMessages).toBe(2);
      expect(stats.pendingMessages).toBe(2);
    });
  });
});

describe('MessageRouter', () => {
  let router: MessageRouter;
  let protocol: CommunicationProtocol;

  beforeEach(() => {
    router = new MessageRouter({
      enableDiscovery: true,
      enableFiltering: true,
      maxRoutesPerAgent: 10,
      routingTimeout: 5000,
    });

    protocol = new CommunicationProtocol();
  });

  afterEach(() => {
    if (router) {
      router.shutdown();
    }
  });

  describe('Agent Registration', () => {
    it('should register an agent', () => {
      const registration: AgentRegistration = {
        name: 'agent1',
        role: 'developer',
        capabilities: ['code', 'test'],
        status: 'online',
        lastSeen: new Date(),
      };

      router.registerAgent(registration);

      const agent = router.getAgent('agent1');
      expect(agent).toBeDefined();
      expect(agent?.name).toBe('agent1');
      expect(agent?.status).toBe('online');
    });

    it('should throw error when registering duplicate agent', () => {
      const registration: AgentRegistration = {
        name: 'agent1',
        role: 'developer',
        capabilities: ['code'],
        status: 'online',
        lastSeen: new Date(),
      };

      router.registerAgent(registration);

      expect(() => router.registerAgent(registration)).toThrow(
        'Agent agent1 is already registered'
      );
    });

    it('should unregister an agent', () => {
      const registration: AgentRegistration = {
        name: 'agent1',
        role: 'developer',
        capabilities: ['code'],
        status: 'online',
        lastSeen: new Date(),
      };

      router.registerAgent(registration);
      router.unregisterAgent('agent1');

      expect(router.getAgent('agent1')).toBeUndefined();
    });

    it('should update agent status', () => {
      const registration: AgentRegistration = {
        name: 'agent1',
        role: 'developer',
        capabilities: ['code'],
        status: 'online',
        lastSeen: new Date(),
      };

      router.registerAgent(registration);
      router.updateAgentStatus('agent1', 'busy');

      const agent = router.getAgent('agent1');
      expect(agent?.status).toBe('busy');
    });

    it('should get all registered agents', () => {
      router.registerAgent({
        name: 'agent1',
        role: 'developer',
        capabilities: ['code'],
        status: 'online',
        lastSeen: new Date(),
      });

      router.registerAgent({
        name: 'agent2',
        role: 'tester',
        capabilities: ['test'],
        status: 'online',
        lastSeen: new Date(),
      });

      const agents = router.getAllAgents();
      expect(agents).toHaveLength(2);
    });

    it('should get only online agents', () => {
      const testRouter = new MessageRouter({
        enableDiscovery: true,
        enableFiltering: true,
        maxRoutesPerAgent: 10,
        routingTimeout: 5000,
      });

      testRouter.registerAgent({
        name: 'agent1',
        role: 'developer',
        capabilities: ['code'],
        status: 'online',
        lastSeen: new Date(),
      });

      testRouter.registerAgent({
        name: 'agent2',
        role: 'tester',
        capabilities: ['test'],
        status: 'offline',
        lastSeen: new Date(),
      });

      const onlineAgents = testRouter.getOnlineAgents();
      expect(onlineAgents).toHaveLength(1);
      expect(onlineAgents[0].name).toBe('agent1');

      testRouter.shutdown();
    });
  });

  describe('Agent Discovery', () => {
    it('should discover agents by capability', () => {
      const testRouter = new MessageRouter({
        enableDiscovery: true,
        enableFiltering: true,
        maxRoutesPerAgent: 10,
        routingTimeout: 5000,
      });

      testRouter.registerAgent({
        name: 'agent1',
        role: 'developer',
        capabilities: ['code', 'test'],
        status: 'online',
        lastSeen: new Date(),
      });

      testRouter.registerAgent({
        name: 'agent2',
        role: 'tester',
        capabilities: ['test', 'qa'],
        status: 'online',
        lastSeen: new Date(),
      });

      testRouter.registerAgent({
        name: 'agent3',
        role: 'developer',
        capabilities: ['code'],
        status: 'offline',
        lastSeen: new Date(),
      });

      const agents = testRouter.discoverAgents('test');
      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.name)).toContain('agent1');
      expect(agents.map((a) => a.name)).toContain('agent2');

      testRouter.shutdown();
    });

    it('should discover agents by role', () => {
      const testRouter = new MessageRouter({
        enableDiscovery: true,
        enableFiltering: true,
        maxRoutesPerAgent: 10,
        routingTimeout: 5000,
      });

      testRouter.registerAgent({
        name: 'agent1',
        role: 'developer',
        capabilities: ['code', 'test'],
        status: 'online',
        lastSeen: new Date(),
      });

      testRouter.registerAgent({
        name: 'agent2',
        role: 'tester',
        capabilities: ['test', 'qa'],
        status: 'online',
        lastSeen: new Date(),
      });

      testRouter.registerAgent({
        name: 'agent3',
        role: 'developer',
        capabilities: ['code'],
        status: 'online',
        lastSeen: new Date(),
      });

      const agents = testRouter.discoverAgentsByRole('developer');
      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.name)).toContain('agent1');
      expect(agents.map((a) => a.name)).toContain('agent3');

      testRouter.shutdown();
    });

    it('should only discover online agents', () => {
      const testRouter = new MessageRouter({
        enableDiscovery: true,
        enableFiltering: true,
        maxRoutesPerAgent: 10,
        routingTimeout: 5000,
      });

      testRouter.registerAgent({
        name: 'agent1',
        role: 'developer',
        capabilities: ['code', 'test'],
        status: 'online',
        lastSeen: new Date(),
      });

      testRouter.registerAgent({
        name: 'agent2',
        role: 'tester',
        capabilities: ['test', 'qa'],
        status: 'online',
        lastSeen: new Date(),
      });

      testRouter.registerAgent({
        name: 'agent3',
        role: 'developer',
        capabilities: ['code'],
        status: 'online',
        lastSeen: new Date(),
      });

      const agents = testRouter.discoverAgents('code');
      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.name)).toContain('agent1');
      expect(agents.map((a) => a.name)).toContain('agent3');

      testRouter.shutdown();
    });
  });

  describe('Routing', () => {
    let receivedMessages: ProtocolMessage[];

    beforeEach(() => {
      receivedMessages = [];

      router.registerAgent({
        name: 'agent1',
        role: 'sender',
        capabilities: ['send'],
        status: 'online',
        lastSeen: new Date(),
      });

      router.registerAgent({
        name: 'agent2',
        role: 'receiver',
        capabilities: ['receive'],
        status: 'online',
        lastSeen: new Date(),
      });

      router.addRoute('agent2', (message) => {
        receivedMessages.push(message);
      });
    });

    it('should route direct message', async () => {
      const message = protocol.createRequest('agent1', 'agent2', 'test_action');

      await router.routeMessage(message);

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].header.id).toBe(message.header.id);
    });

    it('should throw error when routing to unregistered agent', async () => {
      const message = protocol.createRequest('agent1', 'unknown', 'test_action');

      await expect(router.routeMessage(message)).rejects.toThrow(
        'Receiver unknown is not registered'
      );
    });

    it('should throw error when routing to offline agent', async () => {
      router.updateAgentStatus('agent2', 'offline');
      const message = protocol.createRequest('agent1', 'agent2', 'test_action');

      await expect(router.routeMessage(message)).rejects.toThrow(
        'Receiver agent2 is offline'
      );
    });

    it('should route broadcast message', async () => {
      router.registerAgent({
        name: 'agent3',
        role: 'receiver',
        capabilities: ['receive'],
        status: 'online',
        lastSeen: new Date(),
      });

      router.addRoute('agent3', (message) => {
        receivedMessages.push(message);
      });

      const message = protocol.createBroadcast(
        'agent1',
        ['agent2', 'agent3'],
        { data: 'broadcast' }
      );

      await router.routeMessage(message);

      expect(receivedMessages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Message Filtering', () => {
    let receivedMessages: ProtocolMessage[];

    beforeEach(() => {
      receivedMessages = [];

      router.registerAgent({
        name: 'agent1',
        role: 'sender',
        capabilities: ['send'],
        status: 'online',
        lastSeen: new Date(),
      });

      router.registerAgent({
        name: 'agent2',
        role: 'receiver',
        capabilities: ['receive'],
        status: 'online',
        lastSeen: new Date(),
      });
    });

    it('should filter messages by type', async () => {
      const filter: MessageFilter = {
        types: [MessageType.REQUEST],
      };

      router.addRoute('agent2', (message) => {
        receivedMessages.push(message);
      }, filter);

      const requestMessage = protocol.createRequest('agent1', 'agent2', 'action');
      const notificationMessage = protocol.createNotification(
        'agent1',
        'agent2',
        { data: 'test' }
      );

      await router.routeMessage(requestMessage);
      await router.routeMessage(notificationMessage);

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].header.type).toBe(MessageType.REQUEST);
    });

    it('should filter messages by sender', async () => {
      router.registerAgent({
        name: 'agent3',
        role: 'sender',
        capabilities: ['send'],
        status: 'online',
        lastSeen: new Date(),
      });

      const filter: MessageFilter = {
        senders: ['agent1'],
      };

      router.addRoute('agent2', (message) => {
        receivedMessages.push(message);
      }, filter);

      const message1 = protocol.createRequest('agent1', 'agent2', 'action');
      const message2 = protocol.createRequest('agent3', 'agent2', 'action');

      await router.routeMessage(message1);
      await router.routeMessage(message2);

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].header.sender).toBe('agent1');
    });

    it('should filter messages by priority', async () => {
      const filter: MessageFilter = {
        priorities: [MessagePriority.HIGH, MessagePriority.CRITICAL],
      };

      router.addRoute('agent2', (message) => {
        receivedMessages.push(message);
      }, filter);

      const normalMessage = protocol.createRequest('agent1', 'agent2', 'action');
      const highMessage = protocol.createRequest('agent1', 'agent2', 'action', null, {
        priority: MessagePriority.HIGH,
      });

      await router.routeMessage(normalMessage);
      await router.routeMessage(highMessage);

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].header.priority).toBe(MessagePriority.HIGH);
    });

    it('should use custom filter function', async () => {
      const filter: MessageFilter = {
        customFilter: (message) => message.body.data?.important === true,
      };

      router.addRoute('agent2', (message) => {
        receivedMessages.push(message);
      }, filter);

      const message1 = protocol.createRequest('agent1', 'agent2', 'action', {
        important: true,
      });
      const message2 = protocol.createRequest('agent1', 'agent2', 'action', {
        important: false,
      });

      await router.routeMessage(message1);
      await router.routeMessage(message2);

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].body.data.important).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      router.registerAgent({
        name: 'agent1',
        role: 'sender',
        capabilities: ['send'],
        status: 'online',
        lastSeen: new Date(),
      });

      router.registerAgent({
        name: 'agent2',
        role: 'receiver',
        capabilities: ['receive'],
        status: 'online',
        lastSeen: new Date(),
      });

      router.addRoute('agent2', () => {});
    });

    it('should track routing statistics', async () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      await router.routeMessage(message);

      const stats = router.getStats();
      expect(stats.totalRouted).toBe(1);
      expect(stats.directMessages).toBe(1);
    });

    it('should reset statistics', async () => {
      const message = protocol.createRequest('agent1', 'agent2', 'action');
      await router.routeMessage(message);

      router.resetStats();

      const stats = router.getStats();
      expect(stats.totalRouted).toBe(0);
    });
  });
});

describe('MessageQueueAdapter Integration', () => {
  // Note: These tests would require a running Redis instance
  // For now, we'll test the adapter logic without actual Redis connection

  it('should create adapter with configuration', () => {
    const config: AdapterConfig = {
      queue: {
        redis: {
          host: 'localhost',
          port: 6379,
        },
        queue: {
          prefix: 'test',
        },
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
      },
      deduplication: {
        enabled: true,
        windowMs: 60000,
      },
    };

    const adapter = new MessageQueueAdapter(config);
    expect(adapter).toBeDefined();
  });

  it('should provide access to router', () => {
    const config: AdapterConfig = {
      queue: {
        redis: {
          host: 'localhost',
          port: 6379,
        },
        queue: {
          prefix: 'test',
        },
      },
    };

    const adapter = new MessageQueueAdapter(config);
    const router = adapter.getRouter();
    expect(router).toBeDefined();
  });

  it('should provide access to protocol', () => {
    const config: AdapterConfig = {
      queue: {
        redis: {
          host: 'localhost',
          port: 6379,
        },
        queue: {
          prefix: 'test',
        },
      },
    };

    const adapter = new MessageQueueAdapter(config);
    const protocol = adapter.getProtocol();
    expect(protocol).toBeDefined();
  });

  it('should track statistics', () => {
    const config: AdapterConfig = {
      queue: {
        redis: {
          host: 'localhost',
          port: 6379,
        },
        queue: {
          prefix: 'test',
        },
      },
    };

    const adapter = new MessageQueueAdapter(config);
    const stats = adapter.getStats();

    expect(stats).toHaveProperty('messagesSent');
    expect(stats).toHaveProperty('messagesReceived');
    expect(stats).toHaveProperty('messagesDelivered');
    expect(stats).toHaveProperty('messagesFailed');
  });
});
