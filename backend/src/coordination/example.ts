/**
 * Communication Protocol Example Usage
 *
 * Demonstrates how to use the agent communication protocol
 * for multi-agent coordination.
 *
 * Architecture: Phase 2 - Multi-Agent Coordination
 * Task: Task 21 - Agent Communication Protocol (Week 4)
 *
 * @module coordination/example
 */

import {
  MessageQueueAdapter,
  MessageType,
  MessagePriority,
  type ProtocolMessage,
} from './index';

/**
 * Example: Basic Agent Communication
 */
async function basicCommunicationExample() {
  console.log('=== Basic Communication Example ===\n');

  // Initialize the adapter
  const adapter = new MessageQueueAdapter({
    queue: {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      queue: {
        prefix: 'example:agent',
        maxRetries: 3,
        deadLetterQueueEnabled: true,
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
  });

  try {
    // Initialize
    await adapter.initialize();
    console.log('✓ Adapter initialized\n');

    // Get router and protocol
    const router = adapter.getRouter();
    const protocol = adapter.getProtocol();

    // Register agents
    router.registerAgent({
      name: 'backend-agent',
      role: 'backend_developer',
      capabilities: ['api', 'database', 'backend'],
      status: 'online',
      lastSeen: new Date(),
    });

    router.registerAgent({
      name: 'frontend-agent',
      role: 'frontend_developer',
      capabilities: ['ui', 'components', 'frontend'],
      status: 'online',
      lastSeen: new Date(),
    });

    console.log('✓ Agents registered\n');

    // Subscribe to messages
    await adapter.subscribe('backend-agent', async (message: ProtocolMessage) => {
      console.log(`[Backend Agent] Received ${message.header.type}:`, {
        from: message.header.sender,
        action: message.body.action,
        data: message.body.data,
      });

      // Send response if it's a request
      if (message.header.type === MessageType.REQUEST) {
        const response = protocol.createResponse(
          'backend-agent',
          message.header.sender,
          message.header.correlationId!,
          {
            status: 'completed',
            result: 'API endpoint created successfully',
          }
        );

        await adapter.sendMessage(response);
        console.log('[Backend Agent] Sent response\n');
      }
    });

    await adapter.subscribe('frontend-agent', async (message: ProtocolMessage) => {
      console.log(`[Frontend Agent] Received ${message.header.type}:`, {
        from: message.header.sender,
        action: message.body.action,
        data: message.body.data,
      });

      // Send response if it's a request
      if (message.header.type === MessageType.REQUEST) {
        const response = protocol.createResponse(
          'frontend-agent',
          message.header.sender,
          message.header.correlationId!,
          {
            status: 'completed',
            result: 'Component created successfully',
          }
        );

        await adapter.sendMessage(response);
        console.log('[Frontend Agent] Sent response\n');
      }
    });

    console.log('✓ Subscriptions active\n');

    // Send a request from frontend to backend
    const requestMessage = protocol.createRequest(
      'frontend-agent',
      'backend-agent',
      'create_api_endpoint',
      {
        endpoint: '/api/users',
        method: 'GET',
        description: 'Get all users',
      },
      {
        priority: MessagePriority.HIGH,
        ttl: 30000,
      }
    );

    console.log('[Frontend Agent] Sending request to backend...\n');
    await adapter.sendMessage(requestMessage);

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Send a notification
    const notification = protocol.createNotification(
      'backend-agent',
      'frontend-agent',
      {
        event: 'database_updated',
        details: 'User table schema updated',
      }
    );

    console.log('[Backend Agent] Sending notification...\n');
    await adapter.sendMessage(notification);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Show statistics
    const stats = adapter.getStats();
    console.log('Statistics:', {
      sent: stats.messagesSent,
      received: stats.messagesReceived,
      delivered: stats.messagesDelivered,
      avgDeliveryTime: `${stats.averageDeliveryTime.toFixed(2)}ms`,
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await adapter.shutdown();
    console.log('\n✓ Adapter shut down');
  }
}

/**
 * Example: Broadcasting Messages
 */
async function broadcastExample() {
  console.log('\n=== Broadcast Example ===\n');

  const adapter = new MessageQueueAdapter({
    queue: {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      queue: {
        prefix: 'example:broadcast',
      },
    },
  });

  try {
    await adapter.initialize();

    const router = adapter.getRouter();
    const protocol = adapter.getProtocol();

    // Register multiple agents
    const agents = ['backend-agent', 'frontend-agent', 'qa-agent', 'devops-agent'];

    for (const agentName of agents) {
      router.registerAgent({
        name: agentName,
        role: agentName.replace('-agent', ''),
        capabilities: ['development'],
        status: 'online',
        lastSeen: new Date(),
      });

      await adapter.subscribe(agentName, async (message: ProtocolMessage) => {
        console.log(`[${agentName}] Received broadcast:`, message.body.data);
      });
    }

    console.log('✓ All agents registered and subscribed\n');

    // Send broadcast
    const broadcast = protocol.createBroadcast(
      'team-lead-agent',
      agents,
      {
        announcement: 'Sprint 42 has started!',
        sprintGoals: ['Implement feature X', 'Fix bug Y', 'Optimize Z'],
        deadline: '2026-04-30',
      },
      {
        priority: MessagePriority.HIGH,
      }
    );

    console.log('[Team Lead] Broadcasting to all agents...\n');
    await adapter.sendMessage(broadcast);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('\n✓ Broadcast delivered to all agents');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await adapter.shutdown();
  }
}

/**
 * Example: Message Filtering
 */
async function filteringExample() {
  console.log('\n=== Message Filtering Example ===\n');

  const adapter = new MessageQueueAdapter({
    queue: {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      queue: {
        prefix: 'example:filtering',
      },
    },
  });

  try {
    await adapter.initialize();

    const router = adapter.getRouter();
    const protocol = adapter.getProtocol();

    // Register agent
    router.registerAgent({
      name: 'backend-agent',
      role: 'backend_developer',
      capabilities: ['api', 'database'],
      status: 'online',
      lastSeen: new Date(),
    });

    // Add route with filter for high-priority messages only
    router.addRoute(
      'backend-agent',
      async (message: ProtocolMessage) => {
        console.log('[Backend Agent] High-priority message received:', {
          action: message.body.action,
          priority: message.header.priority,
        });
      },
      {
        types: [MessageType.REQUEST],
        priorities: [MessagePriority.HIGH, MessagePriority.CRITICAL],
      },
      10 // Route priority
    );

    // Add route with custom filter for database-related messages
    router.addRoute(
      'backend-agent',
      async (message: ProtocolMessage) => {
        console.log('[Backend Agent] Database message received:', {
          action: message.body.action,
          category: message.body.data?.category,
        });
      },
      {
        customFilter: (msg) => msg.body.data?.category === 'database',
      },
      5
    );

    console.log('✓ Routes with filters configured\n');

    // Send messages with different priorities
    const messages = [
      protocol.createRequest('frontend-agent', 'backend-agent', 'low_priority_task', {
        category: 'general',
      }),
      protocol.createRequest(
        'frontend-agent',
        'backend-agent',
        'high_priority_task',
        { category: 'general' },
        { priority: MessagePriority.HIGH }
      ),
      protocol.createRequest('frontend-agent', 'backend-agent', 'database_task', {
        category: 'database',
      }),
    ];

    console.log('Sending messages with different priorities and categories...\n');

    for (const message of messages) {
      await adapter.sendMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const routerStats = router.getStats();
    console.log('\nRouting stats:', {
      totalRouted: routerStats.totalRouted,
      filtered: routerStats.filtered,
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await adapter.shutdown();
  }
}

/**
 * Example: Agent Discovery
 */
async function discoveryExample() {
  console.log('\n=== Agent Discovery Example ===\n');

  const adapter = new MessageQueueAdapter({
    queue: {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      queue: {
        prefix: 'example:discovery',
      },
    },
  });

  try {
    await adapter.initialize();

    const router = adapter.getRouter();

    // Register agents with different capabilities
    router.registerAgent({
      name: 'backend-agent-1',
      role: 'backend_developer',
      capabilities: ['api', 'database', 'nodejs'],
      status: 'online',
      lastSeen: new Date(),
    });

    router.registerAgent({
      name: 'backend-agent-2',
      role: 'backend_developer',
      capabilities: ['api', 'microservices', 'python'],
      status: 'online',
      lastSeen: new Date(),
    });

    router.registerAgent({
      name: 'frontend-agent',
      role: 'frontend_developer',
      capabilities: ['ui', 'react', 'typescript'],
      status: 'online',
      lastSeen: new Date(),
    });

    router.registerAgent({
      name: 'qa-agent',
      role: 'qa_tester',
      capabilities: ['testing', 'automation'],
      status: 'online',
      lastSeen: new Date(),
    });

    console.log('✓ Agents registered\n');

    // Discover agents by capability
    console.log('Finding agents with "api" capability:');
    const apiAgents = router.discoverAgents('api');
    apiAgents.forEach((agent) => {
      console.log(`  - ${agent.name} (${agent.role})`);
    });

    console.log('\nFinding agents with "testing" capability:');
    const testAgents = router.discoverAgents('testing');
    testAgents.forEach((agent) => {
      console.log(`  - ${agent.name} (${agent.role})`);
    });

    // Discover agents by role
    console.log('\nFinding backend developers:');
    const backendDevs = router.discoverAgentsByRole('backend_developer');
    backendDevs.forEach((agent) => {
      console.log(`  - ${agent.name} (capabilities: ${agent.capabilities.join(', ')})`);
    });

    // Get all online agents
    console.log('\nAll online agents:');
    const onlineAgents = router.getOnlineAgents();
    onlineAgents.forEach((agent) => {
      console.log(`  - ${agent.name} (${agent.role})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await adapter.shutdown();
  }
}

/**
 * Example: Error Handling and Retry
 */
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===\n');

  const adapter = new MessageQueueAdapter({
    queue: {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      queue: {
        prefix: 'example:error',
      },
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
    },
  });

  try {
    await adapter.initialize();

    const protocol = adapter.getProtocol();

    // Set up event listeners
    adapter.on('send:error', ({ message, error }) => {
      console.log('[Error] Failed to send message:', error.message);
    });

    adapter.on('message:retried', ({ message, attempt }) => {
      console.log(`[Retry] Attempt ${attempt} for message ${message.header.id}`);
    });

    adapter.on('delivery:failed', ({ message, error }) => {
      console.log('[Failed] Message delivery failed permanently:', error.message);
    });

    adapter.on('validation:error', ({ message, errors }) => {
      console.log('[Validation] Message validation failed:', errors);
    });

    // Send error message
    const errorMessage = protocol.createError(
      'backend-agent',
      'frontend-agent',
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid component props',
        details: {
          invalidProps: ['unknownProp'],
          validProps: ['userId', 'userName'],
        },
      }
    );

    console.log('Sending error message...\n');
    await adapter.sendMessage(errorMessage);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check dead letter queue
    const dlqMessages = await adapter.getDeadLetterQueue();
    console.log(`\nDead letter queue size: ${dlqMessages.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await adapter.shutdown();
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('Agent Communication Protocol Examples\n');
  console.log('=====================================\n');

  try {
    // Run examples sequentially
    await basicCommunicationExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await broadcastExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await filteringExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await discoveryExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await errorHandlingExample();

    console.log('\n=====================================');
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  basicCommunicationExample,
  broadcastExample,
  filteringExample,
  discoveryExample,
  errorHandlingExample,
};
