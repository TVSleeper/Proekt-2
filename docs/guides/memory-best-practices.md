# Memory Systems Best Practices Guide

**Version**: 1.0.0  
**Last Updated**: 2026-04-16

---

## Overview

This guide provides best practices for designing and implementing memory systems in AI agents. It covers memory design patterns, performance optimization, isolation strategies, and troubleshooting common issues.

---

## Memory Design Patterns

### Pattern 1: Task-Scoped Memory

Use working memory for task-specific context that should be cleared after task completion.

```typescript
// Good: Clear working memory after task
async function executeTask(taskId: string) {
  // Store task context
  const context = manager.addToWorking('agent', {
    taskId,
    status: 'started',
    steps: []
  });

  try {
    // Execute task
    await performWork();
    
    // Record completion
    await manager.recordEpisode('agent', {
      action: 'task_completed',
      taskId,
      result: 'success'
    }, 0.9);
  } finally {
    // Always clear working memory
    await manager.clearAgentMemory('agent', 'working');
  }
}

// Bad: Leave working memory cluttered
async function executeTask(taskId: string) {
  manager.addToWorking('agent', { taskId });
  await performWork();
  // Working memory never cleared
}
```

### Pattern 2: Hierarchical Tagging

Use consistent, hierarchical tags for better organization and retrieval.

```typescript
// Good: Hierarchical tags
const tags = ['domain:api', 'type:design', 'status:completed', 'priority:high'];

// Bad: Flat, inconsistent tags
const tags = ['api', 'design', 'done', 'important'];

// Usage
await manager.recordEpisode('agent', event, 0.8, tags);

// Retrieval with specific tags
const results = await manager.queryMemory({
  agentName: 'agent',
  tags: ['domain:api', 'type:design'],
  limit: 10
});
```

### Pattern 3: Relevance-Based Filtering

Set appropriate relevance scores based on importance and use them for filtering.

```typescript
// Critical decisions: high relevance
await manager.recordEpisode('agent', {
  action: 'architectural_decision',
  decision: 'Use PostgreSQL'
}, 0.95, ['decision', 'critical']);

// Routine operations: medium relevance
await manager.recordEpisode('agent', {
  action: 'routine_task',
  task: 'Format code'
}, 0.5, ['routine']);

// Exploratory work: low relevance
await manager.recordEpisode('agent', {
  action: 'exploration',
  finding: 'Tested approach X'
}, 0.3, ['exploration']);

// Retrieve only important items
const important = await manager.queryMemory({
  agentName: 'agent',
  minRelevance: 0.8,
  limit: 20
});
```

### Pattern 4: Memory Consolidation Pipeline

Implement automatic consolidation to manage memory growth.

```typescript
// Configure consolidation
const manager = new MemoryManager({
  enabled: true,
  interval: 3600000, // 1 hour
  minRelevance: 0.7,
  maxWorkingMemorySize: 100,
  maxEpisodicMemorySize: 10000
});

// Consolidation flow:
// 1. High-relevance working memories → episodic
// 2. Patterns in episodic → semantic
// 3. Low-relevance old entries → archived

// Monitor consolidation
const result = await manager.consolidate('agent');
console.log(`Promoted: ${result.promoted}, Archived: ${result.archived}`);
```

### Pattern 5: Cross-Agent Knowledge Sharing

Use semantic memory with shared tags for knowledge sharing.

```typescript
// Agent A learns pattern
await manager.learnPattern(
  'backend-agent',
  {
    pattern: 'API versioning',
    approach: 'URL-based',
    example: '/api/v1/users'
  },
  'api-design',
  ['api', 'shared', 'versioning']
);

// Agent B retrieves shared knowledge
const patterns = await manager.queryMemory({
  agentName: 'frontend-agent',
  type: 'semantic',
  tags: ['shared', 'api'],
  limit: 10
});

// Agent B uses the knowledge
console.log('API pattern:', patterns[0].content.example);
```

---

## Performance Optimization

### Optimization 1: Query Efficiency

Use specific filters to reduce search space.

```typescript
// Efficient: Filtered query
const results = await manager.queryMemory({
  agentName: 'agent',
  type: 'episodic',
  tags: ['api', 'success'],
  minRelevance: 0.8,
  limit: 10
});

// Less efficient: Broad query
const results = await manager.queryMemory({
  agentName: 'agent',
  limit: 100
});

// Performance impact:
// Filtered: ~10ms
// Broad: ~100ms
```

### Optimization 2: Batch Operations

Process multiple items together instead of individually.

```typescript
// Efficient: Batch recording
const events = [
  { action: 'task_1', result: 'success' },
  { action: 'task_2', result: 'success' },
  { action: 'task_3', result: 'success' }
];

for (const event of events) {
  await manager.recordEpisode('agent', event, 0.8);
}

// Less efficient: Individual operations with delays
for (const event of events) {
  await manager.recordEpisode('agent', event, 0.8);
  await delay(100); // Unnecessary delay
}
```

### Optimization 3: Memory Size Management

Monitor and manage memory size to prevent degradation.

```typescript
// Check memory size
const stats = await manager.getMemoryStats('agent');

// Consolidate if needed
if (stats.workingMemorySize > 80) {
  await manager.consolidate('agent');
}

if (stats.episodicMemorySize > 8000) {
  // Archive old entries
  await manager.consolidate('agent');
}

// Clear old working memory
if (stats.workingMemorySize > 50) {
  await manager.clearAgentMemory('agent', 'working');
}
```

### Optimization 4: Caching Strategy

Cache frequently accessed memories.

```typescript
// Implement simple cache
class MemoryCache {
  private cache = new Map();
  private ttl = 300000; // 5 minutes

  async get(key: string, fetcher: () => Promise<any>) {
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key);
      if (Date.now() - timestamp < this.ttl) {
        return data;
      }
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new MemoryCache();

const patterns = await cache.get('api-patterns', () =>
  manager.queryMemory({
    agentName: 'agent',
    type: 'semantic',
    tags: ['api'],
    limit: 10
  })
);
```

### Optimization 5: Lazy Loading

Load memory only when needed.

```typescript
// Lazy load episodic memory
class LazyMemoryLoader {
  private loaded = false;
  private data: any = null;

  async load() {
    if (!this.loaded) {
      this.data = await manager.queryMemory({
        agentName: 'agent',
        type: 'episodic',
        limit: 100
      });
      this.loaded = true;
    }
    return this.data;
  }

  clear() {
    this.loaded = false;
    this.data = null;
  }
}

// Usage
const loader = new LazyMemoryLoader();
const data = await loader.load(); // Loads on first access
```

---

## Memory Isolation Strategies

### Strategy 1: Agent-Level Isolation

Keep each agent's memory separate.

```typescript
// Good: Separate memory per agent
const backendMemory = manager.queryMemory({
  agentName: 'backend-agent'
});

const frontendMemory = manager.queryMemory({
  agentName: 'frontend-agent'
});

// Bad: Shared memory without isolation
const allMemory = manager.queryMemory({
  agentName: undefined // Gets all agents' memory
});
```

### Strategy 2: Task-Level Isolation

Isolate memory by task to prevent cross-contamination.

```typescript
// Good: Task-scoped memory
async function executeTask(taskId: string) {
  const taskTag = `task:${taskId}`;
  
  // Store task-specific context
  manager.addToWorking('agent', {
    taskId,
    context: {}
  }, [taskTag]);

  try {
    // Execute task
    await performWork();
  } finally {
    // Clear task-specific memory
    const taskMemory = await manager.queryMemory({
      agentName: 'agent',
      tags: [taskTag]
    });
    
    for (const entry of taskMemory) {
      await manager.delete(entry.id);
    }
  }
}

// Bad: No task isolation
async function executeTask(taskId: string) {
  manager.addToWorking('agent', { taskId });
  await performWork();
  // Memory persists across tasks
}
```

### Strategy 3: Type-Based Isolation

Use memory types appropriately to isolate concerns.

```typescript
// Good: Appropriate type usage
// Working: Current task context
manager.addToWorking('agent', { currentTask: 'api-design' });

// Episodic: Past events and decisions
await manager.recordEpisode('agent', {
  action: 'decision_made',
  decision: 'Use PostgreSQL'
}, 0.9);

// Semantic: Learned patterns
await manager.learnPattern('agent', {
  pattern: 'API design',
  principles: ['REST', 'Stateless']
}, 'api-design');

// Bad: Mixing types
manager.addToWorking('agent', {
  currentTask: 'api-design',
  pastDecisions: [...], // Should be episodic
  learnedPatterns: [...] // Should be semantic
});
```

### Strategy 4: Temporal Isolation

Isolate memory by time ranges.

```typescript
// Query recent memory
const recent = await manager.queryMemory({
  agentName: 'agent',
  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date()
  },
  limit: 50
});

// Query historical memory
const historical = await manager.queryMemory({
  agentName: 'agent',
  timeRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  limit: 50
});

// Archive very old memory
const veryOld = await manager.queryMemory({
  agentName: 'agent',
  timeRange: {
    start: new Date(0),
    end: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  }
});

for (const entry of veryOld) {
  await manager.delete(entry.id);
}
```

---

## Consolidation Strategies

### Strategy 1: Time-Based Consolidation

Consolidate at regular intervals.

```typescript
const manager = new MemoryManager({
  enabled: true,
  interval: 3600000, // Every hour
  minRelevance: 0.7,
  maxWorkingMemorySize: 100,
  maxEpisodicMemorySize: 10000
});

// Consolidation happens automatically
// Monitor results
setInterval(async () => {
  const stats = await manager.getMemoryStats('agent');
  console.log(`Working memory: ${stats.workingMemorySize}`);
  console.log(`Episodic memory: ${stats.episodicMemorySize}`);
}, 3600000);
```

### Strategy 2: Size-Based Consolidation

Consolidate when memory reaches threshold.

```typescript
async function checkAndConsolidate(agentName: string) {
  const stats = await manager.getMemoryStats(agentName);
  
  // Consolidate if working memory is 80% full
  if (stats.workingMemorySize > 80) {
    const result = await manager.consolidate(agentName);
    console.log(`Consolidated: ${result.promoted} promoted`);
  }
  
  // Consolidate if episodic memory is 80% full
  if (stats.episodicMemorySize > 8000) {
    const result = await manager.consolidate(agentName);
    console.log(`Consolidated: ${result.archived} archived`);
  }
}

// Check periodically
setInterval(() => checkAndConsolidate('agent'), 60000);
```

### Strategy 3: Relevance-Based Consolidation

Consolidate based on relevance scores.

```typescript
async function consolidateByRelevance(agentName: string) {
  // Get all working memories
  const working = await manager.queryMemory({
    agentName,
    type: 'working',
    limit: 1000
  });

  // Separate by relevance
  const highRelevance = working.filter(m => m.metadata.relevance >= 0.8);
  const lowRelevance = working.filter(m => m.metadata.relevance < 0.5);

  // Promote high-relevance to episodic
  for (const entry of highRelevance) {
    await manager.recordEpisode(agentName, entry.content, entry.metadata.relevance);
  }

  // Archive low-relevance
  for (const entry of lowRelevance) {
    await manager.delete(entry.id);
  }

  console.log(`Promoted: ${highRelevance.length}, Archived: ${lowRelevance.length}`);
}
```

### Strategy 4: Pattern-Based Consolidation

Learn patterns during consolidation.

```typescript
async function consolidateWithLearning(agentName: string) {
  // Get episodic memories
  const episodic = await manager.queryMemory({
    agentName,
    type: 'episodic',
    minRelevance: 0.8,
    limit: 100
  });

  // Identify patterns
  const patterns = identifyPatterns(episodic);

  // Learn patterns
  for (const pattern of patterns) {
    await manager.learnPattern(
      agentName,
      pattern.data,
      pattern.category,
      pattern.tags
    );
  }

  console.log(`Learned ${patterns.length} patterns`);
}

function identifyPatterns(memories: any[]) {
  // Analyze memories to find recurring patterns
  const patterns = [];
  
  // Group by action type
  const byAction = {};
  memories.forEach(m => {
    const action = m.content.action;
    byAction[action] = (byAction[action] || []).push(m);
  });

  // Extract patterns from groups
  for (const [action, group] of Object.entries(byAction)) {
    if (group.length >= 3) {
      patterns.push({
        data: { action, frequency: group.length },
        category: 'action-pattern',
        tags: ['pattern', action]
      });
    }
  }

  return patterns;
}
```

---

## Troubleshooting Common Issues

### Issue 1: Memory Bloat

**Symptoms**: Memory usage grows continuously, performance degrades

**Root Causes**:
- Consolidation not running
- Working memory not cleared
- Low relevance threshold

**Solutions**:

```typescript
// Solution 1: Enable and verify consolidation
const manager = new MemoryManager({
  enabled: true,
  interval: 1800000, // 30 minutes
  minRelevance: 0.7
});

// Solution 2: Manually clear working memory
await manager.clearAgentMemory('agent', 'working');

// Solution 3: Lower relevance threshold
const manager = new MemoryManager({
  minRelevance: 0.5 // More aggressive archiving
});

// Solution 4: Monitor and alert
setInterval(async () => {
  const stats = await manager.getMemoryStats('agent');
  if (stats.workingMemorySize > 90) {
    console.warn('Working memory near limit!');
    await manager.consolidate('agent');
  }
}, 60000);
```

### Issue 2: Slow Queries

**Symptoms**: Memory queries take > 1 second

**Root Causes**:
- Querying without filters
- Large result sets
- Inefficient search

**Solutions**:

```typescript
// Solution 1: Use specific filters
const results = await manager.queryMemory({
  agentName: 'agent',
  type: 'episodic',
  tags: ['api'],
  minRelevance: 0.8,
  limit: 10
});

// Solution 2: Reduce result limit
const results = await manager.queryMemory({
  agentName: 'agent',
  limit: 10 // Instead of 100
});

// Solution 3: Use time ranges
const results = await manager.queryMemory({
  agentName: 'agent',
  timeRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
});

// Solution 4: Implement caching
const cache = new Map();
const cacheKey = 'api-patterns';

if (!cache.has(cacheKey)) {
  const results = await manager.queryMemory({
    agentName: 'agent',
    tags: ['api'],
    limit: 10
  });
  cache.set(cacheKey, results);
}

const results = cache.get(cacheKey);
```

### Issue 3: Lost Memories

**Symptoms**: Important memories disappear after consolidation

**Root Causes**:
- Low relevance scores
- Aggressive archiving
- Consolidation bugs

**Solutions**:

```typescript
// Solution 1: Set appropriate relevance
await manager.recordEpisode('agent', event, 0.9); // High relevance

// Solution 2: Backup before consolidation
const backup = await manager.export('agent');
fs.writeFileSync('backup.json', JSON.stringify(backup));

// Solution 3: Verify consolidation settings
const manager = new MemoryManager({
  minRelevance: 0.7, // Don't archive high-relevance items
  maxEpisodicMemorySize: 10000 // Sufficient size
});

// Solution 4: Monitor consolidation
const result = await manager.consolidate('agent');
console.log(`Archived: ${result.archived}`);
if (result.archived > 100) {
  console.warn('Large number of entries archived!');
}
```

### Issue 4: Memory Isolation Failures

**Symptoms**: Memories from different agents/tasks mix

**Root Causes**:
- Missing agent name in queries
- Inconsistent tagging
- Shared memory references

**Solutions**:

```typescript
// Solution 1: Always specify agent name
const results = await manager.queryMemory({
  agentName: 'backend-agent', // Always required
  type: 'episodic'
});

// Solution 2: Use consistent tags
const tags = ['agent:backend', 'task:api-design', 'status:completed'];

// Solution 3: Verify isolation
const backendMemory = await manager.queryMemory({
  agentName: 'backend-agent'
});

const frontendMemory = await manager.queryMemory({
  agentName: 'frontend-agent'
});

// Verify no overlap
const backendIds = new Set(backendMemory.map(m => m.id));
const frontendIds = new Set(frontendMemory.map(m => m.id));

const overlap = [...backendIds].filter(id => frontendIds.has(id));
if (overlap.length > 0) {
  console.error('Memory isolation failure detected!');
}
```

### Issue 5: Consolidation Failures

**Symptoms**: Consolidation errors or incomplete consolidation

**Root Causes**:
- Storage errors
- Corrupted data
- Insufficient resources

**Solutions**:

```typescript
// Solution 1: Error handling
try {
  const result = await manager.consolidate('agent');
  console.log('Consolidation successful');
} catch (error) {
  console.error('Consolidation failed:', error);
  // Retry with backoff
  await delay(5000);
  await manager.consolidate('agent');
}

// Solution 2: Verify data integrity
const stats = await manager.getMemoryStats('agent');
if (stats.totalEntries === 0) {
  console.warn('No memories found - possible data loss');
}

// Solution 3: Restore from backup
const backup = JSON.parse(fs.readFileSync('backup.json'));
await manager.import(backup);

// Solution 4: Disable consolidation temporarily
const manager = new MemoryManager({
  enabled: false
});

// Manual consolidation with error handling
try {
  await manager.consolidate('agent');
} catch (error) {
  console.error('Manual consolidation failed:', error);
}
```

---

## Monitoring and Metrics

### Key Metrics to Track

```typescript
// Memory usage
const stats = await manager.getMemoryStats('agent');
console.log(`Working: ${stats.workingMemorySize}`);
console.log(`Episodic: ${stats.episodicMemorySize}`);
console.log(`Semantic: ${stats.semanticMemorySize}`);

// Consolidation effectiveness
const result = await manager.consolidate('agent');
console.log(`Promoted: ${result.promoted}`);
console.log(`Archived: ${result.archived}`);
console.log(`Learned: ${result.learned}`);

// Query performance
const start = Date.now();
const results = await manager.queryMemory({ agentName: 'agent' });
const duration = Date.now() - start;
console.log(`Query time: ${duration}ms`);

// Memory efficiency
const avgRelevance = stats.averageRelevance;
const efficiency = (avgRelevance * 100).toFixed(1);
console.log(`Memory efficiency: ${efficiency}%`);
```

### Monitoring Dashboard

```typescript
class MemoryMonitor {
  private metrics = [];

  async recordMetrics(agentName: string) {
    const stats = await manager.getMemoryStats(agentName);
    
    this.metrics.push({
      timestamp: new Date(),
      agentName,
      workingMemory: stats.workingMemorySize,
      episodicMemory: stats.episodicMemorySize,
      semanticMemory: stats.semanticMemorySize,
      avgRelevance: stats.averageRelevance
    });
  }

  getReport() {
    const recent = this.metrics.slice(-10);
    
    return {
      current: recent[recent.length - 1],
      trend: {
        workingMemory: this.calculateTrend(recent, 'workingMemory'),
        episodicMemory: this.calculateTrend(recent, 'episodicMemory'),
        avgRelevance: this.calculateTrend(recent, 'avgRelevance')
      }
    };
  }

  private calculateTrend(data: any[], field: string) {
    if (data.length < 2) return 'stable';
    
    const first = data[0][field];
    const last = data[data.length - 1][field];
    
    if (last > first * 1.1) return 'increasing';
    if (last < first * 0.9) return 'decreasing';
    return 'stable';
  }
}

// Usage
const monitor = new MemoryMonitor();
setInterval(() => monitor.recordMetrics('agent'), 60000);
```

---

## Summary of Best Practices

1. **Use appropriate memory types** - Working for current context, episodic for history, semantic for patterns
2. **Tag consistently** - Use hierarchical, descriptive tags
3. **Set relevance scores** - Mark important items with high scores
4. **Consolidate regularly** - Prevent memory bloat
5. **Isolate by agent and task** - Prevent cross-contamination
6. **Monitor metrics** - Track memory usage and performance
7. **Backup important data** - Export memories periodically
8. **Handle errors gracefully** - Implement retry logic
9. **Optimize queries** - Use filters and limits
10. **Clean up regularly** - Archive or delete old data

---

**Last Updated**: 2026-04-16  
**Status**: Production Ready  
**Maintainer**: AI Agent Team