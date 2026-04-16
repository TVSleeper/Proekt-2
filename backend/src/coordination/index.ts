/**
 * Coordination Module Index
 *
 * Exports all coordination-related modules for agent-to-agent communication.
 *
 * Architecture: Phase 2 - Multi-Agent Coordination
 * Task: Task 21 - Agent Communication Protocol (Week 4)
 *
 * @module coordination
 */

// Communication Protocol
export {
  CommunicationProtocol,
  MessageType,
  MessagePriority,
  MessageStatus,
  type MessageHeader,
  type MessageBody,
  type ProtocolMessage,
  type ValidationResult,
  type ProtocolConfig,
  type MessageAck,
} from './communication-protocol';

// Message Router
export {
  MessageRouter,
  type AgentRegistration,
  type MessageFilter,
  type Route,
  type RoutingStats,
  type RouterConfig,
} from './message-router';

// Message Queue Adapter
export {
  MessageQueueAdapter,
  type AdapterConfig,
  type DeliveryStatus,
  type AdapterStats,
} from './message-queue-adapter';

// Re-export queue types for convenience
export type { Message, QueueConfig, QueueStats } from '../messaging/queue';
