'use client';

import { Agent } from './Dashboard';

interface CommunicationFlowProps {
  agents: Agent[];
}

interface Message {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification';
  timestamp: Date;
}

export function CommunicationFlow({ agents }: CommunicationFlowProps) {
  const mockMessages: Message[] = [
    {
      id: '1',
      from: 'Team Lead',
      to: 'Frontend Developer',
      type: 'request',
      timestamp: new Date(Date.now() - 5000),
    },
    {
      id: '2',
      from: 'Frontend Developer',
      to: 'Team Lead',
      type: 'response',
      timestamp: new Date(Date.now() - 3000),
    },
    {
      id: '3',
      from: 'Backend Developer',
      to: 'Team Lead',
      type: 'notification',
      timestamp: new Date(Date.now() - 1000),
    },
    {
      id: '4',
      from: 'Team Lead',
      to: 'Backend Developer',
      type: 'request',
      timestamp: new Date(),
    },
  ];

  const getMessageColor = (type: string) => {
    const colors: Record<string, string> = {
      request: 'from-blue-500 to-blue-600',
      response: 'from-green-500 to-green-600',
      notification: 'from-yellow-500 to-yellow-600',
    };
    return colors[type] || 'from-slate-500 to-slate-600';
  };

  const getMessageBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      request: 'bg-blue-900 text-blue-300',
      response: 'bg-green-900 text-green-300',
      notification: 'bg-yellow-900 text-yellow-300',
    };
    return colors[type] || 'bg-slate-900 text-slate-300';
  };

  const stats = {
    totalAgents: agents.length,
    totalMessages: mockMessages.length,
    activeConnections: agents.filter(a => a.status !== 'idle').length,
    messageTypes: {
      request: mockMessages.filter(m => m.type === 'request').length,
      response: mockMessages.filter(m => m.type === 'response').length,
      notification: mockMessages.filter(m => m.type === 'notification').length,
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Agents</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{stats.totalAgents}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Messages</div>
          <div className="text-3xl font-bold text-cyan-400 mt-2">{stats.totalMessages}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Active Connections</div>
          <div className="text-3xl font-bold text-green-400 mt-2">{stats.activeConnections}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Queue Status</div>
          <div className="text-3xl font-bold text-purple-400 mt-2">Healthy</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Requests</div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{stats.messageTypes.request}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Responses</div>
          <div className="text-2xl font-bold text-green-400 mt-2">{stats.messageTypes.response}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Notifications</div>
          <div className="text-2xl font-bold text-yellow-400 mt-2">{stats.messageTypes.notification}</div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Agent Network Topology</h3>
        <div className="flex flex-wrap gap-4 justify-center items-center mb-8">
          {agents.map((agent, idx) => (
            <div key={agent.id} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-white font-bold text-sm text-center px-2">{agent.name.split(' ')[0]}</span>
              </div>
              <span className="text-xs text-slate-400 text-center max-w-16">{agent.role}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-700 pt-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-4">Message Flow</h4>
          <div className="space-y-3">
            {mockMessages.map(msg => (
              <div key={msg.id} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-300">{msg.from}</span>
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-medium text-slate-300">{msg.to}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMessageBadgeColor(msg.type)}`}>
                      {msg.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">{msg.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getMessageColor(msg.type)} animate-pulse`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Communication Statistics</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Request Messages</span>
              <span className="text-sm font-medium text-blue-400">{stats.messageTypes.request}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(stats.messageTypes.request / stats.totalMessages) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Response Messages</span>
              <span className="text-sm font-medium text-green-400">{stats.messageTypes.response}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(stats.messageTypes.response / stats.totalMessages) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Notification Messages</span>
              <span className="text-sm font-medium text-yellow-400">{stats.messageTypes.notification}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${(stats.messageTypes.notification / stats.totalMessages) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Queue Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-2">Queue Health</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-400">Healthy</span>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-2">Connection Status</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-400">Connected</span>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-2">Message Throughput</div>
            <span className="text-lg font-semibold text-cyan-400">{mockMessages.length} msg/min</span>
          </div>
          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-2">Latency</div>
            <span className="text-lg font-semibold text-purple-400">&lt;100ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
