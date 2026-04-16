# Memory Systems API Documentation

**Module**: `src/memory/`  
**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2026-04-16

---

## Overview

The Memory Systems provide a multi-tiered approach to storing and retrieving information for AI agents. The system consists of three primary memory types: Working Memory (short-term), Episodic Memory (experiences), and Semantic Memory (knowledge). These systems work together to enable agents to reason effectively, learn from past interactions, and maintain context across conversations.

### Key Features

- **Working Memory** - Temporary storage for current task context
- **Episodic Memory** - Persistent storage of past interactions and decisions
- **Semantic Memory** - Long-term knowledge base and learned patterns
- **Memory Manager** - Unified interface for all memory operations
- **Consolidation** - Automatic promotion of important memories
- **Retrieval** - Fast lookup with relevance scoring
- **Expiration** - Automatic cleanup of stale memories
- **Isolation** - Per-agent memory boundaries

---

## Core Types

### MemoryType

```typescript
enum MemoryType {
  WORKING = 'working',
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
}
```

Defines the three memory types in the system.

### MemoryEntry

```typescript
interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: any;
  metadata: {
    agentName: string;
    timestamp: Date;
    relevance?: number;
    tags?: string[];
  };
  expiresAt?: Date;
}
```

Represents a single memory entry with metadata.

### MemoryQuery

```typescript
interface MemoryQuery {
  agentName: string;
  type?: MemoryType;
  tags?: string[];
  limit?: number;
  minRelevance?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
}
```

Query object for retrieving memories.

### MemoryConsolidationConfig

```typescript
interface MemoryConsolidationConfig {
  enabled: boolean;
  interval: number; // milliseconds
  minRelevance: number;
  maxWorkingMemorySize: number;
  maxEpisodicMemorySize: number;
}
```

Configuration for memory consolidation process.

### MemoryStats

```typescript
interface MemoryStats {
  workingMemorySize: number;
  episodicMemorySize: number;
  semanticMemorySize: number;
  totalEntries: number;
  averageRelevance: number;
  oldestEntry: Date;
  newestEntry: Date;
}
```

Statistics about memory usage.

---

## Working Memory API

Working Memory stores the current task context and immediate state. It's temporary and cleared between tasks.

### Constructor

```typescript
constructor(maxSize: number = 100)
```

Creates a new WorkingMemory instance.

**Parameters:**
- `maxSize` - Maximum number of entries (default: 100)

**Example:**
```typescript
import { WorkingMemory } from './src/memory/working-memory';

const workingMemory = new WorkingMemory(100);
```

---

### add()

```typescript
add(agentName: string, content: any, tags?: string[]): MemoryEntry
```

Adds an entry to working memory.

**Parameters:**
- `agentName` - Name of the agent
- `content` - Content to store
- `tags` - Optional tags for categorization

**Returns:** Created memory entry

**Example:**
```typescript
const entry = workingMemory.add(
  'backend-agent',
  { task: 'Create API endpoint', status: 'in-progress' },
  ['api', 'backend']
);

console.log(entry.id); // Generated UUID
```

---

### get()

```typescript
get(id: string): MemoryEntry | undefined
```

Retrieves a specific memory entry by ID.

**Parameters:**
- `id` - Memory entry ID

**Returns:** Memory entry or undefined if not found

**Example:**
```typescript
const entry = workingMemory.get('memory-id-123');
if (entry) {
  console.log(entry.content);
}
```

---

### query()

```typescript
query(agentName: string, tags?: string[]): MemoryEntry[]
```

Queries working memory for entries matching criteria.

**Parameters:**
- `agentName` - Agent name to filter by
- `tags` - Optional tags to filter by

**Returns:** Array of matching entries

**Example:**
```typescript
const entries = workingMemory.query('backend-agent', ['api']);
console.log(`Found ${entries.length} API-related entries`);
```

---

### update()

```typescript
update(id: string, content: any): MemoryEntry
```

Updates an existing memory entry.

**Parameters:**
- `id` - Memory entry ID
- `content` - New content

**Returns:** Updated memory entry

**Throws:**
- `Error` - If entry not found

**Example:**
```typescript
const updated = workingMemory.update('memory-id-123', {
  task: 'Create API endpoint',
  status: 'completed'
});
```

---

### remove()

```typescript
remove(id: string): boolean
```

Removes a memory entry.

**Parameters:**
- `id` - Memory entry ID

**Returns:** True if removed, false if not found

**Example:**
```typescript
const removed = workingMemory.remove('memory-id-123');
console.log(removed ? 'Entry removed' : 'Entry not found');
```

---

### clear()

```typescript
clear(agentName?: string): number
```

Clears all entries or entries for a specific agent.

**Parameters:**
- `agentName` - Optional agent name to clear only that agent's entries

**Returns:** Number of entries cleared

**Example:**
```typescript
const cleared = workingMemory.clear('backend-agent');
console.log(`Cleared ${cleared} entries`);
```

---

### getSize()

```typescript
getSize(): number
```

Gets the current number of entries in working memory.

**Returns:** Number of entries

**Example:**
```typescript
const size = workingMemory.getSize();
console.log(`Working memory has ${size} entries`);
```

---

## Episodic Memory API

Episodic Memory stores past interactions, decisions, and results. It persists across sessions.

### Constructor

```typescript
constructor(storePath: string = './episodic-storage')
```

Creates a new EpisodicMemory instance.

**Parameters:**
- `storePath` - Path to storage directory

**Example:**
```typescript
import { EpisodicMemory } from './src/memory/episodic-memory';

const episodicMemory = new EpisodicMemory('./episodic-storage');
```

---

### record()

```typescript
record(agentName: string, event: any, relevance?: number, tags?: string[]): Promise<MemoryEntry>
```

Records an event in episodic memory.

**Parameters:**
- `agentName` - Name of the agent
- `event` - Event data to record
- `relevance` - Relevance score (0-1)
- `tags` - Optional tags

**Returns:** Promise resolving to created memory entry

**Example:**
```typescript
const entry = await episodicMemory.record(
  'backend-agent',
  {
    action: 'created_endpoint',
    endpoint: '/api/users',
    method: 'POST',
    result: 'success'
  },
  0.9,
  ['api', 'success']
);
```

---

### retrieve()

```typescript
retrieve(query: MemoryQuery): Promise<MemoryEntry[]>
```

Retrieves memories matching query criteria.

**Parameters:**
- `query` - Query object with filters

**Returns:** Promise resolving to array of matching entries

**Example:**
```typescript
const memories = await episodicMemory.retrieve({
  agentName: 'backend-agent',
  tags: ['api'],
  limit: 10,
  minRelevance: 0.7
});

console.log(`Found ${memories.length} relevant API memories`);
```

---

### getByTimeRange()

```typescript
getByTimeRange(agentName: string, start: Date, end: Date): Promise<MemoryEntry[]>
```

Retrieves memories within a time range.

**Parameters:**
- `agentName` - Agent name
- `start` - Start date
- `end` - End date

**Returns:** Promise resolving to array of entries

**Example:**
```typescript
const today = new Date();
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

const memories = await episodicMemory.getByTimeRange(
  'backend-agent',
  yesterday,
  today
);

console.log(`Found ${memories.length} memories from yesterday`);
```

---

### updateRelevance()

```typescript
updateRelevance(id: string, relevance: number): Promise<MemoryEntry>
```

Updates the relevance score of a memory.

**Parameters:**
- `id` - Memory entry ID
- `relevance` - New relevance score (0-1)

**Returns:** Promise resolving to updated entry

**Example:**
```typescript
const updated = await episodicMemory.updateRelevance('memory-id-123', 0.95);
console.log(`Updated relevance to ${updated.metadata.relevance}`);
```

---

### delete()

```typescript
delete(id: string): Promise<boolean>
```

Deletes a memory entry.

**Parameters:**
- `id` - Memory entry ID

**Returns:** Promise resolving to true if deleted

**Example:**
```typescript
const deleted = await episodicMemory.delete('memory-id-123');
console.log(deleted ? 'Memory deleted' : 'Memory not found');
```

---

### getStats()

```typescript
getStats(agentName?: string): Promise<MemoryStats>
```

Gets statistics about episodic memory.

**Parameters:**
- `agentName` - Optional agent name to get stats for specific agent

**Returns:** Promise resolving to statistics object

**Example:**
```typescript
const stats = await episodicMemory.getStats('backend-agent');
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Average relevance: ${stats.averageRelevance.toFixed(2)}`);
```

---

## Semantic Memory API

Semantic Memory stores learned patterns, best practices, and domain knowledge.

### Constructor

```typescript
constructor(storePath: string = './semantic-storage')
```

Creates a new SemanticMemory instance.

**Parameters:**
- `storePath` - Path to storage directory

**Example:**
```typescript
import { SemanticMemory } from './src/memory/semantic-memory';

const semanticMemory = new SemanticMemory('./semantic-storage');
```

---

### learn()

```typescript
learn(agentName: string, pattern: any, category: string, tags?: string[]): Promise<MemoryEntry>
```

Records a learned pattern or best practice.

**Parameters:**
- `agentName` - Name of the agent
- `pattern` - Pattern or knowledge to learn
- `category` - Category for organization
- `tags` - Optional tags

**Returns:** Promise resolving to created entry

**Example:**
```typescript
const entry = await semanticMemory.learn(
  'backend-agent',
  {
    pattern: 'RESTful API design',
    principles: ['resource-oriented', 'stateless', 'cacheable'],
    example: 'GET /api/users/:id'
  },
  'api-design',
  ['rest', 'best-practice']
);
```

---

### recall()

```typescript
recall(category: string, tags?: string[]): Promise<MemoryEntry[]>
```

Recalls learned patterns by category and tags.

**Parameters:**
- `category` - Category to recall from
- `tags` - Optional tags to filter by

**Returns:** Promise resolving to array of entries

**Example:**
```typescript
const patterns = await semanticMemory.recall('api-design', ['rest']);
console.log(`Found ${patterns.length} REST API patterns`);
```

---

### search()

```typescript
search(query: string, limit?: number): Promise<MemoryEntry[]>
```

Searches semantic memory by content.

**Parameters:**
- `query` - Search query string
- `limit` - Maximum results (default: 10)

**Returns:** Promise resolving to array of matching entries

**Example:**
```typescript
const results = await semanticMemory.search('error handling', 5);
console.log(`Found ${results.length} error handling patterns`);
```

---

### getCategories()

```typescript
getCategories(): Promise<string[]>
```

Gets all available categories.

**Returns:** Promise resolving to array of category names

**Example:**
```typescript
const categories = await semanticMemory.getCategories();
console.log('Available categories:', categories);
// Output: ['api-design', 'testing', 'performance', ...]
```

---

### updatePattern()

```typescript
updatePattern(id: string, pattern: any): Promise<MemoryEntry>
```

Updates a learned pattern.

**Parameters:**
- `id` - Memory entry ID
- `pattern` - Updated pattern

**Returns:** Promise resolving to updated entry

**Example:**
```typescript
const updated = await semanticMemory.updatePattern('pattern-id-123', {
  pattern: 'RESTful API design v2',
  principles: ['resource-oriented', 'stateless', 'cacheable', 'versioned']
});
```

---

### deletePattern()

```typescript
deletePattern(id: string): Promise<boolean>
```

Deletes a learned pattern.

**Parameters:**
- `id` - Memory entry ID

**Returns:** Promise resolving to true if deleted

**Example:**
```typescript
const deleted = await semanticMemory.deletePattern('pattern-id-123');
console.log(deleted ? 'Pattern deleted' : 'Pattern not found');
```

---

## Memory Manager API

The Memory Manager provides a unified interface for all memory operations.

### Constructor

```typescript
constructor(config?: MemoryConsolidationConfig)
```

Creates a new MemoryManager instance.

**Parameters:**
- `config` - Optional consolidation configuration

**Example:**
```typescript
import { MemoryManager } from './src/memory/memory-manager';

const manager = new MemoryManager({
  enabled: true,
  interval: 3600000, // 1 hour
  minRelevance: 0.7,
  maxWorkingMemorySize: 100,
  maxEpisodicMemorySize: 10000
});
```

---

### addToWorking()

```typescript
addToWorking(agentName: string, content: any, tags?: string[]): MemoryEntry
```

Adds entry to working memory.

**Parameters:**
- `agentName` - Agent name
- `content` - Content to store
- `tags` - Optional tags

**Returns:** Created memory entry

**Example:**
```typescript
const entry = manager.addToWorking(
  'backend-agent',
  { currentTask: 'API development' },
  ['task']
);
```

---

### recordEpisode()

```typescript
recordEpisode(agentName: string, event: any, relevance?: number, tags?: string[]): Promise<MemoryEntry>
```

Records an episode in episodic memory.

**Parameters:**
- `agentName` - Agent name
- `event` - Event data
- `relevance` - Relevance score
- `tags` - Optional tags

**Returns:** Promise resolving to created entry

**Example:**
```typescript
const entry = await manager.recordEpisode(
  'backend-agent',
  { action: 'completed_task', duration: 3600 },
  0.85,
  ['completed']
);
```

---

### learnPattern()

```typescript
learnPattern(agentName: string, pattern: any, category: string, tags?: string[]): Promise<MemoryEntry>
```

Records a learned pattern in semantic memory.

**Parameters:**
- `agentName` - Agent name
- `pattern` - Pattern to learn
- `category` - Category
- `tags` - Optional tags

**Returns:** Promise resolving to created entry

**Example:**
```typescript
const entry = await manager.learnPattern(
  'backend-agent',
  { technique: 'caching', benefit: 'performance' },
  'optimization',
  ['performance']
);
```

---

### queryMemory()

```typescript
queryMemory(query: MemoryQuery): Promise<MemoryEntry[]>
```

Queries all memory types.

**Parameters:**
- `query` - Query object

**Returns:** Promise resolving to matching entries

**Example:**
```typescript
const results = await manager.queryMemory({
  agentName: 'backend-agent',
  tags: ['api'],
  limit: 20,
  minRelevance: 0.7
});
```

---

### consolidate()

```typescript
consolidate(agentName?: string): Promise<ConsolidationResult>
```

Manually triggers memory consolidation.

**Parameters:**
- `agentName` - Optional agent name to consolidate only that agent's memory

**Returns:** Promise resolving to consolidation result

**Example:**
```typescript
const result = await manager.consolidate('backend-agent');
console.log(`Promoted ${result.promoted} entries to episodic memory`);
console.log(`Archived ${result.archived} old entries`);
```

---

### getMemoryStats()

```typescript
getMemoryStats(agentName?: string): Promise<MemoryStats>
```

Gets statistics about all memory types.

**Parameters:**
- `agentName` - Optional agent name

**Returns:** Promise resolving to statistics

**Example:**
```typescript
const stats = await manager.getMemoryStats('backend-agent');
console.log(`Working memory: ${stats.workingMemorySize} entries`);
console.log(`Episodic memory: ${stats.episodicMemorySize} entries`);
console.log(`Semantic memory: ${stats.semanticMemorySize} entries`);
```

---

### clearAgentMemory()

```typescript
clearAgentMemory(agentName: string, type?: MemoryType): Promise<number>
```

Clears memory for an agent.

**Parameters:**
- `agentName` - Agent name
- `type` - Optional memory type to clear only that type

**Returns:** Promise resolving to number of entries cleared

**Example:**
```typescript
const cleared = await manager.clearAgentMemory('backend-agent', 'working');
console.log(`Cleared ${cleared} working memory entries`);
```

---

## Usage Examples

### Example 1: Task Context Management

```typescript
import { MemoryManager } from './src/memory/memory-manager';

const manager = new MemoryManager();

// Agent starts a new task
const taskEntry = manager.addToWorking('backend-agent', {
  taskId: 'task-123',
  title: 'Create user API',
  status: 'started',
  startTime: new Date()
});

// Update task progress
manager.addToWorking('backend-agent', {
  taskId: 'task-123',
  status: 'in-progress',
  currentStep: 'schema design'
});

// Query current task context
const context = await manager.queryMemory({
  agentName: 'backend-agent',
  type: 'working'
});

console.log('Current context:', context);
```

---

### Example 2: Learning from Experience

```typescript
// Record successful API design
await manager.recordEpisode(
  'backend-agent',
  {
    action: 'designed_api',
    endpoint: '/api/users',
    design: 'RESTful',
    result: 'success',
    duration: 1800
  },
  0.9,
  ['api', 'success']
);

// Learn the pattern
await manager.learnPattern(
  'backend-agent',
  {
    pattern: 'RESTful endpoint design',
    steps: [
      'Define resource',
      'Choose HTTP methods',
      'Design request/response',
      'Add validation'
    ],
    timeEstimate: 1800
  },
  'api-design',
  ['rest', 'best-practice']
);

// Later, recall the pattern
const patterns = await manager.queryMemory({
  type: 'semantic',
  tags: ['rest']
});

console.log('Learned patterns:', patterns);
```

---

### Example 3: Multi-Agent Coordination

```typescript
// Backend agent records decision
await manager.recordEpisode(
  'backend-agent',
  {
    decision: 'use_postgresql',
    reasoning: 'ACID compliance needed',
    alternatives: ['mongodb', 'dynamodb']
  },
  0.95,
  ['database', 'decision']
);

// Frontend agent queries backend decisions
const decisions = await manager.queryMemory({
  agentName: 'backend-agent',
  tags: ['decision'],
  minRelevance: 0.9
});

// Frontend agent learns from backend's decision
for (const decision of decisions) {
  await manager.learnPattern(
    'frontend-agent',
    {
      backendDecision: decision.content,
      implication: 'Use REST API with JSON'
    },
    'backend-integration',
    ['coordination']
  );
}
```

---

### Example 4: Memory Consolidation

```typescript
// Simulate agent working on multiple tasks
for (let i = 0; i < 50; i++) {
  manager.addToWorking('backend-agent', {
    taskId: `task-${i}`,
    status: 'completed'
  });
}

// Check memory size
let stats = await manager.getMemoryStats('backend-agent');
console.log(`Before consolidation: ${stats.workingMemorySize} working entries`);

// Consolidate memory
const result = await manager.consolidate('backend-agent');
console.log(`Promoted ${result.promoted} entries`);
console.log(`Archived ${result.archived} entries`);

// Check memory size after
stats = await manager.getMemoryStats('backend-agent');
console.log(`After consolidation: ${stats.workingMemorySize} working entries`);
```

---

### Example 5: Error Recovery with Memory

```typescript
try {
  // Attempt operation
  await performRiskyOperation();
} catch (error) {
  // Record the error
  await manager.recordEpisode(
    'backend-agent',
    {
      action: 'failed_operation',
      error: error.message,
      timestamp: new Date(),
      context: 'api_development'
    },
    0.8,
    ['error', 'recovery']
  );

  // Learn from error
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

  // Query similar past errors
  const similarErrors = await manager.queryMemory({
    agentName: 'backend-agent',
    tags: ['error'],
    limit: 5
  });

  console.log('Similar past errors:', similarErrors);
}
```

---

### Example 6: Performance Optimization

```typescript
// Record performance metrics
await manager.recordEpisode(
  'backend-agent',
  {
    action: 'api_call',
    endpoint: '/api/users',
    responseTime: 2500,
    status: 'slow'
  },
  0.7,
  ['performance', 'slow']
);

// Query slow operations
const slowOps = await manager.queryMemory({
  agentName: 'backend-agent',
  tags: ['slow'],
  minRelevance: 0.6
});

// Learn optimization pattern
await manager.learnPattern(
  'backend-agent',
  {
    problem: 'Slow API response',
    solutions: [
      'Add database indexing',
      'Implement caching',
      'Optimize query'
    ],
    expectedImprovement: '80%'
  },
  'optimization',
  ['performance']
);
```

---

### Example 7: Cross-Agent Knowledge Sharing

```typescript
// QA agent learns testing patterns
await manager.learnPattern(
  'qa-agent',
  {
    pattern: 'API endpoint testing',
    steps: [
      'Test happy path',
      'Test error cases',
      'Test edge cases',
      'Test performance'
    ]
  },
  'testing',
  ['api', 'testing']
);

// Documentation agent recalls the pattern
const testingPatterns = await manager.queryMemory({
  type: 'semantic',
  tags: ['testing'],
  limit: 10
});

// Documentation agent creates docs based on patterns
for (const pattern of testingPatterns) {
  console.log('Documenting pattern:', pattern.content.pattern);
}
```

---

### Example 8: Time-Based Memory Queries

```typescript
// Get memories from last 24 hours
const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const recentMemories = await manager.queryMemory({
  agentName: 'backend-agent',
  timeRange: {
    start: yesterday,
    end: now
  },
  limit: 50
});

console.log(`Found ${recentMemories.length} memories from last 24 hours`);
```

---

## Best Practices

### 1. Memory Tagging Strategy

Use consistent, hierarchical tags for better organization:

```typescript
// Good: Hierarchical tags
tags: ['api', 'rest', 'users', 'success']

// Avoid: Vague tags
tags: ['stuff', 'thing', 'data']
```

### 2. Relevance Scoring

Set appropriate relevance scores based on importance:

```typescript
// Critical decision: high relevance
await manager.recordEpisode(agentName, event, 0.95, tags);

// Routine operation: medium relevance
await manager.recordEpisode(agentName, event, 0.6, tags);

// Exploratory: low relevance
await manager.recordEpisode(agentName, event, 0.3, tags);
```

### 3. Memory Consolidation

Configure consolidation based on workload:

```typescript
const manager = new MemoryManager({
  enabled: true,
  interval: 3600000, // Consolidate hourly
  minRelevance: 0.7, // Only promote high-relevance items
  maxWorkingMemorySize: 100,
  maxEpisodicMemorySize: 10000
});
```

### 4. Query Optimization

Use specific queries to reduce results:

```typescript
// Efficient: Specific filters
const results = await manager.queryMemory({
  agentName: 'backend-agent',
  type: 'episodic',
  tags: ['api', 'success'],
  minRelevance: 0.8,
  limit: 10
});

// Inefficient: Broad query
const results = await manager.queryMemory({
  agentName: 'backend-agent'
});
```

### 5. Memory Cleanup

Regularly clear old or irrelevant memories:

```typescript
// Clear working memory after task completion
await manager.clearAgentMemory('backend-agent', 'working');

// Archive old episodic memories
const stats = await manager.getMemoryStats('backend-agent');
if (stats.episodicMemorySize > 5000) {
  await manager.consolidate('backend-agent');
}
```

---

## Performance Considerations

- **Working Memory**: O(1) add/get, O(n) query where n is entries
- **Episodic Memory**: O(log n) retrieval with indexing, O(n) search
- **Semantic Memory**: O(1) category lookup, O(n) full search
- **Consolidation**: O(n) where n is working memory size
- **Storage**: Persistent storage for episodic and semantic memory

---

## Error Handling

```typescript
try {
  const entry = await manager.recordEpisode(
    'backend-agent',
    { action: 'test' },
    0.5,
    ['test']
  );
} catch (error) {
  if (error.message.includes('storage')) {
    console.log('Storage error - check disk space');
  } else if (error.message.includes('invalid')) {
    console.log('Invalid memory entry');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

---

## Related Documentation

- [RAG Retrieval API](./rag-retrieval.md)
- [Tool Registry API](./tool-registry.md)
- [Memory Best Practices](../guides/memory-best-practices.md)

---

**Last Updated**: 2026-04-16  
**Status**: Production Ready  
**Maintainer**: AI Agent Team