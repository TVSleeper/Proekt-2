# Tool Registry API Documentation

**Module**: `src/tools/registry.ts`  
**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2026-04-16

---

## Overview

The Tool Registry is a centralized system for managing tool registration, discovery, and lifecycle management. It provides semantic versioning support, dependency tracking, and tool categorization.

### Key Features

- **Tool Registration** - Register tools with metadata and versioning
- **Semantic Versioning** - Support for major.minor.patch versioning
- **Lifecycle Management** - Active, deprecated, and archived states
- **Dependency Tracking** - Track tool dependencies and dependents
- **Discovery** - Search and filter tools by various criteria
- **Usage Tracking** - Monitor tool usage and ratings
- **Event Emission** - Real-time events for registry changes

---

## Core Types

### SemanticVersion

```typescript
interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}
```

Represents a semantic version (e.g., 1.2.3).

### ToolMetadata

```typescript
interface ToolMetadata {
  name: string;
  version: SemanticVersion;
  description: string;
  author?: string;
  category?: string;
  tags?: string[];
  capabilities?: string[];
  requirements?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;
  replacedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Contains tool metadata and information.

### RegisteredTool

```typescript
interface RegisteredTool {
  id: string;
  metadata: ToolMetadata;
  state: ToolLifecycleState;
  dependencies: string[];
  dependents: string[];
  usageCount: number;
  lastUsed?: Date;
  rating?: number;
}
```

Represents a registered tool with full state information.

### ToolRegistrationRequest

```typescript
interface ToolRegistrationRequest {
  name: string;
  version: string; // "major.minor.patch"
  description: string;
  author?: string;
  category?: string;
  tags?: string[];
  capabilities?: string[];
  requirements?: string[];
  dependencies?: string[];
}
```

Request object for registering a new tool.

### ToolSearchCriteria

```typescript
interface ToolSearchCriteria {
  name?: string;
  category?: string;
  tags?: string[];
  capabilities?: string[];
  state?: ToolLifecycleState;
  author?: string;
  minVersion?: SemanticVersion;
  maxVersion?: SemanticVersion;
}
```

Criteria for searching tools.

---

## API Methods

### Constructor

```typescript
constructor()
```

Creates a new Tool Registry instance.

**Example:**
```typescript
import { ToolRegistry } from './src/tools/registry';

const registry = new ToolRegistry();
```

---

### registerTool()

```typescript
registerTool(request: ToolRegistrationRequest): RegisteredTool
```

Registers a new tool in the registry.

**Parameters:**
- `request` - Tool registration request with metadata

**Returns:** Registered tool object

**Throws:**
- `Error` - If tool name is empty
- `Error` - If tool already exists
- `Error` - If dependencies not found

**Example:**
```typescript
const tool = registry.registerTool({
  name: 'data-processor',
  version: '1.0.0',
  description: 'Processes data efficiently',
  author: 'John Doe',
  category: 'data-processing',
  tags: ['data', 'processing', 'fast'],
  capabilities: ['transform', 'filter', 'aggregate'],
  requirements: ['Node.js 18+'],
  dependencies: []
});

console.log(tool.id); // 'data-processor@1.0.0'
```

---

### getTool()

```typescript
getTool(toolId: string): RegisteredTool | undefined
```

Retrieves a tool by its ID.

**Parameters:**
- `toolId` - Tool ID (format: "name@version")

**Returns:** Registered tool or undefined if not found

**Example:**
```typescript
const tool = registry.getTool('data-processor@1.0.0');
if (tool) {
  console.log(tool.metadata.description);
}
```

---

### getToolVersions()

```typescript
getToolVersions(name: string): RegisteredTool[]
```

Gets all versions of a tool, sorted by version (newest first).

**Parameters:**
- `name` - Tool name

**Returns:** Array of registered tools, sorted by version descending

**Example:**
```typescript
const versions = registry.getToolVersions('data-processor');
console.log(versions.map(v => v.metadata.version));
// Output: [{major: 2, minor: 0, patch: 0}, {major: 1, minor: 0, patch: 0}]
```

---

### getLatestTool()

```typescript
getLatestTool(name: string): RegisteredTool | undefined
```

Gets the latest version of a tool.

**Parameters:**
- `name` - Tool name

**Returns:** Latest registered tool or undefined if not found

**Example:**
```typescript
const latest = registry.getLatestTool('data-processor');
if (latest) {
  console.log(`Latest version: ${latest.metadata.version.major}.${latest.metadata.version.minor}.${latest.metadata.version.patch}`);
}
```

---

### searchTools()

```typescript
searchTools(criteria: ToolSearchCriteria): RegisteredTool[]
```

Searches tools based on criteria.

**Parameters:**
- `criteria` - Search criteria object

**Returns:** Array of matching tools

**Example:**
```typescript
const results = registry.searchTools({
  category: 'data-processing',
  tags: ['fast'],
  state: 'active'
});

console.log(`Found ${results.length} tools`);
```

---

### updateToolState()

```typescript
updateToolState(toolId: string, state: ToolLifecycleState, message?: string): RegisteredTool
```

Updates the lifecycle state of a tool.

**Parameters:**
- `toolId` - Tool ID
- `state` - New state ('active', 'deprecated', 'archived')
- `message` - Optional message for state change

**Returns:** Updated tool

**Throws:**
- `Error` - If tool not found

**Example:**
```typescript
const updated = registry.updateToolState(
  'data-processor@1.0.0',
  'deprecated',
  'Use data-processor@2.0.0 instead'
);
```

---

### deprecateTool()

```typescript
deprecateTool(toolId: string, replacedBy?: string, message?: string): RegisteredTool
```

Marks a tool as deprecated.

**Parameters:**
- `toolId` - Tool ID
- `replacedBy` - Optional ID of replacement tool
- `message` - Optional deprecation message

**Returns:** Updated tool

**Example:**
```typescript
const deprecated = registry.deprecateTool(
  'data-processor@1.0.0',
  'data-processor@2.0.0',
  'Version 1.0.0 is no longer supported'
);
```

---

### recordUsage()

```typescript
recordUsage(toolId: string): void
```

Records that a tool was used.

**Parameters:**
- `toolId` - Tool ID

**Example:**
```typescript
registry.recordUsage('data-processor@1.0.0');
```

---

### rateTool()

```typescript
rateTool(toolId: string, rating: number): RegisteredTool
```

Rates a tool (0-5 stars).

**Parameters:**
- `toolId` - Tool ID
- `rating` - Rating from 0 to 5

**Returns:** Updated tool

**Throws:**
- `Error` - If rating not between 0 and 5

**Example:**
```typescript
const rated = registry.rateTool('data-processor@1.0.0', 4.5);
console.log(`Tool rated: ${rated.rating} stars`);
```

---

### getToolsByCategory()

```typescript
getToolsByCategory(category: string): RegisteredTool[]
```

Gets all tools in a category.

**Parameters:**
- `category` - Category name

**Returns:** Array of tools in category

**Example:**
```typescript
const dataTools = registry.getToolsByCategory('data-processing');
console.log(`Found ${dataTools.length} data processing tools`);
```

---

### getToolsByTag()

```typescript
getToolsByTag(tag: string): RegisteredTool[]
```

Gets all tools with a specific tag.

**Parameters:**
- `tag` - Tag name

**Returns:** Array of tools with tag

**Example:**
```typescript
const fastTools = registry.getToolsByTag('fast');
console.log(`Found ${fastTools.length} fast tools`);
```

---

### getToolsByCapability()

```typescript
getToolsByCapability(capability: string): RegisteredTool[]
```

Gets all tools with a specific capability.

**Parameters:**
- `capability` - Capability name

**Returns:** Array of tools with capability

**Example:**
```typescript
const transformTools = registry.getToolsByCapability('transform');
console.log(`Found ${transformTools.length} tools that can transform data`);
```

---

### getAllTools()

```typescript
getAllTools(): RegisteredTool[]
```

Gets all registered tools.

**Returns:** Array of all tools

**Example:**
```typescript
const allTools = registry.getAllTools();
console.log(`Total tools: ${allTools.length}`);
```

---

### getStatistics()

```typescript
getStatistics(): {
  totalTools: number;
  activeTools: number;
  deprecatedTools: number;
  archivedTools: number;
  totalUsage: number;
  avgRating: number;
  categories: number;
  tags: number;
  capabilities: number;
}
```

Gets registry statistics.

**Returns:** Statistics object

**Example:**
```typescript
const stats = registry.getStatistics();
console.log(`Active tools: ${stats.activeTools}`);
console.log(`Average rating: ${stats.avgRating.toFixed(1)} stars`);
console.log(`Total usage: ${stats.totalUsage} times`);
```

---

## Events

The registry emits events for various operations:

### tool:registered

Emitted when a tool is registered.

```typescript
registry.on('tool:registered', (event) => {
  console.log(`Tool registered: ${event.toolId}`);
});
```

### tool:state-changed

Emitted when a tool's state changes.

```typescript
registry.on('tool:state-changed', (event) => {
  console.log(`Tool ${event.toolId} changed from ${event.oldState} to ${event.newState}`);
});
```

### tool:used

Emitted when a tool is used.

```typescript
registry.on('tool:used', (event) => {
  console.log(`Tool ${event.toolId} used ${event.usageCount} times`);
});
```

### tool:rated

Emitted when a tool is rated.

```typescript
registry.on('tool:rated', (event) => {
  console.log(`Tool ${event.toolId} rated: ${event.rating} stars`);
});
```

---

## Usage Examples

### Complete Workflow

```typescript
import { ToolRegistry } from './src/tools/registry';

// Create registry
const registry = new ToolRegistry();

// Register tools
const tool1 = registry.registerTool({
  name: 'data-processor',
  version: '1.0.0',
  description: 'Processes data efficiently',
  category: 'data-processing',
  tags: ['data', 'fast'],
  capabilities: ['transform', 'filter']
});

const tool2 = registry.registerTool({
  name: 'data-processor',
  version: '2.0.0',
  description: 'Improved data processor',
  category: 'data-processing',
  tags: ['data', 'fast', 'improved'],
  capabilities: ['transform', 'filter', 'aggregate']
});

// Deprecate old version
registry.deprecateTool(
  'data-processor@1.0.0',
  'data-processor@2.0.0',
  'Use version 2.0.0 for better performance'
);

// Search for tools
const activeTools = registry.searchTools({
  category: 'data-processing',
  state: 'active'
});

// Get latest version
const latest = registry.getLatestTool('data-processor');

// Record usage
registry.recordUsage(latest.id);

// Rate tool
registry.rateTool(latest.id, 4.5);

// Get statistics
const stats = registry.getStatistics();
console.log(`Registry has ${stats.totalTools} tools`);
console.log(`Average rating: ${stats.avgRating.toFixed(1)} stars`);
```

---

## Best Practices

1. **Use Semantic Versioning** - Always use major.minor.patch format
2. **Provide Metadata** - Include description, author, and tags for discoverability
3. **Track Dependencies** - Specify tool dependencies for proper resolution
4. **Deprecate Properly** - Always provide replacement tool when deprecating
5. **Monitor Usage** - Use recordUsage() to track tool popularity
6. **Rate Tools** - Encourage users to rate tools for quality feedback

---

## Error Handling

```typescript
try {
  const tool = registry.registerTool({
    name: 'my-tool',
    version: '1.0.0',
    description: 'My tool'
  });
} catch (error) {
  if (error.message.includes('already registered')) {
    console.log('Tool already exists');
  } else if (error.message.includes('Dependency')) {
    console.log('Missing dependency');
  } else {
    console.log('Registration failed:', error.message);
  }
}
```

---

## Performance Considerations

- **Search Performance**: O(n) where n is number of tools
- **Lookup Performance**: O(1) for getTool() by ID
- **Version Lookup**: O(m log m) where m is number of versions
- **Memory Usage**: Minimal - only metadata stored

---

## Related Documentation

- [Memory Systems API](./memory-systems.md)
- [Tool Discovery API](./tool-discovery.md)
- [RAG Retrieval API](./rag-retrieval.md)

---

**Last Updated**: 2026-04-16  
**Status**: Production Ready  
**Maintainer**: AI Agent Team