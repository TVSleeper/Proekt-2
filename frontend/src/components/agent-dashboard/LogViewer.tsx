'use client';

import { useState, useMemo } from 'react';
import { LogEntry } from './Dashboard';

interface LogViewerProps {
  logs: LogEntry[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterLevel: 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  setFilterLevel: (level: 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') => void;
}

export function LogViewer({
  logs,
  searchQuery,
  setSearchQuery,
  filterLevel,
  setFilterLevel,
}: LogViewerProps) {
  const [autoScroll, setAutoScroll] = useState(true);

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      DEBUG: 'text-slate-400 bg-slate-900/30',
      INFO: 'text-blue-400 bg-blue-900/20',
      WARN: 'text-yellow-400 bg-yellow-900/20',
      ERROR: 'text-red-400 bg-red-900/20',
    };
    return colors[level] || 'text-slate-400';
  };

  const getLevelBadgeColor = (level: string) => {
    const colors: Record<string, string> = {
      DEBUG: 'bg-slate-700 text-slate-300',
      INFO: 'bg-blue-700 text-blue-300',
      WARN: 'bg-yellow-700 text-yellow-300',
      ERROR: 'bg-red-700 text-red-300',
    };
    return colors[level] || 'bg-slate-700';
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
      const matchesSearch =
        searchQuery === '' ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logs, filterLevel, searchQuery]);

  const stats = {
    total: logs.length,
    debug: logs.filter(l => l.level === 'DEBUG').length,
    info: logs.filter(l => l.level === 'INFO').length,
    warn: logs.filter(l => l.level === 'WARN').length,
    error: logs.filter(l => l.level === 'ERROR').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Logs</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{stats.total}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Debug</div>
          <div className="text-3xl font-bold text-slate-400 mt-2">{stats.debug}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Info</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{stats.info}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Warnings</div>
          <div className="text-3xl font-bold text-yellow-400 mt-2">{stats.warn}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Errors</div>
          <div className="text-3xl font-bold text-red-400 mt-2">{stats.error}</div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterLevel === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 cursor-pointer"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No logs match your filters
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredLogs.map(log => (
                <div
                  key={log.id}
                  className={`p-3 hover:bg-slate-800/50 transition-colors ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${getLevelBadgeColor(log.level)}`}>
                      {log.level}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500">{log.timestamp.toLocaleTimeString()}</span>
                        <span className="text-slate-600">[{log.source}]</span>
                      </div>
                      <div className="text-slate-300 break-words">{log.message}</div>
                      {log.metadata && (
                        <div className="mt-2 text-xs text-slate-500 bg-slate-900/50 p-2 rounded">
                          {JSON.stringify(log.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
