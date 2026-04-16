# Real-Time Dashboard Documentation

## Overview

The Real-Time Dashboard is a comprehensive monitoring and coordination interface for the AI Agent Team Development Application. It provides real-time visibility into agent status, task progress, system metrics, logs, and inter-agent communication.

## Architecture

### Components

The dashboard is built with the following React components:

1. **Dashboard.tsx** - Main container component
2. **AgentStatus.tsx** - Agent monitoring and health display
3. **TaskMonitor.tsx** - Task progress and dependency tracking
4. **LogViewer.tsx** - Real-time log streaming with filtering
5. **MetricsChart.tsx** - Performance visualization with Recharts
6. **CommunicationFlow.tsx** - Agent communication network visualization

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Hooks
- **Backend**: Express.js, Node.js
- **Real-time**: WebSocket-ready architecture

## Features

### 1. Agent Status Dashboard

Displays all agents with current status and health metrics.

**Features:**
- Real-time status updates (idle, thinking, acting, observing, waiting, error, stopped)
- Health indicators (healthy, degraded, unhealthy)
- Uptime tracking
- Performance metrics (execution time, tokens used, success rate, error rate)
- Progress bars for success/error rates
- Last active timestamp

**Data Structure:**
```typescript
interface Agent {
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
```

### 2. Task Monitoring Interface

Tracks active tasks with progress visualization and dependency management.

**Features:**
- Task status tracking (pending, in_progress, completed, failed)
- Progress bars with percentage display
- Task dependency visualization
- Agent assignment tracking
- Creation and completion timestamps
- Summary statistics

**Data Structure:**
```typescript
interface Task {
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
```

### 3. Real-Time Log Viewer

Searchable and filterable log display with real-time streaming.

**Features:**
- Log level filtering (DEBUG, INFO, WARN, ERROR)
- Full-text search across messages and sources
- Auto-scroll functionality
- Log statistics by level
- Metadata display for complex logs
- Color-coded log levels
- Timestamp and source tracking

**Data Structure:**
```typescript
interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}
```

### 4. Metrics Visualization

Performance metrics displayed through interactive charts.

**Metrics Tracked:**
- CPU Usage (%)
- Memory Usage (%)
- Active Agents (count)
- Completed Tasks (count)
- Failed Tasks (count)
- Average Response Time (ms)
- Message Queue Size (count)

**Charts:**
- Resource Usage (Area Chart) - CPU and Memory over time
- Task Metrics (Line Chart) - Completed vs Failed tasks
- System Performance (Line Chart) - Response time and queue size

**Data Structure:**
```typescript
interface Metrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  activeAgents: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  messageQueueSize: number;
}
```

### 5. Communication Flow Diagram

Visualizes agent-to-agent communication and message flow.

**Features:**
- Agent network topology visualization
- Message type breakdown (requests, responses, notifications)
- Real-time message flow display
- Queue status monitoring
- Connection health indicators
- Message throughput metrics
- Latency monitoring

**Message Types:**
- **Request**: Agent requesting action from another agent
- **Response**: Agent responding to a request
- **Notification**: Agent notifying others of status/events

## API Endpoints

### Dashboard Routes

All endpoints are prefixed with `/api/dashboard`

#### GET /agents
Returns list of all agents with current status and metrics.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Team Lead",
    "role": "team_lead",
    "status": "idle",
    "health": "healthy",
    "uptime": 3600,
    "lastActive": "2026-04-16T11:47:46.923Z",
    "metrics": {
      "executionTime": 1200,
      "tokensUsed": 5000,
      "successRate": 98,
      "errorRate": 0.5
    }
  }
]
```

#### GET /agents/:id
Returns specific agent details.

**Response:**
```json
{
  "id": "1",
  "name": "Team Lead",
  "role": "team_lead",
  "status": "idle",
  "health": "healthy"
}
```

#### GET /metrics
Returns current system metrics.

**Response:**
```json
{
  "timestamp": "2026-04-16T11:47:46.923Z",
  "cpuUsage": 45.2,
  "memoryUsage": 62.1,
  "activeAgents": 3,
  "completedTasks": 45,
  "failedTasks": 2,
  "averageResponseTime": 1250,
  "messageQueueSize": 12
}
```

#### GET /logs
Returns system logs with optional filtering.

**Query Parameters:**
- `level`: Filter by log level (ALL, DEBUG, INFO, WARN, ERROR)
- `limit`: Maximum number of logs to return (default: 100)

**Response:**
```json
[
  {
    "id": "log_1",
    "timestamp": "2026-04-16T11:47:46.923Z",
    "level": "INFO",
    "message": "System initialized",
    "source": "Agent-1",
    "metadata": {}
  }
]
```

#### GET /communication
Returns communication flow statistics.

**Response:**
```json
{
  "totalMessages": 245,
  "requests": 120,
  "responses": 100,
  "notifications": 25,
  "activeConnections": 3,
  "queueHealth": "healthy"
}
```

#### GET /tasks
Returns all tasks with status and progress.

**Response:**
```json
[
  {
    "id": "1",
    "title": "Initialize Agent System",
    "description": "Set up base agent infrastructure",
    "status": "completed",
    "progress": 100,
    "assignedAgent": "1",
    "dependencies": [],
    "createdAt": "2026-04-16T10:47:46.923Z",
    "completedAt": "2026-04-16T11:47:46.923Z"
  }
]
```

#### GET /health
Returns dashboard health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-16T11:47:46.923Z",
  "uptime": 3600,
  "agents": {
    "total": 3,
    "healthy": 3,
    "degraded": 0,
    "unhealthy": 0
  },
  "queue": {
    "status": "healthy",
    "pendingMessages": 12,
    "processedMessages": 245
  }
}
```

## Usage

### Accessing the Dashboard

Navigate to `/dashboard` in your browser to access the Real-Time Dashboard.

### Navigation

The dashboard has 5 main tabs:

1. **Agents** - View all agents and their status
2. **Tasks** - Monitor task progress and dependencies
3. **Logs** - View and search system logs
4. **Metrics** - Visualize performance metrics
5. **Communication** - View agent communication flow

### Filtering and Search

#### Log Viewer
- Use the search box to filter logs by message or source
- Click level buttons to filter by log level
- Toggle auto-scroll to follow new logs

#### Agent Status
- View summary statistics at the top
- Scroll through agent cards for detailed metrics
- Color-coded status indicators

#### Task Monitor
- View task statistics and progress
- Filter by status using the status badges
- Track dependencies between tasks

## Real-Time Updates

The dashboard updates in real-time using:

1. **React Hooks** - State management for live data
2. **Intervals** - Simulated real-time updates (2-3 second intervals)
3. **WebSocket Ready** - Architecture supports WebSocket integration

### Update Intervals

- **Agents**: Updated every 2 seconds
- **Logs**: Updated every 1.5 seconds
- **Metrics**: Updated every 3 seconds
- **Tasks**: Updated on change

## Styling

The dashboard uses a dark theme with:

- **Primary Colors**: Blue (#3b82f6), Cyan (#06b6d4)
- **Status Colors**: 
  - Green (#10b981) - Healthy/Success
  - Yellow (#f59e0b) - Warning/In Progress
  - Red (#ef4444) - Error/Failed
  - Purple (#a855f7) - Processing
- **Background**: Slate gradient (slate-900 to slate-800)
- **Borders**: Slate-700 with hover effects

## Performance Considerations

1. **Virtualization**: Log viewer uses max-height with overflow for performance
2. **Memoization**: Filtered logs use useMemo to prevent unnecessary recalculations
3. **Chart Optimization**: Recharts handles large datasets efficiently
4. **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Future Enhancements

1. **WebSocket Integration** - Real-time updates via WebSocket
2. **Database Persistence** - Store metrics and logs in database
3. **Export Functionality** - Export logs and metrics as CSV/JSON
4. **Custom Alerts** - Set thresholds for alerts
5. **Agent Control** - Start/stop/restart agents from dashboard
6. **Advanced Filtering** - Date range, custom filters
7. **Dashboard Customization** - Drag-and-drop widgets
8. **Historical Data** - View historical metrics and trends

## Testing

### Unit Tests

Test individual components:
```bash
npm test -- AgentStatus.test.tsx
npm test -- TaskMonitor.test.tsx
npm test -- LogViewer.test.tsx
npm test -- MetricsChart.test.tsx
npm test -- CommunicationFlow.test.tsx
```

### Integration Tests

Test dashboard integration:
```bash
npm test -- Dashboard.integration.test.tsx
```

### E2E Tests

Test full user workflows:
```bash
npm run test:e2e
```

## Troubleshooting

### Dashboard Not Loading

1. Check if backend is running on correct port
2. Verify CORS configuration
3. Check browser console for errors

### Real-Time Updates Not Working

1. Verify intervals are running (check browser DevTools)
2. Check network tab for API calls
3. Verify data structure matches interfaces

### Charts Not Displaying

1. Ensure Recharts is installed
2. Check if metrics data is available
3. Verify chart dimensions are set

### Performance Issues

1. Reduce update frequency
2. Implement virtualization for large lists
3. Use React.memo for expensive components
4. Profile with React DevTools

## File Structure

```
frontend/src/components/agent-dashboard/
├── Dashboard.tsx           # Main dashboard component
├── AgentStatus.tsx         # Agent status display
├── TaskMonitor.tsx         # Task monitoring
├── LogViewer.tsx           # Log viewer with filtering
├── MetricsChart.tsx        # Metrics visualization
├── CommunicationFlow.tsx   # Communication flow diagram
└── index.ts                # Component exports

frontend/src/app/
└── dashboard/
    └── page.tsx            # Dashboard page

backend/src/routes/
└── dashboard.ts            # Dashboard API routes
```

## Success Criteria Met

✅ Dashboard displays agent status in real-time
✅ Tasks monitored with progress visualization
✅ Logs viewable and searchable with filtering
✅ Metrics visualized with interactive charts
✅ Communication flow visible with message tracking
✅ Responsive design for all screen sizes
✅ Real-time updates every 1.5-3 seconds
✅ Color-coded status indicators
✅ Summary statistics on each tab
✅ API endpoints for data retrieval

## Conclusion

The Real-Time Dashboard provides comprehensive monitoring and coordination capabilities for the AI Agent Team Development Application. It enables real-time visibility into agent operations, task progress, system performance, and inter-agent communication, making it an essential tool for managing and debugging the multi-agent system.