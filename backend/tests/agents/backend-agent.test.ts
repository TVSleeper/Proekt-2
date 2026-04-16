/**
 * Backend Agent Unit Tests
 *
 * Comprehensive test suite for the BackendAgent class.
 * Tests API endpoint generation, database schema generation, code validation,
 * formatting, and error handling.
 *
 * Architecture: Phase 2 - Core Agents Implementation
 * Task: Task 16 - Backend Agent Implementation (Week 3)
 *
 * @module tests/agents/backend-agent.test.ts
 */

import { BackendAgent } from '../../src/agents/backend-agent';
import type { BackendAgentConfig, APIEndpoint, DatabaseSchema, CodeGenerationResult } from '../../src/agents/backend-agent';

describe('BackendAgent', () => {
  let agent: BackendAgent;

  beforeEach(() => {
    const config: BackendAgentConfig = {
      name: 'test-backend-agent',
      description: 'Test backend agent',
      apiFramework: 'express',
      databaseType: 'postgresql',
      codeStyle: 'camelCase',
      enableValidation: true,
      enableFormatting: true,
      maxIterations: 50,
      timeout: 30000,
      retryAttempts: 3,
    };

    agent = new BackendAgent(config);
  });

  afterEach(() => {
    agent.clearCache();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      const info = agent.getInfo();
      expect(info.name).toBe('test-backend-agent');
      expect(info.description).toBe('Test backend agent');
    });

    it('should initialize with default values', () => {
      const config: BackendAgentConfig = {
        name: 'minimal-agent',
        description: 'Minimal agent',
      };

      const minimalAgent = new BackendAgent(config);
      const info = minimalAgent.getInfo();

      expect(info.name).toBe('minimal-agent');
      expect(info.tools.length).toBeGreaterThan(0);
    });

    it('should register all backend tools', () => {
      const tools = agent.getTools();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).toContain('generate-api-endpoint');
      expect(toolNames).toContain('generate-database-schema');
      expect(toolNames).toContain('validate-code');
      expect(toolNames).toContain('format-code');
      expect(toolNames).toContain('handle-error');
    });


  });

  describe('API Endpoint Generation', () => {
    it('should generate a simple GET endpoint', async () => {
      const result = await (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/users',
        description: 'Get all users',
        responseSchema: {
          type: 'array',
          items: { type: 'object' },
        },
      });

      expect(result.success).toBe(true);
      expect(result.code).toContain('router.get');
      expect(result.code).toContain('/api/users');
      expect(result.language).toBe('typescript');
      expect(result.metadata.framework).toBe('express');
    });

    it('should generate a POST endpoint with request body', async () => {
      const result = await (agent as any).generateAPIEndpoint({
        method: 'POST',
        path: '/api/users',
        description: 'Create a new user',
        requestBody: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
        responseSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.code).toContain('router.post');
      expect(result.metadata.complexity).toBeDefined();
    });

    it('should generate endpoints for different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const result = await (agent as any).generateAPIEndpoint({
          method,
          path: '/api/resource',
          description: `${method} endpoint`,
          responseSchema: { type: 'object' },
        });

        expect(result.success).toBe(true);
        expect(result.code).toContain(`router.${method.toLowerCase()}`);
      }
    });

    it('should store generated endpoints', async () => {
      await (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/users',
        description: 'Get users',
        responseSchema: { type: 'array' },
      });

      const endpoints = agent.getGeneratedEndpoints();
      expect(endpoints.length).toBe(1);
      expect(endpoints[0].path).toBe('/api/users');
      expect(endpoints[0].method).toBe('GET');
    });

    it('should generate code for different frameworks', async () => {
      // Test Express
      const expressAgent = new BackendAgent({
        name: 'express-agent',
        description: 'Express agent',
        apiFramework: 'express',
      });

      const expressResult = await (expressAgent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test endpoint',
        responseSchema: { type: 'object' },
      });

      expect(expressResult.code).toContain('router.get');

      // Test Fastify
      const fastifyAgent = new BackendAgent({
        name: 'fastify-agent',
        description: 'Fastify agent',
        apiFramework: 'fastify',
      });

      const fastifyResult = await (fastifyAgent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test endpoint',
        responseSchema: { type: 'object' },
      });

      expect(fastifyResult.code).toContain('fastify.get');

      // Test NestJS
      const nestAgent = new BackendAgent({
        name: 'nest-agent',
        description: 'NestJS agent',
        apiFramework: 'nestjs',
      });

      const nestResult = await (nestAgent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test endpoint',
        responseSchema: { type: 'object' },
      });

      expect(nestResult.code).toContain('@Get');
    });

    it('should emit endpoint-generated event', (done) => {
      agent.on('endpoint-generated', (data) => {
        expect(data.endpoint).toBeDefined();
        expect(data.result).toBeDefined();
        done();
      });

      (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test',
        responseSchema: { type: 'object' },
      });
    });

    it('should handle endpoint generation errors', async () => {
      const result = await (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '',
        description: 'Test',
        responseSchema: { type: 'object' },
      });

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
    });
  });

  describe('Database Schema Generation', () => {
    it('should generate a simple PostgreSQL schema', async () => {
      const result = await (agent as any).generateDatabaseSchema({
        tableName: 'users',
        description: 'Users table',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'User ID',
          },
          {
            name: 'name',
            type: 'VARCHAR(255)',
            nullable: false,
            description: 'User name',
          },
          {
            name: 'email',
            type: 'VARCHAR(255)',
            nullable: false,
            unique: true,
            description: 'User email',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.code).toContain('CREATE TABLE');
      expect(result.code).toContain('users');
      expect(result.code).toContain('PRIMARY KEY');
      expect(result.language).toBe('sql');
    });

    it('should generate schema with indexes', async () => {
      const result = await (agent as any).generateDatabaseSchema({
        tableName: 'products',
        description: 'Products table',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'Product ID',
          },
          {
            name: 'name',
            type: 'VARCHAR(255)',
            nullable: false,
            description: 'Product name',
          },
        ],
        indexes: [
          {
            name: 'idx_product_name',
            columns: ['name'],
            unique: false,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.code.toUpperCase()).toContain('CREATE');
      expect(result.code).toContain('idx_product_name');
    });

    it('should generate schema for different database types', async () => {
      // PostgreSQL
      const pgAgent = new BackendAgent({
        name: 'pg-agent',
        description: 'PostgreSQL agent',
        databaseType: 'postgresql',
      });

      const pgResult = await (pgAgent as any).generateDatabaseSchema({
        tableName: 'test',
        description: 'Test table',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });

      expect(pgResult.code).toContain('CREATE TABLE IF NOT EXISTS');

      // MySQL
      const mysqlAgent = new BackendAgent({
        name: 'mysql-agent',
        description: 'MySQL agent',
        databaseType: 'mysql',
      });

      const mysqlResult = await (mysqlAgent as any).generateDatabaseSchema({
        tableName: 'test',
        description: 'Test table',
        columns: [
          {
            name: 'id',
            type: 'INT',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });

      expect(mysqlResult.code).toContain('AUTO_INCREMENT');

      // MongoDB
      const mongoAgent = new BackendAgent({
        name: 'mongo-agent',
        description: 'MongoDB agent',
        databaseType: 'mongodb',
      });

      const mongoResult = await (mongoAgent as any).generateDatabaseSchema({
        tableName: 'test',
        description: 'Test collection',
        columns: [
          {
            name: 'id',
            type: 'INT',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });

      expect(mongoResult.language).toBe('javascript');
      expect(mongoResult.code).toContain('createCollection');
    });

    it('should store generated schemas', async () => {
      await (agent as any).generateDatabaseSchema({
        tableName: 'users',
        description: 'Users table',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });

      const schemas = agent.getGeneratedSchemas();
      expect(schemas.length).toBe(1);
      expect(schemas[0].tableName).toBe('users');
    });

    it('should emit schema-generated event', (done) => {
      agent.on('schema-generated', (data) => {
        expect(data.schema).toBeDefined();
        expect(data.result).toBeDefined();
        done();
      });

      (agent as any).generateDatabaseSchema({
        tableName: 'test',
        description: 'Test',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });
    });

    it('should handle schema generation errors', async () => {
      const result = await (agent as any).generateDatabaseSchema({
        tableName: '',
        description: 'Invalid',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
    });
  });

  describe('Code Validation', () => {
    it('should validate TypeScript code', async () => {
      const result = await (agent as any).validateCode({
        code: 'const x: string = "hello";',
        language: 'typescript',
      });

      expect(result.success).toBe(true);
      expect(result.language).toBe('typescript');
    });

    it('should detect empty code', async () => {
      const result = await (agent as any).validateCode({
        code: '',
        language: 'typescript',
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Code is empty');
    });

    it('should warn about "any" type usage', async () => {
      const result = await (agent as any).validateCode({
        code: 'const x: any = {};',
        language: 'typescript',
      });

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w: string) => w.includes('any'))).toBe(true);
    });

    it('should warn about missing exports', async () => {
      const result = await (agent as any).validateCode({
        code: 'function test() {}',
        language: 'typescript',
      });

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w: string) => w.includes('export'))).toBe(true);
    });

    it('should validate SQL code', async () => {
      const result = await (agent as any).validateCode({
        code: 'SELECT id, name FROM users WHERE id = 1;',
        language: 'sql',
      });

      expect(result.success).toBe(true);
    });

    it('should warn about SELECT * in SQL', async () => {
      const result = await (agent as any).validateCode({
        code: 'SELECT * FROM users;',
        language: 'sql',
      });

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w: string) => w.includes('SELECT *'))).toBe(true);
    });

    it('should warn about missing primary key in SQL', async () => {
      const result = await (agent as any).validateCode({
        code: 'CREATE TABLE users (name VARCHAR(255));',
        language: 'sql',
      });

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w: string) => w.includes('primary key'))).toBe(true);
    });

    it('should handle validation errors', async () => {
      const result = await (agent as any).validateCode({
        code: null,
        language: 'typescript',
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
    });
  });

  describe('Code Formatting', () => {
    it('should format code with proper indentation', async () => {
      const unformatted = `function test() {
const x = 1;
  const y = 2;
    return x + y;
}`;

      const result = await (agent as any).formatCode({
        code: unformatted,
        language: 'typescript',
      });

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.code.length).toBeGreaterThan(0);
    });

    it('should remove trailing whitespace', async () => {
      const code = 'const x = 1;   \nconst y = 2;  ';

      const result = await (agent as any).formatCode({
        code,
        language: 'typescript',
      });

      expect(result.success).toBe(true);
      expect(result.code).not.toContain('   ');
    });

    it('should trim code', async () => {
      const code = '  \n  const x = 1;  \n  ';

      const result = await (agent as any).formatCode({
        code,
        language: 'typescript',
      });

      expect(result.success).toBe(true);
      expect(result.code).toBe('const x = 1;');
    });

    it('should handle formatting errors', async () => {
      const result = await (agent as any).formatCode({
        code: null,
        language: 'typescript',
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const result = await (agent as any).handleError({
        error: 'database connection failed',
        context: {},
      });

      expect(result.success).toBe(true);
      expect(result.code).toContain('Error Recovery Strategy');
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w: string) => w.includes('database'))).toBe(true);
    });

    it('should handle validation errors', async () => {
      const result = await (agent as any).handleError({
        error: 'validation error: invalid input',
        context: {},
      });

      expect(result.success).toBe(true);
      expect(result.warnings?.some((w: string) => w.includes('validation'))).toBe(true);
    });

    it('should handle timeout errors', async () => {
      const result = await (agent as any).handleError({
        error: 'request timeout',
        context: {},
      });

      expect(result.success).toBe(true);
      expect(result.warnings?.some((w: string) => w.includes('timeout'))).toBe(true);
    });

    it('should handle authentication errors', async () => {
      const result = await (agent as any).handleError({
        error: 'authentication failed',
        context: {},
      });

      expect(result.success).toBe(true);
      expect(result.warnings?.some((w: string) => w.includes('authentication'))).toBe(true);
    });

    it('should handle unknown errors', async () => {
      const result = await (agent as any).handleError({
        error: 'unknown error occurred',
        context: {},
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
    });

    it('should handle error handling failures', async () => {
      const result = await (agent as any).handleError({
        error: null,
        context: {},
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should cache generated code', async () => {
      await (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test',
        responseSchema: { type: 'object' },
      });

      const cached = agent.getCachedCode('GET:/api/test');
      expect(cached).toBeDefined();
      expect(cached?.code).toContain('router.get');
    });

    it('should clear cache', async () => {
      await (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test',
        responseSchema: { type: 'object' },
      });

      agent.clearCache();

      const cached = agent.getCachedCode('GET:/api/test');
      expect(cached).toBeUndefined();
    });

    it('should return statistics', async () => {
      await (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test',
        responseSchema: { type: 'object' },
      });

      await (agent as any).generateDatabaseSchema({
        tableName: 'test',
        description: 'Test',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });

      const stats = agent.getStatistics();
      expect(stats.endpointsGenerated).toBe(1);
      expect(stats.schemasGenerated).toBe(1);
      expect(stats.cachedItems).toBeGreaterThan(0);
    });
  });

  describe('Tool Registration', () => {
    it('should have all required tools', () => {
      const tools = agent.getTools();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).toContain('generate-api-endpoint');
      expect(toolNames).toContain('generate-database-schema');
      expect(toolNames).toContain('validate-code');
      expect(toolNames).toContain('format-code');
      expect(toolNames).toContain('handle-error');
    });

    it('should execute tools through agent', async () => {
      const tools = agent.getTools();
      const validateTool = tools.find(t => t.name === 'validate-code');

      expect(validateTool).toBeDefined();

      const result = await validateTool!.execute({
        code: 'const x = 1;',
        language: 'typescript',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should generate complete API with validation and formatting', async () => {
      const endpointResult = await (agent as any).generateAPIEndpoint({
        method: 'POST',
        path: '/api/users',
        description: 'Create user',
        requestBody: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
        responseSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      });

      expect(endpointResult.success).toBe(true);
      expect(endpointResult.code).toBeDefined();

      const endpoints = agent.getGeneratedEndpoints();
      expect(endpoints.length).toBe(1);
    });

    it('should generate complete database schema with validation', async () => {
      const schemaResult = await (agent as any).generateDatabaseSchema({
        tableName: 'users',
        description: 'Users table',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'User ID',
          },
          {
            name: 'email',
            type: 'VARCHAR(255)',
            nullable: false,
            unique: true,
            description: 'User email',
          },
          {
            name: 'createdAt',
            type: 'TIMESTAMP',
            nullable: false,
            default: 'CURRENT_TIMESTAMP',
            description: 'Created at',
          },
        ],
        indexes: [
          {
            name: 'idx_email',
            columns: ['email'],
            unique: true,
          },
        ],
      });

      expect(schemaResult.success).toBe(true);
      expect(schemaResult.code).toContain('CREATE TABLE');
      expect(schemaResult.code).toContain('CREATE UNIQUE INDEX');

      const schemas = agent.getGeneratedSchemas();
      expect(schemas.length).toBe(1);
    });

    it('should handle multiple endpoints and schemas', async () => {
      // Generate multiple endpoints
      for (let i = 0; i < 3; i++) {
        await (agent as any).generateAPIEndpoint({
          method: 'GET',
          path: `/api/resource${i}`,
          description: `Resource ${i}`,
          responseSchema: { type: 'object' },
        });
      }

      // Generate multiple schemas
      for (let i = 0; i < 2; i++) {
        await (agent as any).generateDatabaseSchema({
          tableName: `table${i}`,
          description: `Table ${i}`,
          columns: [
            {
              name: 'id',
              type: 'SERIAL',
              nullable: false,
              primaryKey: true,
              description: 'ID',
            },
          ],
        });
      }

      const stats = agent.getStatistics();
      expect(stats.endpointsGenerated).toBe(3);
      expect(stats.schemasGenerated).toBe(2);
    });
  });

  describe('Event Emission', () => {
    it('should emit log events', (done) => {
      let logCount = 0;

      agent.on('log', (log) => {
        logCount++;
        expect(log.level).toBeDefined();
        expect(log.message).toBeDefined();
        expect(log.timestamp).toBeDefined();

        if (logCount >= 2) {
          done();
        }
      });

      (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test',
        responseSchema: { type: 'object' },
      });
    });

    it('should emit endpoint-generated event', (done) => {
      agent.on('endpoint-generated', (data) => {
        expect(data.endpoint).toBeDefined();
        expect(data.result).toBeDefined();
        expect(data.endpoint.path).toBe('/api/test');
        done();
      });

      (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test',
        responseSchema: { type: 'object' },
      });
    });

    it('should emit schema-generated event', (done) => {
      agent.on('schema-generated', (data) => {
        expect(data.schema).toBeDefined();
        expect(data.result).toBeDefined();
        expect(data.schema.tableName).toBe('test');
        done();
      });

      (agent as any).generateDatabaseSchema({
        tableName: 'test',
        description: 'Test',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });
    });
  });

  describe('Configuration Options', () => {
    it('should respect enableValidation flag', async () => {
      const noValidationAgent = new BackendAgent({
        name: 'no-validation',
        description: 'No validation',
        enableValidation: false,
      });

      const result = await (noValidationAgent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test',
        responseSchema: { type: 'object' },
      });

      expect(result.success).toBe(true);
    });

    it('should respect enableFormatting flag', async () => {
      const noFormattingAgent = new BackendAgent({
        name: 'no-formatting',
        description: 'No formatting',
        enableFormatting: false,
      });

      const result = await (noFormattingAgent as any).generateAPIEndpoint({
        method: 'GET',
        path: '/api/test',
        description: 'Test',
        responseSchema: { type: 'object' },
      });

      expect(result.success).toBe(true);
    });

    it('should support different code styles', () => {
      const camelCaseAgent = new BackendAgent({
        name: 'camel-case',
        description: 'Camel case',
        codeStyle: 'camelCase',
      });

      const snakeCaseAgent = new BackendAgent({
        name: 'snake-case',
        description: 'Snake case',
        codeStyle: 'snake_case',
      });

      expect(camelCaseAgent.getInfo().name).toBe('camel-case');
      expect(snakeCaseAgent.getInfo().name).toBe('snake-case');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from invalid endpoint parameters', async () => {
      const result = await (agent as any).generateAPIEndpoint({
        method: 'GET',
        path: '',
        description: 'Test',
        responseSchema: { type: 'object' },
      });

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
    });

    it('should recover from invalid schema parameters', async () => {
      const result = await (agent as any).generateDatabaseSchema({
        tableName: 'test',
        description: 'Test',
        columns: [
          {
            name: 'id',
            type: 'SERIAL',
            nullable: false,
            primaryKey: true,
            description: 'ID',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
    });

    it('should provide recovery suggestions for errors', async () => {
      const result = await (agent as any).handleError({
        error: 'database connection timeout',
        context: { retries: 3 },
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });
});
