'use client';

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Metrics } from './Dashboard';

interface MetricsChartProps {
  metrics: Metrics[];
}

export function MetricsChart({ metrics }: MetricsChartProps) {
  const chartData = metrics.map(m => ({
    time: m.timestamp.toLocaleTimeString(),
    cpu: Math.round(m.cpuUsage * 10) / 10,
    memory: Math.round(m.memoryUsage * 10) / 10,
    responseTime: Math.round(m.averageResponseTime),
    queueSize: m.messageQueueSize,
  }));

  const stats = {
    avgCpu: metrics.length > 0 ? Math.round((metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length) * 10) / 10 : 0,
    avgMemory: metrics.length > 0 ? Math.round((metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length) * 10) / 10 : 0,
    avgResponseTime: metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length) : 0,
    totalCompleted: metrics.length > 0 ? metrics[metrics.length - 1].completedTasks : 0,
    totalFailed: metrics.length > 0 ? metrics[metrics.length - 1].failedTasks : 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Avg CPU Usage</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{stats.avgCpu}%</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Avg Memory Usage</div>
          <div className="text-3xl font-bold text-cyan-400 mt-2">{stats.avgMemory}%</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Avg Response Time</div>
          <div className="text-3xl font-bold text-purple-400 mt-2">{stats.avgResponseTime}ms</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Completed Tasks</div>
          <div className="text-3xl font-bold text-green-400 mt-2">{stats.totalCompleted}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Failed Tasks</div>
          <div className="text-3xl font-bold text-red-400 mt-2">{stats.totalFailed}</div>
        </div>
      </div>

      {chartData.length > 0 && (
        <>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Resource Usage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
                <Area type="monotone" dataKey="memory" stroke="#06b6d4" fillOpacity={1} fill="url(#colorMemory)" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Response Time & Queue Size</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="responseTime" stroke="#a855f7" name="Response Time (ms)" strokeWidth={2} />
                <Line type="monotone" dataKey="queueSize" stroke="#f59e0b" name="Queue Size" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {chartData.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <div className="text-slate-400">No metrics data available</div>
          <p className="text-slate-500 text-sm mt-2">Metrics will appear here as the system runs</p>
        </div>
      )}
    </div>
  );
}
