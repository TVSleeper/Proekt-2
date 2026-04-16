'use client';

import { useState, useEffect } from 'react';
import { AgentStatus } from './AgentStatus';
import { TaskMonitor } from './TaskMonitor';
import { LogViewer } from './LogViewer';
import { MetricsChart } from './MetricsChart';
import { CommunicationFlow } from './CommunicationFlow';

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'acting' | 'observing' | 'waiting' | 'error' | 'stopped';
  health: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastActive: Date;
  metrics: {
    executionTime: number;
    tokensUsed: number;
    successRate: number;
    errorRate: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  assignedAgent: string;
  dependencies: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface Metrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  activeAgents: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  messageQueueSize: number;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'agents' | 'tasks' | 'logs' | 'metrics' | 'communication'>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>('ALL');

  useEffect(() => {
    setIsConnected(true);

    const agentInterval = setInterval(() => {
      setAgents((prev: Agent[]) => prev.map((agent: Agent) => ({
        ...agent,
        status: ['idle', 'thinking', 'acting', 'observing', 'waiting'][Math.floor(Math.random() * 5)] as any,
        health: Math.random() > 0.1 ? 'healthy' : 'degraded',
        uptime: agent.uptime + 1,
        metrics: {
          ...agent.metrics,
          executionTime: Math.random() * 5000,
          tokensUsed: agent.metrics.tokensUsed + Math.floor(Math.random() * 100),
          successRate: Math.min(100, agent.metrics.successRate + Math.random() * 2),
          errorRate: Math.max(0, agent.metrics.errorRate - Math.random() * 0.5),
        },
      })));
    }, 2000);

    const logInterval = setInterval(() => {
      const levels: Array<'DEBUG' | 'INFO' | 'WARN' | 'ERROR'> = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      const sources = ['Agent-1', 'Agent-2', 'Agent-3', 'Queue', 'Memory'];
      const messages = [
        'Task execution started',
        'Tool executed successfully',
        'Message received from agent',
        'Memory updated',
        'Error in task execution',
      ];

      const newLog: LogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
      };

      setLogs((prev: LogEntry[]) => [newLog, ...prev.slice(0, 99)]);
    }, 1500);

    const metricsInterval = setInterval(() => {
      const newMetrics: Metrics = {
        timestamp: new Date(),
        cpuUsage: Math.random() * 80,
        memoryUsage: Math.random() * 70,
        activeAgents: Math.floor(Math.random() * 10) + 1,
        completedTasks: Math.floor(Math.random() * 100),
        failedTasks: Math.floor(Math.random() * 10),
        averageResponseTime: Math.random() * 2000,
        messageQueueSize: Math.floor(Math.random() * 50),
      };

      setMetrics((prev: Metrics[]) => [...prev.slice(-59), newMetrics]);
    }, 3000);

    const mockAgents: Agent[] = [
      {
        id: '1',
        name: 'Team Lead',
        role: 'team_lead',
        status: 'idle',
        health: 'healthy',
        uptime: 3600,
        lastActive: new Date(),
        metrics: { executionTime: 1200, tokensUsed: 5000, successRate: 98, errorRate: 0.5 },
      },
      {
        id: '2',
        name: 'Frontend Developer',
        role: 'frontend_developer',
        status: 'acting',
        health: 'healthy',
        uptime: 3600,
        lastActive: new Date(),
        metrics: { executionTime: 800, tokensUsed: 3000, successRate: 96, errorRate: 1.2 },
      },
      {
        id: '3',
        name: 'Backend Developer',
        role: 'backend_developer',
        status: 'thinking',
        health: 'healthy',
        uptime: 3600,
        lastActive: new Date(),
        metrics: { executionTime: 1500, tokensUsed: 4500, successRate: 97, errorRate: 0.8 },
      },
    ];

    setAgents(mockAgents);

    return () => {
      clearInterval(agentInterval);
      clearInterval(logInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      idle: 'bg-gray-500',
      thinking: 'bg-blue-500',
      acting: 'bg-yellow-500',
      observing: 'bg-purple-500',
      waiting: 'bg-orange-500',
      error: 'bg-red-500',
      stopped: 'bg-gray-700',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      healthy: 'text-green-400',
      degraded: 'text-yellow-400',
      unhealthy: 'text-red-400',
    };
    return colors[health] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AI Agent Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-1">Real-time monitoring and coordination</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm text-slate-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-700 bg-slate-900/30 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {(['agents', 'tasks', 'logs', 'metrics', 'communication'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'agents' && (
          <AgentStatus agents={agents} getStatusColor={getStatusColor} getHealthColor={getHealthColor} />
        )}

        {activeTab === 'tasks' && (
          <TaskMonitor tasks={tasks} agents={agents} />
        )}

        {activeTab === 'logs' && (
          <LogViewer
            logs={logs}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterLevel={filterLevel}
            setFilterLevel={setFilterLevel}
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsChart metrics={metrics} />
        )}

        {activeTab === 'communication' && (
          <CommunicationFlow agents={agents} />
        )}
      </main>
    </div>
  );
}
