/**
 * Message Router
 *
 * Handles routing of messages between agents with support for:
 * - Direct messaging (point-to-point)
 * - Broadcasting (one-to-many)
 * - Agent discovery and registration
 * - Message filtering and subscription management
 * - Route optimization
 *
 * Architecture: Phase 2 - Multi-Agent Coordination
 * Task: Task 21 - Agent Communication Protocol (Week 4)
 *
 * @module coordination/message-router
 */

import { EventEmitter } from 'events';
import { ProtocolMessage, MessageType, MessagePriority } from './communication-protocol';

/**
 * Agent registration info
 */
export interface AgentRegistration {
  name: string;
  role: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  lastSeen: Date;
  metadata?: Record<string, any>;
}

/**
 * Message filter
 */
export interface MessageFilter {
  types?: MessageType[];
  senders?: string[];
  priorities?: MessagePriority[];
  actions?: string[];
  customFilter?: (message: ProtocolMessage) => boolean;
}

/**
 * Route entry
 */
export interface Route {
  agentName: string;
  handler: (message: ProtocolMessage) => void | Promise<void>;
  filter?: MessageFilter;
  priority: number;
}

/**
 * Routing statistics
 */
export interface RoutingStats {
  totalRouted: number;
  directMessages: number;
  broadcasts: number;
  filtered: number;
  failed: number;
  averageRoutingTime: number;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  enableDiscovery?: boolean;
  enableFiltering?: boolean;
  maxRoutesPerAgent?: number;
  routingTimeout?: number;
  heartbeatInterval?: number;
  agentTimeout?: number;
}

/**
 * Message Router Class
 *
 * Central routing system for agent communication.
 * Manages agent registration, message routing, and delivery.
 */
export class MessageRouter extends EventEmitter {
  private config: Required<RouterConfig>;
  private agents: Map<string, AgentRegistration>;
  private routes: Map<string, Route[]>;
  private stats: RoutingStats;
  private heartbeatInterval?: NodeJS.Timeout;
  private routingTimes: number[];

  constructor(config: RouterConfig = {}) {
    super();

    this.config = {
      enableDiscovery: config.enableDiscovery ?? true,
      enableFiltering: config.enableFiltering ?? true,
      maxRoutesPerAgent: config.maxRoutesPerAgent || 10,
      routingTimeout: config.routingTimeout || 5000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      agentTimeout: config.agentTimeout || 60000,
    };

    this.agents = new Map();
    this.routes = new Map();
    this.routingTimes = [];

    this.stats = {
      totalRouted: 0,
      directMessages: 0,
      broadcasts: 0,
      filtered: 0,
      failed: 0,
      averageRoutingTime: 0,
    };

    // Start heartbeat monitoring if enabled
    if (this.config.enableDiscovery) {
      this.startHeartbeatMonitoring();
    }
  }

  /**
   * Register an agent
   */
  public registerAgent(registration: AgentRegistration): void {
    if (this.agents.has(registration.name)) {
      throw new Error(`Agent ${registration.name} is already registered`);
    }

    this.agents.set(registration.name, {
      ...registration,
      lastSeen: new Date(),
    });

    this.emit('agent:registered', registration);
  }

  /**
   * Unregister an agent
   */
  public unregisterAgent(agentName: string): void {
    if (!this.agents.has(agentName)) {
      throw new Error(`Agent ${agentName} is not registered`);
    }

    this.agents.delete(agentName);
    this.routes.delete(agentName);

    this.emit('agent:unregistered', { agentName });
  }

  /**
   * Update agent status
   */
  public updateAgentStatus(
    agentName: string,
    status: 'online' | 'offline' | 'busy'
  ): void {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} is not registered`);
    }

    agent.status = status;
    agent.lastSeen = new Date();

    this.emit('agent:status:changed', { agentName, status });
  }

  /**
   * Get agent by name
   */
  public getAgent(agentName: string): AgentRegistration | undefined {
    return this.agents.get(agentName);
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): AgentRegistration[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get online agents
   */
  public getOnlineAgents(): AgentRegistration[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.status === 'online'
    );
  }

  /**
   * Discover agents by capability
   */
  public discoverAgents(capability: string): AgentRegistration[] {
    if (!this.config.enableDiscovery) {
      return [];
    }

    return Array.from(this.agents.values()).filter(
      (agent) =>
        agent.status === 'online' && agent.capabilities.includes(capability)
    );
  }

  /**
   * Discover agents by role
   */
  public discoverAgentsByRole(role: string): AgentRegistration[] {
    if (!this.config.enableDiscovery) {
      return [];
    }

    return Array.from(this.agents.values()).filter(
      (agent) => agent.status === 'online' && agent.role === role
    );
  }

  /**
   * Add a route for an agent
   */
  public addRoute(
    agentName: string,
    handler: (message: ProtocolMessage) => void | Promise<void>,
    filter?: MessageFilter,
    priority: number = 0
  ): void {
    if (!this.agents.has(agentName)) {
      throw new Error(`Agent ${agentName} is not registered`);
    }

    const agentRoutes = this.routes.get(agentName) || [];

    if (agentRoutes.length >= this.config.maxRoutesPerAgent) {
      throw new Error(
        `Maximum routes (${this.config.maxRoutesPerAgent}) reached for agent ${agentName}`
      );
    }

    const route: Route = {
      agentName,
      handler,
      filter,
      priority,
    };

    agentRoutes.push(route);
    agentRoutes.sort((a, b) => b.priority - a.priority);

    this.routes.set(agentName, agentRoutes);

    this.emit('route:added', { agentName, route });
  }

  /**
   * Remove a route for an agent
   */
  public removeRoute(
    agentName: string,
    handler: (message: ProtocolMessage) => void | Promise<void>
  ): void {
    const agentRoutes = this.routes.get(agentName);
    if (!agentRoutes) {
      return;
    }

    const filteredRoutes = agentRoutes.filter((route) => route.handler !== handler);
    this.routes.set(agentName, filteredRoutes);

    this.emit('route:removed', { agentName });
  }

  /**
   * Route a message to its destination(s)
   */
  public async routeMessage(message: ProtocolMessage): Promise<void> {
    const startTime = Date.now();

    try {
      // Update sender's last seen
      const sender = this.agents.get(message.header.sender);
      if (sender) {
        sender.lastSeen = new Date();
      }

      // Handle different message types
      if (message.header.type === MessageType.BROADCAST) {
        await this.routeBroadcast(message);
      } else {
        await this.routeDirect(message);
      }

      // Update stats
      this.stats.totalRouted++;
      const routingTime = Date.now() - startTime;
      this.updateAverageRoutingTime(routingTime);

      this.emit('message:routed', { message, routingTime });
    } catch (error) {
      this.stats.failed++;
      this.emit('routing:error', { message, error });
      throw error;
    }
  }

  /**
   * Route a direct message
   */
  private async routeDirect(message: ProtocolMessage): Promise<void> {
    const receiver =
      typeof message.header.receiver === 'string'
        ? message.header.receiver
        : message.header.receiver[0];

    // Check if receiver is registered
    const agent = this.agents.get(receiver);
    if (!agent) {
      throw new Error(`Receiver ${receiver} is not registered`);
    }

    // Check if receiver is online
    if (agent.status === 'offline') {
      throw new Error(`Receiver ${receiver} is offline`);
    }

    // Get routes for receiver
    const routes = this.routes.get(receiver);
    if (!routes || routes.length === 0) {
      throw new Error(`No routes found for receiver ${receiver}`);
    }

    // Filter and deliver
    const matchingRoutes = this.filterRoutes(routes, message);
    if (matchingRoutes.length === 0) {
      this.stats.filtered++;
      this.emit('message:filtered', { message, receiver });
      return;
    }

    // Deliver to all matching routes
    await this.deliverToRoutes(matchingRoutes, message);
    this.stats.directMessages++;
  }

  /**
   * Route a broadcast message
   */
  private async routeBroadcast(message: ProtocolMessage): Promise<void> {
    const receivers = Array.isArray(message.header.receiver)
      ? message.header.receiver
      : [message.header.receiver];

    const deliveryPromises: Promise<void>[] = [];

    for (const receiver of receivers) {
      const agent = this.agents.get(receiver);
      if (!agent || agent.status === 'offline') {
        continue;
      }

      const routes = this.routes.get(receiver);
      if (!routes || routes.length === 0) {
        continue;
      }

      const matchingRoutes = this.filterRoutes(routes, message);
      if (matchingRoutes.length > 0) {
        deliveryPromises.push(this.deliverToRoutes(matchingRoutes, message));
      }
    }

    await Promise.allSettled(deliveryPromises);
    this.stats.broadcasts++;
  }

  /**
   * Filter routes based on message filter
   */
  private filterRoutes(routes: Route[], message: ProtocolMessage): Route[] {
    if (!this.config.enableFiltering) {
      return routes;
    }

    return routes.filter((route) => {
      if (!route.filter) {
        return true;
      }

      const filter = route.filter;

      // Check message type
      if (filter.types && !filter.types.includes(message.header.type)) {
        return false;
      }

      // Check sender
      if (filter.senders && !filter.senders.includes(message.header.sender)) {
        return false;
      }

      // Check priority
      if (
        filter.priorities &&
        !filter.priorities.includes(message.header.priority)
      ) {
        return false;
      }

      // Check action
      if (
        filter.actions &&
        message.body.action &&
        !filter.actions.includes(message.body.action)
      ) {
        return false;
      }

      // Custom filter
      if (filter.customFilter && !filter.customFilter(message)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Deliver message to routes
   */
  private async deliverToRoutes(
    routes: Route[],
    message: ProtocolMessage
  ): Promise<void> {
    const deliveryPromises = routes.map(async (route) => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Routing timeout')),
            this.config.routingTimeout
          )
        );

        await Promise.race([route.handler(message), timeoutPromise]);

        this.emit('message:delivered', {
          message,
          agentName: route.agentName,
        });
      } catch (error) {
        this.emit('delivery:error', {
          message,
          agentName: route.agentName,
          error,
        });
        throw error;
      }
    });

    await Promise.all(deliveryPromises);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      const agentEntries = Array.from(this.agents.entries());
      for (const [agentName, agent] of agentEntries) {
        const timeSinceLastSeen = now - agent.lastSeen.getTime();

        if (timeSinceLastSeen > this.config.agentTimeout) {
          // Mark agent as offline
          if (agent.status !== 'offline') {
            agent.status = 'offline';
            this.emit('agent:timeout', { agentName, agent });
          }
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeatMonitoring(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Update average routing time
   */
  private updateAverageRoutingTime(routingTime: number): void {
    this.routingTimes.push(routingTime);

    // Keep only last 100 measurements
    if (this.routingTimes.length > 100) {
      this.routingTimes.shift();
    }

    const sum = this.routingTimes.reduce((acc, time) => acc + time, 0);
    this.stats.averageRoutingTime = sum / this.routingTimes.length;
  }

  /**
   * Get routing statistics
   */
  public getStats(): RoutingStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      totalRouted: 0,
      directMessages: 0,
      broadcasts: 0,
      filtered: 0,
      failed: 0,
      averageRoutingTime: 0,
    };
    this.routingTimes = [];
  }

  /**
   * Get route count for agent
   */
  public getRouteCount(agentName: string): number {
    const routes = this.routes.get(agentName);
    return routes ? routes.length : 0;
  }

  /**
   * Check if agent is registered
   */
  public isAgentRegistered(agentName: string): boolean {
    return this.agents.has(agentName);
  }

  /**
   * Check if agent is online
   */
  public isAgentOnline(agentName: string): boolean {
    const agent = this.agents.get(agentName);
    return agent ? agent.status === 'online' : false;
  }

  /**
   * Shutdown router
   */
  public shutdown(): void {
    this.stopHeartbeatMonitoring();
    this.agents.clear();
    this.routes.clear();
    this.emit('router:shutdown');
  }
}

export default MessageRouter;
