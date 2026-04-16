'use client';

import { Agent } from './Dashboard';

interface AgentStatusProps {
  agents: Agent[];
  getStatusColor: (status: string) => string;
  getHealthColor: (health: string) => string;
}

export function AgentStatus({ agents, getStatusColor, getHealthColor }: AgentStatusProps) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Agents</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{agents.length}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Healthy</div>
          <div className="text-3xl font-bold text-green-400 mt-2">
            {agents.filter(a => a.health === 'healthy').length}
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Active</div>
          <div className="text-3xl font-bold text-yellow-400 mt-2">
            {agents.filter(a => a.status !== 'idle').length}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {agents.map(agent => (
          <div key={agent.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)} animate-pulse`} />
                <div>
                  <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                  <p className="text-sm text-slate-400">{agent.role}</p>
                </div>
              </div>
              <div className={`text-sm font-medium ${getHealthColor(agent.health)}`}>
                {agent.health.charAt(0).toUpperCase() + agent.health.slice(1)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Status</div>
                <div className="text-sm font-medium text-white mt-1 capitalize">{agent.status}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Uptime</div>
                <div className="text-sm font-medium text-white mt-1">{formatUptime(agent.uptime)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Success Rate</div>
                <div className="text-sm font-medium text-green-400 mt-1">{agent.metrics.successRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Error Rate</div>
                <div className="text-sm font-medium text-red-400 mt-1">{agent.metrics.errorRate.toFixed(2)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs text-slate-400">Execution Time</div>
                <div className="text-sm font-semibold text-blue-400 mt-1">
                  {(agent.metrics.executionTime / 1000).toFixed(2)}s
                </div>
              </div>
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs text-slate-400">Tokens Used</div>
                <div className="text-sm font-semibold text-cyan-400 mt-1">
                  {agent.metrics.tokensUsed.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs text-slate-400">Last Active</div>
                <div className="text-sm font-semibold text-slate-300 mt-1">
                  {new Date(agent.lastActive).toLocaleTimeString()}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs text-slate-400">ID</div>
                <div className="text-sm font-semibold text-slate-400 mt-1 font-mono">
                  {agent.id}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
