# Agent Communication Protocol

## Overview

The Agent Communication Protocol provides a robust, reliable messaging system for agent-to-agent communication in the multi-agent development environment. It implements a complete communication stack with message routing, queue integration, and reliability features.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                  (Agents using protocol)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Message Queue Adapter                           │
│  - Message delivery coordination                             │
│  - Retry logic with exponential backoff                      │
│  - Message deduplication                                     │
│  - Dead letter queue handling                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────┬──────────────────────────────────────┐
│   Message Router     │    Communication Protocol             │
│  - Agent discovery   │  - Message structure                  │
│  - Route management  │  - Validation                         │
│  - Message filtering │  - Encryption (optional)              │
│  - Broadcasting      │  - Rate limiting                      │
└──────────────────────┴──────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Redis Message Queue                        │
│              (Pub/Sub + Persistence)                         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Communication Protocol (`communication-protocol.ts`)

The core protocol layer that defines message structure and handles:

- **Message Types**: REQUEST, RESPONSE, BROADCAST, NOTIFICATION, ERROR, ACK, HEARTBEAT
- **Message Validation**: Ensures message integrity and correctness
- **Message Encryption**: Optional AES-256-GCM encryption
- **Rate Limiting**: Prevents message flooding
- **Message Tracking**: Tracks pending messages and acknowledgments
- **Correlation IDs**: Links requests with responses

### 2. Message Router (`message-router.ts`)

Handles intelligent message routing with:

- **Agent Registration**: Register/unregister agents dynamically
- **Agent Discovery**: Find agents by capability or role
- **Direct Messaging**: Point-to-point message delivery
- **Broadcasting**: One-to-many message distribution
- **Message Filtering**: Filter messages by type, sender, priority, or custom logic
- **Heartbeat Monitoring**: Detect offline agents automatically

### 3. Message Queue Adapter (`message-queue-adapter.ts`)

Bridges the protocol with Redis queue infrastructure:

- **Queue Integration**: Seamless Redis pub/sub integration
- **Retry Logic**: Exponential backoff for failed deliveries
- **Deduplication**: Prevents duplicate message processing
- **Dead Letter Queue**: Handles permanently failed messages
- **Persistence**: Optional message persistence with TTL
- **Health Monitoring**: Queue and adapter health checks

## Message Structure

### Message Header
```typescript
{
  id: string;                    // Unique message ID
  type: MessageType;             // Message type
  version: string;               // Protocol version
  timestamp: Date;               // Creation timestamp
  sender: string;                // Sender agent name
  receiver: string | string[];   // Receiver(s)
  correlationId?: string;        // For request-response tracking
  replyTo?: string;              // Response routing
  priority: MessagePriority;     // Message priority (0-3)
  ttl?: number;                  // Time to live (ms)
  encrypted?: boolean;           // Encryption flag
  signature?: string;            // Message signature
}
```

### Message Body
```typescript
{
  action?: string;               // Action to perform (requests)
  data?: any;                    // Message payload
  error?: {                      // Error details (error messages)
    code: string;
    message: string;
    details?: any;
  };
  metadata?: Record<string, any>; // Additional metadata
}
```

## Usage Examples

### Basic Setup

```typescript
import {
  MessageQueueAdapter,
  CommunicationProtocol,
  MessageRouter,
  MessageType,
  MessagePriority,
} from './coordination';

// Initialize adapter
const adapter = new MessageQueueAdapter({
  queue: {
    redis: {
      host: 'localhost',
      port: 6379,
    },
    queue: {
      prefix: 'agent:queue',
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

// Initialize
await adapter.initialize();
```

### Register Agents

```typescript
const router = adapter.getRouter();

// Register backend agent
router.registerAgent({
  name: 'backend-agent',
  role: 'backend_developer',
  capabilities: ['api', 'database', 'backend'],
  status: 'online',
  lastSeen: new Date(),
});

// Register frontend agent
router.registerAgent({
  name: 'frontend-agent',
  role: 'frontend_developer',
  capabilities: ['ui', 'components', 'frontend'],
  status: 'online',
  lastSeen: new Date(),
});
```

### Send Messages

```typescript
const protocol = adapter.getProtocol();

// Send a request
const requestMessage = protocol.createRequest(
  'backend-agent',
  'frontend-agent',
  'generate_component',
  {
    componentName: 'UserProfile',
    props: ['userId', 'showAvatar'],
  },
  {
    priority: MessagePriority.HIGH,
    ttl: 30000, // 30 seconds
  }
);

await adapter.sendMessage(requestMessage);

// Send a response
const responseMessage = protocol.createResponse(
  'frontend-agent',
  'backend-agent',
  requestMessage.header.correlationId!,
  {
    componentCode: '...',
    success: true,
  }
);

await adapter.sendMessage(responseMessage);

// Send a broadcast
const broadcastMessage = protocol.createBroadcast(
  'team-lead-agent',
  ['backend-agent', 'frontend-agent', 'qa-agent'],
  {
    announcement: 'New sprint started',
    sprintId: 'sprint-42',
  }
);

await adapter.sendMessage(broadcastMessage);
```

### Subscribe to Messages

```typescript
// Subscribe to messages
await adapter.subscribe('backend-agent', async (message) => {
  console.log('Received message:', message);

  if (message.header.type === MessageType.REQUEST) {
    // Handle request
    const action = message.body.action;
    const data = message.body.data;

    // Process and send response
    const response = protocol.createResponse(
      'backend-agent',
      message.header.sender,
      message.header.correlationId!,
      { result: 'processed' }
    );

    await adapter.sendMessage(response);
  }
});
```

### Message Filtering

```typescript
// Add route with filter
router.addRoute(
  'backend-agent',
  async (message) => {
    console.log('High priority message:', message);
  },
  {
    types: [MessageType.REQUEST],
    priorities: [MessagePriority.HIGH, MessagePriority.CRITICAL],
    actions: ['urgent_task', 'critical_fix'],
  },
  10 // Route priority
);

// Custom filter
router.addRoute(
  'backend-agent',
  async (message) => {
    console.log('Database-related message:', message);
  },
  {
    customFilter: (msg) => {
      return msg.body.data?.category === 'database';
    },
  }
);
```

### Agent Discovery

```typescript
// Find agents by capability
const codeAgents = router.discoverAgents('code');
console.log('Agents that can code:', codeAgents);

// Find agents by role
const testers = router.discoverAgentsByRole('qa_tester');
console.log('QA testers:', testers);

// Get all online agents
const onlineAgents = router.getOnlineAgents();
console.log('Online agents:', onlineAgents);
```

### Error Handling

```typescript
// Send error message
const errorMessage = protocol.createError(
  'backend-agent',
  'frontend-agent',
  {
    code: 'VALIDATION_ERROR',
    message: 'Invalid component props',
    details: {
      invalidProps: ['invalidProp1'],
    },
  },
  requestMessage.header.correlationId
);

await adapter.sendMessage(errorMessage);

// Handle errors
adapter.on('send:error', ({ message, error }) => {
  console.error('Failed to send message:', error);
});

adapter.on('delivery:failed', ({ message, agentName, error }) => {
  console.error('Message delivery failed:', error);
});
```

### Monitoring and Statistics

```typescript
// Get adapter statistics
const stats = adapter.getStats();
console.log('Adapter stats:', {
  sent: stats.messagesSent,
  received: stats.messagesReceived,
  delivered: stats.messagesDelivered,
  failed: stats.messagesFailed,
  retried: stats.messagesRetried,
  deduplicated: stats.messagesDeduplicated,
  avgDeliveryTime: stats.averageDeliveryTime,
});

// Get router statistics
const routerStats = router.getStats();
console.log('Router stats:', routerStats);

// Get protocol statistics
const protocolStats = protocol.getStats();
console.log('Protocol stats:', protocolStats);

// Health check
const health = await adapter.healthCheck();
console.log('Adapter health:', health);
```

### Dead Letter Queue

```typescript
// Get failed messages
const dlqMessages = await adapter.getDeadLetterQueue();
console.log('Failed messages:', dlqMessages);

// Retry failed messages
for (const message of dlqMessages) {
  try {
    await adapter.sendMessage(message);
  } catch (error) {
    console.error('Retry failed:', error);
  }
}

// Clear DLQ
await adapter.clearDeadLetterQueue();
```

### Cleanup

```typescript
// Unsubscribe
await adapter.unsubscribe('backend-agent');

// Unregister agent
router.unregisterAgent('backend-agent');

// Shutdown adapter
await adapter.shutdown();
```

## Configuration Options

### Protocol Configuration

```typescript
{
  version: '1.0.0',
  encryption: {
    enabled: false,
    algorithm: 'aes-256-gcm',
    key: 'hex-encoded-key',
  },
  validation: {
    strictMode: true,
    maxMessageSize: 1024 * 1024, // 1MB
    allowedMessageTypes: [MessageType.REQUEST, MessageType.RESPONSE],
  },
  rateLimit: {
    enabled: true,
    maxMessagesPerSecond: 100,
    maxMessagesPerMinute: 1000,
  },
  reliability: {
    enableAck: true,
    ackTimeout: 5000,
    maxRetries: 3,
    retryDelay: 1000,
  },
  security: {
    enableSignature: false,
    allowedSenders: ['agent1', 'agent2'],
    allowedReceivers: ['agent3', 'agent4'],
  },
}
```

### Router Configuration

```typescript
{
  enableDiscovery: true,
  enableFiltering: true,
  maxRoutesPerAgent: 10,
  routingTimeout: 5000,
  heartbeatInterval: 30000,
  agentTimeout: 60000,
}
```

### Adapter Configuration

```typescript
{
  queue: {
    redis: {
      host: 'localhost',
      port: 6379,
      password: 'optional',
      db: 0,
    },
    queue: {
      prefix: 'agent:queue',
      maxRetries: 3,
      retryDelay: 1000,
      deadLetterQueueEnabled: true,
      messageTimeout: 30000,
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
  persistence: {
    enabled: true,
    ttl: 3600000, // 1 hour
  },
}
```

## Events

### Adapter Events

- `initialized` - Adapter initialized successfully
- `shutdown` - Adapter shut down
- `message:sent` - Message sent successfully
- `message:acknowledged` - Message acknowledged
- `message:expired` - Message expired
- `message:duplicate` - Duplicate message detected
- `delivery:success` - Message delivered successfully
- `delivery:failed` - Message delivery failed
- `message:retried` - Message retry attempted
- `send:error` - Error sending message
- `validation:error` - Message validation failed

### Router Events

- `agent:registered` - Agent registered
- `agent:unregistered` - Agent unregistered
- `agent:status:changed` - Agent status changed
- `agent:timeout` - Agent timed out
- `message:routed` - Message routed successfully
- `message:delivered` - Message delivered to route
- `message:filtered` - Message filtered out
- `routing:error` - Routing error
- `delivery:error` - Delivery error

### Protocol Events

- `message:acknowledged` - Message acknowledged
- `message:expired` - Message expired
- `rateLimit:exceeded` - Rate limit exceeded
- `encryption:error` - Encryption error
- `decryption:error` - Decryption error

## Best Practices

1. **Always initialize the adapter** before sending messages
2. **Register agents** before routing messages to them
3. **Use correlation IDs** for request-response patterns
4. **Set appropriate TTLs** for time-sensitive messages
5. **Use message priorities** to ensure critical messages are processed first
6. **Implement error handlers** for all event types
7. **Monitor statistics** to track system health
8. **Clean up resources** by unsubscribing and shutting down properly
9. **Use message filtering** to reduce unnecessary processing
10. **Enable deduplication** to prevent duplicate processing

## Testing

Run the test suite:

```bash
npm test tests/coordination/communication-protocol.test.ts
```

Test coverage target: 85%+

## Performance Considerations

- **Message Size**: Keep messages under 1MB for optimal performance
- **Rate Limiting**: Default 100 messages/second per sender
- **Retry Strategy**: Exponential backoff prevents queue overload
- **Deduplication Window**: 60 seconds default, adjust based on needs
- **Heartbeat Interval**: 30 seconds default for agent monitoring
- **Connection Pooling**: Redis connection pool managed by queue

## Security

- **Optional Encryption**: AES-256-GCM for sensitive data
- **Message Signatures**: SHA-256 signatures for verification
- **Access Control**: Whitelist allowed senders/receivers
- **Rate Limiting**: Prevents DoS attacks
- **Message Validation**: Strict validation prevents malformed messages

## Troubleshooting

### Messages not being delivered

1. Check if receiver agent is registered and online
2. Verify Redis connection is active
3. Check message validation errors
4. Review message filters on routes

### High message failure rate

1. Check Redis connection stability
2. Review retry configuration
3. Check agent availability
4. Monitor dead letter queue

### Performance issues

1. Reduce message size
2. Adjust rate limits
3. Optimize message filters
4. Check Redis performance

## Future Enhancements

- [ ] Message compression for large payloads
- [ ] Priority queues for critical messages
- [ ] Message batching for efficiency
- [ ] Advanced routing algorithms
- [ ] Message transformation middleware
- [ ] Distributed tracing integration
- [ ] Metrics export (Prometheus)
- [ ] WebSocket support for real-time updates

## License

Part of the AI Agent Team Development Application - Week 4 Implementation