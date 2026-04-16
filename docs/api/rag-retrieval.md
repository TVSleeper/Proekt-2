# RAG Retrieval API Documentation

**Module**: `src/rag/`  
**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2026-04-16

---

## Overview

The RAG (Retrieval-Augmented Generation) system enables AI agents to retrieve relevant information from a knowledge base to augment their reasoning and generation capabilities. It combines document chunking, embedding generation, semantic search, and ranking algorithms to provide contextually relevant information.

### Key Features

- **Document Chunking** - Intelligent splitting of documents into retrievable chunks
- **Embedding Generation** - Convert text to semantic vectors
- **Vector Storage** - Efficient storage and retrieval of embeddings
- **Semantic Search** - Find relevant documents using similarity matching
- **Ranking Algorithm** - Score and rank results by relevance
- **Metadata Filtering** - Filter results by tags, source, date
- **Batch Processing** - Process multiple documents efficiently
- **Caching** - Cache embeddings and search results
- **Performance Metrics** - Track retrieval performance

---

## Core Types

### DocumentChunk

```typescript
interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    documentId: string;
    chunkIndex: number;
    totalChunks: number;
    timestamp: Date;
    tags?: string[];
    author?: string;
  };
  embedding?: number[];
  relevanceScore?: number;
}
```

Represents a chunk of a document with metadata and embedding.

### ChunkingConfig

```typescript
interface ChunkingConfig {
  chunkSize: number; // characters per chunk
  overlapSize: number; // overlap between chunks
  strategy: 'fixed' | 'semantic' | 'sentence';
  minChunkSize: number;
  maxChunkSize: number;
}
```

Configuration for document chunking strategy.

### EmbeddingConfig

```typescript
interface EmbeddingConfig {
  model: string;
  dimension: number;
  batchSize: number;
  cacheEmbeddings: boolean;
}
```

Configuration for embedding generation.

### RetrievalQuery

```typescript
interface RetrievalQuery {
  query: string;
  limit?: number;
  minScore?: number;
  filters?: {
    tags?: string[];
    source?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  includeMetadata?: boolean;
}
```

Query object for retrieval operations.

### RetrievalResult

```typescript
interface RetrievalResult {
  chunks: DocumentChunk[];
  totalResults: number;
  queryTime: number;
  cacheHit: boolean;
}
```

Result of a retrieval operation.

### RankingConfig

```typescript
interface RankingConfig {
  algorithm: 'bm25' | 'cosine' | 'hybrid';
  weights?: {
    semantic: number;
    keyword: number;
    recency: number;
  };
  boostFactors?: {
    tags?: Record<string, number>;
    sources?: Record<string, number>;
  };
}
```

Configuration for result ranking.

---

## Document Chunking API

### DocumentChunker Class

```typescript
class DocumentChunker {
  constructor(config: ChunkingConfig);
  
  chunk(document: string, metadata: any): DocumentChunk[];
  chunkBatch(documents: Array<{content: string, metadata: any}>): DocumentChunk[];
  getChunkingStats(): ChunkingStats;
}
```

#### Constructor

```typescript
constructor(config: ChunkingConfig)
```

Creates a new DocumentChunker instance.

**Parameters:**
- `config` - Chunking configuration

**Example:**
```typescript
import { DocumentChunker } from './src/rag/chunker';

const chunker = new DocumentChunker({
  chunkSize: 512,
  overlapSize: 50,
  strategy: 'semantic',
  minChunkSize: 100,
  maxChunkSize: 1000
});
```

---

#### chunk()

```typescript
chunk(document: string, metadata: any): DocumentChunk[]
```

Chunks a single document into retrievable pieces.

**Parameters:**
- `document` - Document text to chunk
- `metadata` - Document metadata

**Returns:** Array of document chunks

**Example:**
```typescript
const chunks = chunker.chunk(
  `API Design Best Practices

1. Use RESTful principles
2. Version your APIs
3. Implement proper error handling
4. Add comprehensive documentation`,
  {
    source: 'api-guide.md',
    documentId: 'doc-123',
    author: 'backend-team'
  }
);

console.log(`Created ${chunks.length} chunks`);
chunks.forEach((chunk, i) => {
  console.log(`Chunk ${i}: ${chunk.content.substring(0, 50)}...`);
});
```

---

#### chunkBatch()

```typescript
chunkBatch(documents: Array<{content: string, metadata: any}>): DocumentChunk[]
```

Chunks multiple documents efficiently.

**Parameters:**
- `documents` - Array of documents with metadata

**Returns:** Array of all chunks from all documents

**Example:**
```typescript
const documents = [
  {
    content: 'API Design Guide...',
    metadata: { source: 'api-guide.md', documentId: 'doc-1' }
  },
  {
    content: 'Testing Best Practices...',
    metadata: { source: 'testing-guide.md', documentId: 'doc-2' }
  }
];

const allChunks = chunker.chunkBatch(documents);
console.log(`Created ${allChunks.length} total chunks`);
```

---

#### getChunkingStats()

```typescript
getChunkingStats(): ChunkingStats
```

Gets statistics about chunking operations.

**Returns:** Statistics object

**Example:**
```typescript
const stats = chunker.getChunkingStats();
console.log(`Total chunks created: ${stats.totalChunks}`);
console.log(`Average chunk size: ${stats.averageChunkSize}`);
console.log(`Documents processed: ${stats.documentsProcessed}`);
```

---

## Embedding Generation API

### EmbeddingGenerator Class

```typescript
class EmbeddingGenerator {
  constructor(config: EmbeddingConfig);
  
  generate(text: string): Promise<number[]>;
  generateBatch(texts: string[]): Promise<number[][]>;
  similarity(embedding1: number[], embedding2: number[]): number;
  clearCache(): void;
}
```

#### Constructor

```typescript
constructor(config: EmbeddingConfig)
```

Creates a new EmbeddingGenerator instance.

**Parameters:**
- `config` - Embedding configuration

**Example:**
```typescript
import { EmbeddingGenerator } from './src/rag/embeddings';

const generator = new EmbeddingGenerator({
  model: 'text-embedding-3-small',
  dimension: 1536,
  batchSize: 100,
  cacheEmbeddings: true
});
```

---

#### generate()

```typescript
generate(text: string): Promise<number[]>
```

Generates embedding for a single text.

**Parameters:**
- `text` - Text to embed

**Returns:** Promise resolving to embedding vector

**Example:**
```typescript
const embedding = await generator.generate(
  'RESTful API design principles'
);

console.log(`Embedding dimension: ${embedding.length}`);
console.log(`First 5 values: ${embedding.slice(0, 5)}`);
```

---

#### generateBatch()

```typescript
generateBatch(texts: string[]): Promise<number[][]>
```

Generates embeddings for multiple texts efficiently.

**Parameters:**
- `texts` - Array of texts to embed

**Returns:** Promise resolving to array of embeddings

**Example:**
```typescript
const texts = [
  'API design best practices',
  'Database optimization techniques',
  'Testing strategies'
];

const embeddings = await generator.generateBatch(texts);
console.log(`Generated ${embeddings.length} embeddings`);
```

---

#### similarity()

```typescript
similarity(embedding1: number[], embedding2: number[]): number
```

Calculates cosine similarity between two embeddings.

**Parameters:**
- `embedding1` - First embedding vector
- `embedding2` - Second embedding vector

**Returns:** Similarity score (0-1)

**Example:**
```typescript
const emb1 = await generator.generate('API design');
const emb2 = await generator.generate('REST API');

const score = generator.similarity(emb1, emb2);
console.log(`Similarity: ${(score * 100).toFixed(1)}%`);
```

---

## Vector Storage API

### VectorStore Class

```typescript
class VectorStore {
  constructor(storePath?: string);
  
  add(chunks: DocumentChunk[]): Promise<void>;
  search(embedding: number[], limit?: number): Promise<DocumentChunk[]>;
  delete(chunkId: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): Promise<VectorStoreStats>;
}
```

#### add()

```typescript
add(chunks: DocumentChunk[]): Promise<void>
```

Adds document chunks to vector store.

**Parameters:**
- `chunks` - Array of document chunks with embeddings

**Returns:** Promise that resolves when chunks are stored

**Example:**
```typescript
import { VectorStore } from './src/rag/vector-store';

const store = new VectorStore('./vector-storage');

const chunks = [
  {
    id: 'chunk-1',
    content: 'API design principles...',
    metadata: { source: 'guide.md' },
    embedding: [0.1, 0.2, 0.3, ...]
  }
];

await store.add(chunks);
console.log('Chunks added to vector store');
```

---

#### search()

```typescript
search(embedding: number[], limit?: number): Promise<DocumentChunk[]>
```

Searches for similar chunks using vector similarity.

**Parameters:**
- `embedding` - Query embedding vector
- `limit` - Maximum results (default: 10)

**Returns:** Promise resolving to similar chunks

**Example:**
```typescript
const queryEmbedding = await generator.generate('How to design APIs?');
const results = await store.search(queryEmbedding, 5);

results.forEach(chunk => {
  console.log(`Score: ${chunk.relevanceScore}`);
  console.log(`Content: ${chunk.content.substring(0, 100)}...`);
});
```

---

#### delete()

```typescript
delete(chunkId: string): Promise<boolean>
```

Deletes a chunk from vector store.

**Parameters:**
- `chunkId` - Chunk ID to delete

**Returns:** Promise resolving to true if deleted

**Example:**
```typescript
const deleted = await store.delete('chunk-1');
console.log(deleted ? 'Chunk deleted' : 'Chunk not found');
```

---

#### getStats()

```typescript
getStats(): Promise<VectorStoreStats>
```

Gets statistics about vector store.

**Returns:** Promise resolving to statistics

**Example:**
```typescript
const stats = await store.getStats();
console.log(`Total chunks: ${stats.totalChunks}`);
console.log(`Storage size: ${stats.storageSize} bytes`);
console.log(`Average search time: ${stats.avgSearchTime}ms`);
```

---

## Retrieval Engine API

### RetrievalEngine Class

```typescript
class RetrievalEngine {
  constructor(config: {
    chunker: DocumentChunker;
    embedder: EmbeddingGenerator;
    store: VectorStore;
    ranker: RankingEngine;
  });
  
  ingestDocument(document: string, metadata: any): Promise<void>;
  ingestBatch(documents: Array<{content: string, metadata: any}>): Promise<void>;
  retrieve(query: RetrievalQuery): Promise<RetrievalResult>;
  search(query: string, limit?: number): Promise<DocumentChunk[]>;
  getStats(): Promise<RetrievalStats>;
}
```

#### ingestDocument()

```typescript
ingestDocument(document: string, metadata: any): Promise<void>
```

Ingests a single document into the RAG system.

**Parameters:**
- `document` - Document text
- `metadata` - Document metadata

**Returns:** Promise that resolves when document is ingested

**Example:**
```typescript
import { RetrievalEngine } from './src/rag/retrieval-engine';

const engine = new RetrievalEngine({
  chunker,
  embedder: generator,
  store,
  ranker
});

await engine.ingestDocument(
  `# API Design Guide

## RESTful Principles
- Use HTTP methods correctly
- Resource-oriented design
- Stateless communication`,
  {
    source: 'api-guide.md',
    category: 'documentation',
    tags: ['api', 'design']
  }
);

console.log('Document ingested');
```

---

#### ingestBatch()

```typescript
ingestBatch(documents: Array<{content: string, metadata: any}>): Promise<void>
```

Ingests multiple documents efficiently.

**Parameters:**
- `documents` - Array of documents with metadata

**Returns:** Promise that resolves when all documents are ingested

**Example:**
```typescript
const documents = [
  {
    content: 'API Design Guide...',
    metadata: { source: 'api.md', tags: ['api'] }
  },
  {
    content: 'Testing Guide...',
    metadata: { source: 'testing.md', tags: ['testing'] }
  },
  {
    content: 'Performance Guide...',
    metadata: { source: 'performance.md', tags: ['performance'] }
  }
];

await engine.ingestBatch(documents);
console.log('All documents ingested');
```

---

#### retrieve()

```typescript
retrieve(query: RetrievalQuery): Promise<RetrievalResult>
```

Retrieves relevant documents for a query.

**Parameters:**
- `query` - Retrieval query object

**Returns:** Promise resolving to retrieval result

**Example:**
```typescript
const result = await engine.retrieve({
  query: 'How should I design REST APIs?',
  limit: 5,
  minScore: 0.7,
  filters: {
    tags: ['api', 'design'],
    source: 'documentation'
  },
  includeMetadata: true
});

console.log(`Found ${result.chunks.length} relevant chunks`);
console.log(`Query time: ${result.queryTime}ms`);
console.log(`Cache hit: ${result.cacheHit}`);

result.chunks.forEach((chunk, i) => {
  console.log(`\n${i + 1}. Score: ${chunk.relevanceScore}`);
  console.log(`Source: ${chunk.metadata.source}`);
  console.log(`Content: ${chunk.content.substring(0, 100)}...`);
});
```

---

#### search()

```typescript
search(query: string, limit?: number): Promise<DocumentChunk[]>
```

Simple search interface for quick queries.

**Parameters:**
- `query` - Search query string
- `limit` - Maximum results (default: 10)

**Returns:** Promise resolving to relevant chunks

**Example:**
```typescript
const results = await engine.search('error handling patterns', 5);

results.forEach(chunk => {
  console.log(`${chunk.content.substring(0, 80)}...`);
});
```

---

#### getStats()

```typescript
getStats(): Promise<RetrievalStats>
```

Gets statistics about retrieval operations.

**Returns:** Promise resolving to statistics

**Example:**
```typescript
const stats = await engine.getStats();
console.log(`Total documents: ${stats.totalDocuments}`);
console.log(`Total chunks: ${stats.totalChunks}`);
console.log(`Average retrieval time: ${stats.avgRetrievalTime}ms`);
console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
```

---

## Ranking Algorithm API

### RankingEngine Class

```typescript
class RankingEngine {
  constructor(config: RankingConfig);
  
  rank(chunks: DocumentChunk[], query: string): DocumentChunk[];
  scoreChunk(chunk: DocumentChunk, query: string): number;
  getAlgorithmStats(): RankingStats;
}
```

#### rank()

```typescript
rank(chunks: DocumentChunk[], query: string): DocumentChunk[]
```

Ranks chunks by relevance to query.

**Parameters:**
- `chunks` - Array of document chunks
- `query` - Query string

**Returns:** Ranked array of chunks

**Example:**
```typescript
import { RankingEngine } from './src/rag/ranking';

const ranker = new RankingEngine({
  algorithm: 'hybrid',
  weights: {
    semantic: 0.7,
    keyword: 0.2,
    recency: 0.1
  },
  boostFactors: {
    tags: { 'important': 2.0, 'recent': 1.5 },
    sources: { 'official-docs': 1.5 }
  }
});

const ranked = ranker.rank(chunks, 'API design best practices');

ranked.forEach((chunk, i) => {
  console.log(`${i + 1}. Score: ${chunk.relevanceScore}`);
});
```

---

#### scoreChunk()

```typescript
scoreChunk(chunk: DocumentChunk, query: string): number
```

Calculates relevance score for a single chunk.

**Parameters:**
- `chunk` - Document chunk
- `query` - Query string

**Returns:** Relevance score (0-1)

**Example:**
```typescript
const score = ranker.scoreChunk(chunk, 'API design');
console.log(`Relevance score: ${(score * 100).toFixed(1)}%`);
```

---

## Usage Examples

### Example 1: Complete RAG Pipeline

```typescript
import { DocumentChunker } from './src/rag/chunker';
import { EmbeddingGenerator } from './src/rag/embeddings';
import { VectorStore } from './src/rag/vector-store';
import { RetrievalEngine } from './src/rag/retrieval-engine';
import { RankingEngine } from './src/rag/ranking';

// Initialize components
const chunker = new DocumentChunker({
  chunkSize: 512,
  overlapSize: 50,
  strategy: 'semantic'
});

const embedder = new EmbeddingGenerator({
  model: 'text-embedding-3-small',
  dimension: 1536,
  cacheEmbeddings: true
});

const store = new VectorStore('./vector-storage');

const ranker = new RankingEngine({
  algorithm: 'hybrid',
  weights: { semantic: 0.7, keyword: 0.2, recency: 0.1 }
});

const engine = new RetrievalEngine({
  chunker,
  embedder,
  store,
  ranker
});

// Ingest documents
await engine.ingestBatch([
  {
    content: 'API Design Guide...',
    metadata: { source: 'api.md', tags: ['api', 'design'] }
  },
  {
    content: 'Testing Guide...',
    metadata: { source: 'testing.md', tags: ['testing'] }
  }
]);

// Retrieve relevant information
const result = await engine.retrieve({
  query: 'How should I design REST APIs?',
  limit: 5,
  minScore: 0.7
});

console.log(`Found ${result.chunks.length} relevant chunks`);
```

---

### Example 2: Document Ingestion with Metadata

```typescript
const documents = [
  {
    content: `# Performance Optimization

## Database Indexing
- Create indexes on frequently queried columns
- Monitor index usage
- Remove unused indexes

## Query Optimization
- Use EXPLAIN ANALYZE
- Avoid N+1 queries
- Implement caching`,
    metadata: {
      source: 'performance-guide.md',
      category: 'backend',
      tags: ['performance', 'database', 'optimization'],
      author: 'backend-team',
      version: '1.0'
    }
  }
];

await engine.ingestBatch(documents);
console.log('Documents ingested with metadata');
```

---

### Example 3: Filtered Retrieval

```typescript
// Retrieve only recent API documentation
const result = await engine.retrieve({
  query: 'API authentication',
  limit: 10,
  minScore: 0.75,
  filters: {
    tags: ['api', 'authentication'],
    source: 'documentation',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    }
  }
});

console.log(`Found ${result.chunks.length} recent API docs`);
```

---

### Example 4: Semantic Search

```typescript
// Search for similar content
const results = await engine.search(
  'How do I handle errors in my API?',
  5
);

results.forEach((chunk, i) => {
  console.log(`\n${i + 1}. Relevance: ${(chunk.relevanceScore * 100).toFixed(1)}%`);
  console.log(`Source: ${chunk.metadata.source}`);
  console.log(`Content: ${chunk.content.substring(0, 150)}...`);
});
```

---

### Example 5: Batch Embedding Generation

```typescript
const texts = [
  'RESTful API design principles',
  'Database optimization techniques',
  'Testing strategies for microservices',
  'Deployment best practices',
  'Security considerations'
];

const embeddings = await embedder.generateBatch(texts);

// Calculate similarity matrix
const similarities = [];
for (let i = 0; i < embeddings.length; i++) {
  for (let j = i + 1; j < embeddings.length; j++) {
    const sim = embedder.similarity(embeddings[i], embeddings[j]);
    similarities.push({
      text1: texts[i],
      text2: texts[j],
      similarity: sim
    });
  }
}

// Show most similar pairs
similarities.sort((a, b) => b.similarity - a.similarity);
similarities.slice(0, 3).forEach(pair => {
  console.log(`${pair.similarity.toFixed(2)}: "${pair.text1}" <-> "${pair.text2}"`);
});
```

---

### Example 6: Custom Ranking

```typescript
const ranker = new RankingEngine({
  algorithm: 'hybrid',
  weights: {
    semantic: 0.6,
    keyword: 0.3,
    recency: 0.1
  },
  boostFactors: {
    tags: {
      'critical': 3.0,
      'important': 2.0,
      'recent': 1.5
    },
    sources: {
      'official-docs': 2.0,
      'best-practices': 1.5
    }
  }
});

// Rank chunks with custom weights
const ranked = ranker.rank(chunks, 'error handling');

ranked.forEach((chunk, i) => {
  console.log(`${i + 1}. Score: ${chunk.relevanceScore.toFixed(3)}`);
  console.log(`   Tags: ${chunk.metadata.tags?.join(', ')}`);
  console.log(`   Source: ${chunk.metadata.source}`);
});
```

---

### Example 7: Caching and Performance

```typescript
// First query - cache miss
let start = Date.now();
let result = await engine.retrieve({
  query: 'API design patterns',
  limit: 5
});
console.log(`First query: ${Date.now() - start}ms (cache miss)`);

// Second identical query - cache hit
start = Date.now();
result = await engine.retrieve({
  query: 'API design patterns',
  limit: 5
});
console.log(`Second query: ${Date.now() - start}ms (cache hit)`);
console.log(`Cache hit: ${result.cacheHit}`);
```

---

### Example 8: Multi-Source Knowledge Base

```typescript
// Ingest from multiple sources
const sources = [
  { content: 'API documentation...', metadata: { source: 'api-docs', type: 'official' } },
  { content: 'Blog post about APIs...', metadata: { source: 'blog', type: 'community' } },
  { content: 'Internal best practices...', metadata: { source: 'wiki', type: 'internal' } }
];

await engine.ingestBatch(sources);

// Retrieve with source preference
const result = await engine.retrieve({
  query: 'API best practices',
  limit: 10,
  filters: {
    source: 'api-docs' // Prefer official docs
  }
});

console.log('Results from official documentation');
```

---

### Example 9: Incremental Ingestion

```typescript
// Ingest documents one at a time
const documentList = [
  'Document 1 content...',
  'Document 2 content...',
  'Document 3 content...'
];

for (const doc of documentList) {
  await engine.ingestDocument(doc, {
    source: 'incremental-source',
    timestamp: new Date()
  });
  console.log('Document ingested');
}

// Query after all ingestion
const results = await engine.search('search term', 5);
```

---

### Example 10: Performance Monitoring

```typescript
// Monitor retrieval performance
const stats = await engine.getStats();

console.log('=== RAG System Statistics ===');
console.log(`Total documents: ${stats.totalDocuments}`);
console.log(`Total chunks: ${stats.totalChunks}`);
console.log(`Average chunk size: ${stats.avgChunkSize} chars`);
console.log(`Average retrieval time: ${stats.avgRetrievalTime}ms`);
console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
console.log(`Total queries: ${stats.totalQueries}`);
console.log(`Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)}MB`);
```

---

## Best Practices

### 1. Chunking Strategy

Choose appropriate chunk size based on content:

```typescript
// For technical documentation
const techChunker = new DocumentChunker({
  chunkSize: 512,
  overlapSize: 50,
  strategy: 'semantic'
});

// For narrative content
const narrativeChunker = new DocumentChunker({
  chunkSize: 1024,
  overlapSize: 100,
  strategy: 'sentence'
});
```

### 2. Metadata Organization

Use consistent metadata structure:

```typescript
const metadata = {
  source: 'api-guide.md',
  category: 'documentation',
  tags: ['api', 'rest', 'design'],
  author: 'backend-team',
  version: '1.0',
  timestamp: new Date()
};
```

### 3. Query Optimization

Use filters to reduce search space:

```typescript
// Efficient: Filtered query
const result = await engine.retrieve({
  query: 'authentication',
  filters: { tags: ['security', 'api'] },
  limit: 5
});

// Less efficient: Broad query
const result = await engine.retrieve({
  query: 'authentication',
  limit: 100
});
```

### 4. Ranking Configuration

Tune weights based on use case:

```typescript
// For accuracy-focused retrieval
const accuracyRanker = new RankingEngine({
  algorithm: 'hybrid',
  weights: { semantic: 0.8, keyword: 0.15, recency: 0.05 }
});

// For recency-focused retrieval
const recencyRanker = new RankingEngine({
  algorithm: 'hybrid',
  weights: { semantic: 0.5, keyword: 0.2, recency: 0.3 }
});
```

### 5. Batch Processing

Process documents in batches for efficiency:

```typescript
// Efficient: Batch ingestion
await engine.ingestBatch(documents);

// Less efficient: Individual ingestion
for (const doc of documents) {
  await engine.ingestDocument(doc.content, doc.metadata);
}
```

---

## Performance Considerations

- **Chunking**: O(n) where n is document size
- **Embedding**: O(n) where n is number of texts
- **Vector Search**: O(log n) with indexing, O(n) without
- **Ranking**: O(n log n) where n is number of results
- **Caching**: Reduces query time by 80-90% for repeated queries

---

## Troubleshooting Guide

### Issue: Low Relevance Scores

**Cause**: Query and documents have low semantic similarity

**Solution**:
```typescript
// Adjust minimum score threshold
const result = await engine.retrieve({
  query: 'your query',
  minScore: 0.5 // Lower threshold
});

// Or improve query formulation
const result = await engine.retrieve({
  query: 'more specific and detailed query',
  minScore: 0.7
});
```

### Issue: Slow Retrieval

**Cause**: Large vector store or inefficient ranking

**Solution**:
```typescript
// Use filters to reduce search space
const result = await engine.retrieve({
  query: 'query',
  filters: { tags: ['specific-tag'] },
  limit: 5
});

// Enable caching
const embedder = new EmbeddingGenerator({
  cacheEmbeddings: true
});
```

### Issue: Out of Memory

**Cause**: Too many chunks or large embeddings

**Solution**:
```typescript
// Reduce chunk size
const chunker = new DocumentChunker({
  chunkSize: 256, // Smaller chunks
  overlapSize: 25
});

// Use smaller embedding model
const embedder = new EmbeddingGenerator({
  model: 'text-embedding-3-small',
  dimension: 512 // Smaller dimension
});
```

---

## Related Documentation

- [Memory Systems API](./memory-systems.md)
- [Tool Registry API](./tool-registry.md)
- [Memory Best Practices](../guides/memory-best-practices.md)

---

**Last Updated**: 2026-04-16  
**Status**: Production Ready  
**Maintainer**: AI Agent Team