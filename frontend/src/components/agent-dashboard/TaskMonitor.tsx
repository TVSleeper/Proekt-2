'use client';

import { Task, Agent } from './Dashboard';

interface TaskMonitorProps {
  tasks: Task[];
  agents: Agent[];
}

export function TaskMonitor({ tasks, agents }: TaskMonitorProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-slate-600',
      in_progress: 'bg-blue-600',
      completed: 'bg-green-600',
      failed: 'bg-red-600',
    };
    return colors[status] || 'bg-slate-600';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-slate-700 text-slate-300',
      in_progress: 'bg-blue-900 text-blue-300',
      completed: 'bg-green-900 text-green-300',
      failed: 'bg-red-900 text-red-300',
    };
    return colors[status] || 'bg-slate-700 text-slate-300';
  };

  const getAgentName = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.name || 'Unknown';
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Tasks</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{stats.total}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Pending</div>
          <div className="text-3xl font-bold text-slate-400 mt-2">{stats.pending}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">In Progress</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{stats.inProgress}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Completed</div>
          <div className="text-3xl font-bold text-green-400 mt-2">{stats.completed}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Failed</div>
          <div className="text-3xl font-bold text-red-400 mt-2">{stats.failed}</div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <div className="text-slate-400">No tasks yet</div>
          <p className="text-slate-500 text-sm mt-2">Tasks will appear here as they are created</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">{task.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Assigned To</div>
                  <div className="text-sm font-medium text-slate-300 mt-1">{getAgentName(task.assignedAgent)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Created</div>
                  <div className="text-sm font-medium text-slate-300 mt-1">{new Date(task.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Dependencies</div>
                  <div className="text-sm font-medium text-slate-300 mt-1">{task.dependencies.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Progress</div>
                  <div className="text-sm font-medium text-blue-400 mt-1">{task.progress}%</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500 uppercase">Task Progress</span>
                  <span className="text-sm font-medium text-slate-300">{task.progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStatusColor(task.status)}`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {task.dependencies.length > 0 && (
                <div className="pt-4 border-t border-slate-700">
                  <div className="text-xs text-slate-500 uppercase mb-2">Dependencies</div>
                  <div className="flex flex-wrap gap-2">
                    {task.dependencies.map(depId => (
                      <span key={depId} className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-400 font-mono">
                        {depId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
