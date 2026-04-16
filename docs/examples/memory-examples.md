# Memory Systems Examples

**Version**: 1.0.0  
**Last Updated**: 2026-04-16

---

## Overview

This guide provides practical examples of using the Memory Systems API for various agent scenarios. Each example demonstrates real-world use cases and best practices.

---

## Working Memory Examples

### Example 1: Task State Management

```typescript
import { WorkingMemory } from './src/memory/working-memory';

const workingMemory = new WorkingMemory(100);

// Agent starts a new task
const taskEntry = workingMemory.add(
  'backend-agent',
  {
    taskId: 'TASK-001',
    title: 'Implement User Authentication API',
    status: 'started',
    startTime: new Date(),
    steps: [
      'Design schema',
      'Implement endpoints',
      'Add validation',
      'Write tests'
    ],
    currentStep: 0,
    progress: 0
  },
  ['task', 'authentication', 'api']
);

console.log('Task started:', taskEntry.id);

// Update progress
workingMemory.update(taskEntry.id, {
  taskId: 'TASK-001',
  title: 'Implement User Authentication API',
  status: 'in-progress',
  startTime: new Date(Date.now() - 600000),
  steps: [
    'Design schema',
    'Implement endpoints',
    'Add validation',
    'Write tests'
  ],
  currentStep: 1,
  progress: 25,
  completedSteps: ['Design schema']
});

// Query current task
const tasks = workingMemory.query('backend-agent', ['task']);
console.log('Current tasks:', tasks.length);
```

### Example 2: Context Accumulation

```typescript
// Agent accumulates context during reasoning
const contextEntry = workingMemory.add(
  'frontend-agent',
  {
    component: 'UserDashboard',
    requirements: [
      'Display user profile',
      'Show recent activities',
      'Allow settings update'
    ],
    decisions: {
      layout: 'grid',
      framework: 'React',
      stateManagement: 'Redux'
    },
    constraints: {
      maxLoadTime: 2000,
      minBrowserSupport: 'Chrome 90+'
    }
  },
  ['component', 'design', 'frontend']
);

// Later, retrieve context for implementation
const context = workingMemory.get(contextEntry.id);
console.log('Component requirements:', context.content.requirements);
```

### Example 3: Error Context

```typescript
// Store error context for debugging
const errorEntry = workingMemory.add(
  'qa-agent',
  {
    testName: 'User Login Flow',
    error: 'Timeout waiting for element',
    timestamp: new Date(),
    context: {
      browser: 'Chrome',
      url: 'https://app.example.com/login',
      screenshot: 'error-screenshot.png'
    },
    attempts: 3,
    lastAttempt: new Date()
  },
  ['error', 'testing', 'login']
);

// Query errors for analysis
const errors = workingMemory.query('qa-agent', ['error']);
console.log(`Found ${errors.length} errors in current session`);
```

### Example 4: Multi-Step Process Tracking

```typescript
// Track deployment process
const deploymentEntry = workingMemory.add(
  'devops-agent',
  {
    deploymentId: 'DEPLOY-2026-001',
    environment: 'staging',
    version: '2.1.0',
    steps: [
      { name: 'Build', status: 'completed', duration: 120 },
      { name: 'Test', status: 'completed', duration: 180 },
      { name: 'Deploy', status: 'in-progress', duration: 45 },
      { name: 'Verify', status: 'pending', duration: null }
    ],
    startTime: new Date(Date.now() - 345000),
    estimatedCompletion: new Date(Date.now() + 60000)
  },
  ['deployment', 'devops', 'staging']
);

// Monitor progress
const deployment = workingMemory.get(deploymentEntry.id);
const completed = deployment.content.steps.filter(s => s.status === 'completed').length;
const total = deployment.content.steps.length;
console.log(`Deployment progress: ${completed}/${total} steps`);
```

---

## Episodic Memory Examples

### Example 1: Recording Task Completion

```typescript
import { EpisodicMemory } from './src/memory/episodic-memory';

const episodicMemory = new EpisodicMemory('./episodic-storage');

// Record successful task completion
const completion = await episodicMemory.record(
  'backend-agent',
  {
    action: 'task_completed',
    taskId: 'TASK-001',
    title: 'Implement User API',
    duration: 3600000, // 1 hour
    result: 'success',
    metrics: {
      linesOfCode: 450,
      testCoverage: 95,
      tokensUsed: 25000
    },
    tools: ['code-generator', 'api-tester', 'linter'],
    notes: 'Completed with excellent test coverage'
  },
  0.95,
  ['task', 'success', 'api', 'backend']
);

console.log('Task recorded:', completion.id);
```

### Example 2: Learning from Failures

```typescript
// Record failed attempt
const failure = await episodicMemory.record(
  'backend-agent',
  {
    action: 'task_failed',
    taskId: 'TASK-002',
    title: 'Implement Payment API',
    duration: 1800000, // 30 minutes
    result: 'failed',
    error: 'Database connection timeout',
    cause: 'Connection pool exhausted',
    solution: 'Increase pool size and add retry logic',
    prevention: 'Monitor connection pool metrics'
  },
  0.85,
  ['task', 'failure', 'api', 'database']
);

// Later, query similar failures
const similarFailures = await episodicMemory.retrieve({
  agentName: 'backend-agent',
  tags: ['failure', 'database'],
  minRelevance: 0.7,
  limit: 5
});

console.log(`Found ${similarFailures.length} similar failures`);
```

### Example 3: Decision Tracking

```typescript
// Record architectural decision
const decision = await episodicMemory.record(
  'backend-agent',
  {
    action: 'architectural_decision',
    decision: 'Use PostgreSQL for primary database',
    alternatives: ['MongoDB', 'DynamoDB', 'MySQL'],
    reasoning: [
      'ACID compliance required',
      'Complex queries needed',
      'Team expertise with PostgreSQL'
    ],
    tradeoffs: {
      pros: ['Reliability', 'Complex queries', 'Team expertise'],
      cons: ['Scaling complexity', 'Higher operational overhead']
    },
    timestamp: new Date(),
    decidedBy: 'backend-agent'
  },
  0.9,
  ['decision', 'architecture', 'database']
);

console.log('Decision recorded:', decision.id);
```

### Example 4: Performance Metrics Recording

```typescript
// Record performance test results
const perfTest = await episodicMemory.record(
  'performance-agent',
  {
    action: 'performance_test',
    endpoint: '/api/users',
    method: 'GET',
    results: {
      avgResponseTime: 45,
      p50: 40,
      p95: 120,
      p99: 250,
      errorRate: 0.001,
      throughput: 1000 // requests per second
    },
    environment: 'staging',
    loadProfile: '1000 concurrent users',
    timestamp: new Date()
  },
  0.8,
  ['performance', 'api', 'testing']
);

// Query performance history
const perfHistory = await episodicMemory.retrieve({
  agentName: 'performance-agent',
  tags: ['performance'],
  timeRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  limit: 20
});

console.log(`Performance tests this week: ${perfHistory.length}`);
```

### Example 5: Time-Range Queries

```typescript
// Get all activities from last 24 hours
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const now = new Date();

const dailyActivity = await episodicMemory.retrieve({
  agentName: 'backend-agent',
  timeRange: {
    start: yesterday,
    end: now
  },
  limit: 100
});

console.log(`Activities in last 24 hours: ${dailyActivity.length}`);

// Analyze activity by type
const byType = {};
dailyActivity.forEach(entry => {
  const action = entry.content.action;
  byType[action] = (byType[action] || 0) + 1;
});

console.log('Activity breakdown:', byType);
```

---

## Semantic Memory Examples

### Example 1: Learning API Design Patterns

```typescript
import { SemanticMemory } from './src/memory/semantic-memory';

const semanticMemory = new SemanticMemory('./semantic-storage');

// Learn RESTful API pattern
const restPattern = await semanticMemory.learn(
  'backend-agent',
  {
    pattern: 'RESTful API Design',
    principles: [
      'Resource-oriented URLs',
      'HTTP method semantics',
      'Stateless communication',
      'Proper status codes',
      'Versioning strategy'
    ],
    example: {
      endpoint: '/api/v1/users/{id}',
      methods: {
        GET: 'Retrieve user',
        POST: 'Create user',
        PUT: 'Update user',
        DELETE: 'Delete user'
      }
    },
    benefits: ['Consistency', 'Discoverability', 'Scalability'],
    antipatterns: [
      'RPC-style endpoints',
      'Inconsistent naming',
      'Stateful operations'
    ]
  },
  'api-design',
  ['rest', 'api', 'best-practice']
);

console.log('Pattern learned:', restPattern.id);
```

### Example 2: Database Optimization Patterns

```typescript
// Learn indexing strategy
const indexingPattern = await semanticMemory.learn(
  'backend-agent',
  {
    pattern: 'Database Indexing Strategy',
    steps: [
      'Identify frequently queried columns',
      'Analyze query patterns',
      'Create composite indexes',
      'Monitor index usage',
      'Remove unused indexes'
    ],
    tools: ['EXPLAIN ANALYZE', 'Query profiler', 'Index analyzer'],
    expectedImprovement: '50-80% query performance',
    tradeoffs: {
      pros: ['Faster queries', 'Better user experience'],
      cons: ['Slower writes', 'More storage', 'Maintenance overhead']
    }
  },
  'database-optimization',
  ['database', 'performance', 'optimization']
);

console.log('Optimization pattern learned:', indexingPattern.id);
```

### Example 3: Testing Patterns

```typescript
// Learn testing strategy
const testingPattern = await semanticMemory.learn(
  'qa-agent',
  {
    pattern: 'API Endpoint Testing',
    testTypes: [
      'Happy path - successful operation',
      'Error cases - invalid input',
      'Edge cases - boundary conditions',
      'Performance - response time',
      'Security - authorization checks'
    ],
    structure: {
      setup: 'Prepare test data',
      execute: 'Call endpoint',
      assert: 'Verify response',
      cleanup: 'Clean up test data'
    },
    coverage: 'Aim for 90%+ coverage',
    tools: ['Jest', 'Supertest', 'Postman']
  },
  'testing-strategy',
  ['testing', 'api', 'quality']
);

console.log('Testing pattern learned:', testingPattern.id);
```

### Example 4: Recalling Patterns

```typescript
// Recall API design patterns
const apiPatterns = await semanticMemory.recall(
  'api-design',
  ['rest', 'best-practice']
);

console.log(`Found ${apiPatterns.length} API design patterns`);

apiPatterns.forEach(pattern => {
  console.log(`\nPattern: ${pattern.content.pattern}`);
  console.log(`Principles: ${pattern.content.principles.join(', ')}`);
});
```

### Example 5: Pattern Search

```typescript
// Search for error handling patterns
const errorPatterns = await semanticMemory.search(
  'How should I handle errors in my API?',
  5
);

console.log(`Found ${errorPatterns.length} error handling patterns`);

errorPatterns.forEach(pattern => {
  console.log(`\nPattern: ${pattern.content.pattern}`);
  console.log(`Content: ${JSON.stringify(pattern.content, null, 2)}`);
});
```

---

## Memory Consolidation Examples

### Example 1: Automatic Consolidation

```typescript
import { MemoryManager } from './src/memory/memory-manager';

const manager = new MemoryManager({
  enabled: true,
  interval: 3600000, // 1 hour
  minRelevance: 0.7,
  maxWorkingMemorySize: 100,
  maxEpisodicMemorySize: 10000
});

// Consolidation runs automatically every hour
// High-relevance working memories → episodic
// Patterns in episodic → semantic
// Low-relevance old entries → archived

// Check stats before consolidation
let stats = await manager.getMemoryStats('backend-agent');
console.log(`Before: ${stats.workingMemorySize} working memories`);

// Manually trigger consolidation
const result = await manager.consolidate('backend-agent');
console.log(`Promoted: ${result.promoted} entries`);
console.log(`Archived: ${result.archived} entries`);
console.log(`Learned: ${result.learned} patterns`);

// Check stats after
stats = await manager.getMemoryStats('backend-agent');
console.log(`After: ${stats.workingMemorySize} working memories`);
```

### Example 2: Selective Consolidation

```typescript
// Consolidate only high-relevance items
const result = await manager.consolidate('backend-agent');

// Check what was promoted
console.log(`Consolidation Results:`);
console.log(`- Promoted to episodic: ${result.promoted}`);
console.log(`- Learned patterns: ${result.learned}`);
console.log(`- Archived: ${result.archived}`);
console.log(`- Memory freed: ${result.freedMemory} bytes`);
console.log(`- Duration: ${result.duration}ms`);
```

---

## Multi-Agent Memory Examples

### Example 1: Knowledge Sharing

```typescript
// Backend agent learns a pattern
await manager.learnPattern(
  'backend-agent',
  {
    pattern: 'API versioning strategy',
    approach: 'URL-based versioning',
    example: '/api/v1/users',
    benefits: ['Clear version management', 'Easy deprecation'],
    implementation: 'Use version prefix in routes'
  },
  'api-design',
  ['api', 'versioning', 'shared']
);

// Frontend agent retrieves the pattern
const apiPatterns = await manager.queryMemory({
  agentName: 'frontend-agent',
  type: 'semantic',
  tags: ['api', 'shared'],
  limit: 10
});

// Frontend uses the knowledge
console.log('API versioning strategy:', apiPatterns[0].content.example);
```

### Example 2: Collaborative Problem Solving

```typescript
// Backend agent records a problem
await manager.recordEpisode(
  'backend-agent',
  {
    action: 'problem_identified',
    problem: 'Database query performance degradation',
    symptoms: ['Slow API responses', 'High CPU usage'],
    investigation: 'Query analysis shows missing index'
  },
  0.9,
  ['problem', 'database', 'performance']
);

// Performance agent retrieves and analyzes
const problems = await manager.queryMemory({
  agentName: 'performance-agent',
  tags: ['problem', 'performance'],
  minRelevance: 0.8
});

// Performance agent provides solution
await manager.learnPattern(
  'performance-agent',
  {
    problem: 'Database query performance',
    solution: 'Add composite index on frequently queried columns',
    expectedImprovement: '70% faster queries',
    implementation: 'CREATE INDEX idx_users_email_status ON users(email, status)'
  },
  'performance-optimization',
  ['database', 'solution']
);

// Backend agent retrieves solution
const solutions = await manager.queryMemory({
  agentName: 'backend-agent',
  type: 'semantic',
  tags: ['solution', 'database']
});

console.log('Solution found:', solutions[0].content.solution);
```

### Example 3: Cross-Team Learning

```typescript
// QA agent learns testing best practices
await manager.learnPattern(
  'qa-agent',
  {
    pattern: 'Comprehensive API Testing',
    categories: [
      'Functional testing',
      'Error handling',
      'Performance testing',
      'Security testing'
    ],
    coverage: '90%+',
    tools: ['Jest', 'Supertest', 'Artillery']
  },
  'testing',
  ['testing', 'api', 'shared']
);

// Documentation agent retrieves for documentation
const testingPatterns = await manager.queryMemory({
  type: 'semantic',
  tags: ['testing', 'shared'],
  limit: 5
});

// Documentation agent creates docs
console.log('Testing patterns for documentation:', testingPatterns);
```

---

## Advanced Memory Examples

### Example 1: Memory Export and Backup

```typescript
// Export all agent memory
const exported = await manager.export('backend-agent');

// Save to file
const fs = require('fs');
fs.writeFileSync(
  'backend-agent-memory-backup.json',
  JSON.stringify(exported, null, 2)
);

console.log('Memory exported and backed up');

// Later, restore from backup
const backup = JSON.parse(
  fs.readFileSync('backend-agent-memory-backup.json', 'utf-8')
);
await manager.import(backup);

console.log('Memory restored from backup');
```

### Example 2: Memory Analysis

```typescript
// Analyze memory usage patterns
const stats = await manager.getMemoryStats('backend-agent');

console.log('=== Memory Analysis ===');
console.log(`Working Memory: ${stats.workingMemorySize} entries`);
console.log(`Episodic Memory: ${stats.episodicMemorySize} entries`);
console.log(`Semantic Memory: ${stats.semanticMemorySize} entries`);
console.log(`Total: ${stats.totalEntries} entries`);
console.log(`Average Relevance: ${stats.averageRelevance.toFixed(2)}`);
console.log(`Oldest Entry: ${stats.oldestEntry}`);
console.log(`Newest Entry: ${stats.newestEntry}`);

// Calculate memory efficiency
const totalSize = stats.workingMemorySize + stats.episodicMemorySize + stats.semanticMemorySize;
const avgRelevance = stats.averageRelevance;
const efficiency = (avgRelevance * 100).toFixed(1);

console.log(`\nMemory Efficiency: ${efficiency}%`);
```

### Example 3: Relevance-Based Filtering

```typescript
// Get only high-relevance memories
const important = await manager.queryMemory({
  agentName: 'backend-agent',
  minRelevance: 0.85,
  limit: 20
});

console.log(`Important memories: ${important.length}`);

// Get medium-relevance memories
const moderate = await manager.queryMemory({
  agentName: 'backend-agent',
  minRelevance: 0.6,
  limit: 20
});

console.log(`Moderate memories: ${moderate.length}`);

// Get all memories
const all = await manager.queryMemory({
  agentName: 'backend-agent',
  limit: 100
});

console.log(`Total memories: ${all.length}`);
```

### Example 4: Memory Cleanup

```typescript
// Clear working memory after task completion
const cleared = await manager.clearAgentMemory(
  'backend-agent',
  'working'
);

console.log(`Cleared ${cleared} working memory entries`);

// Archive old episodic memories
const stats = await manager.getMemoryStats('backend-agent');
if (stats.episodicMemorySize > 5000) {
  const result = await manager.consolidate('backend-agent');
  console.log(`Archived ${result.archived} old entries`);
}
```

### Example 5: Memory Integration with RAG

```typescript
import { RetrievalEngine } from './src/rag/retrieval-engine';

// Store retrieved context in memory
const context = await retrievalEngine.getRelevantContext(
  'How to implement authentication?',
  5
);

await manager.recordEpisode(
  'backend-agent',
  {
    action: 'rag_retrieval',
    query: 'How to implement authentication?',
    context: context,
    timestamp: new Date()
  },
  0.8,
  ['rag', 'context', 'authentication']
);

// Later, recall this context
const memories = await manager.queryMemory({
  agentName: 'backend-agent',
  tags: ['rag', 'authentication'],
  limit: 5
});

console.log('Retrieved context from memory:', memories);
```

---

## Real-World Scenarios

### Scenario 1: Development Task Workflow

```typescript
// 1. Start task - working memory
const task = manager.addToWorking('backend-agent', {
  taskId: 'TASK-123',
  title: 'Implement user authentication',
  status: 'started'
});

// 2. Record progress - working memory updates
manager.addToWorking('backend-agent', {
  taskId: 'TASK-123',
  status: 'in-progress',
  currentStep: 'schema design'
});

// 3. Complete task - record in episodic
await manager.recordEpisode(
  'backend-agent',
  {
    action: 'task_completed',
    taskId: 'TASK-123',
    duration: 3600000,
    result: 'success'
  },
  0.9,
  ['task', 'success']
);

// 4. Learn pattern - semantic memory
await manager.learnPattern(
  'backend-agent',
  {
    pattern: 'Authentication implementation',
    steps: ['Schema design', 'Endpoint implementation', 'Testing'],
    timeEstimate: 3600000
  },
  'authentication',
  ['pattern', 'authentication']
);

// 5. Clear working memory
await manager.clearAgentMemory('backend-agent', 'working');
```

### Scenario 2: Error Recovery

```typescript
try {
  // Attempt operation
  await riskyOperation();
} catch (error) {
  // 1. Record error
  await manager.recordEpisode(
    'backend-agent',
    {
      action: 'error_occurred',
      error: error.message,
      context: 'api_development'
    },
    0.8,
    ['error']
  );

  // 2. Learn from error
  await manager.learnPattern(
    'backend-agent',
    {
      errorType: error.name,
      cause: 'Identified cause',
      solution: 'Implement retry logic',
      prevention: 'Add input validation'
    },
    'error-handling',
    ['error', 'lesson-learned']
  );

  // 3. Query similar errors
  const similar = await manager.queryMemory({
    agentName: 'backend-agent',
    tags: ['error'],
    limit: 5
  });

  console.log('Similar past errors:', similar.length);
}
```

---

## Best Practices Summary

1. **Use appropriate memory types** - Working for current context, episodic for history, semantic for patterns
2. **Tag consistently** - Use hierarchical tags for better organization
3. **Update relevance** - Mark important memories with high relevance scores
4. **Consolidate regularly** - Run consolidation to manage memory size
5. **Export backups** - Periodically backup important memories
6. **Clean old data** - Archive or delete outdated memories
7. **Share knowledge** - Use semantic memory for cross-agent learning
8. **Monitor stats** - Track memory usage and consolidation results

---

**Last Updated**: 2026-04-16  
**Status**: Production Ready  
**Maintainer**: AI Agent Team