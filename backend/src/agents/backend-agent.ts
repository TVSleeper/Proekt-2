/**
 * Backend Agent Implementation
 *
 * Specialized agent for backend development tasks including:
 * - API endpoint generation
 * - Database schema design
 * - Code validation and formatting
 * - Error handling and recovery
 *
 * Architecture: Phase 2 - Core Agents Implementation
 * Task: Task 16 - Backend Agent Implementation (Week 3)
 *
 * @module agents/backend-agent
 */

import { BaseAgent } from './base-agent';
import { EventEmitter } from 'events';
import type {
  AgentConfig,
  Tool,
  AgentState,
  ReasoningResult,
  ActionSelection,
} from './types';

/**
 * Backend-specific configuration
 */
export interface BackendAgentConfig extends Omit<AgentConfig, 'role'> {
  apiFramework?: 'express' | 'fastify' | 'nestjs';
  databaseType?: 'postgresql' | 'mysql' | 'mongodb';
  codeStyle?: 'camelCase' | 'snake_case';
  enableValidation?: boolean;
  enableFormatting?: boolean;
}

/**
 * API Endpoint specification
 */
export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  response: {
    type: string;
    properties: Record<string, any>;
  };
  statusCodes: Record<number, string>;
  authentication?: 'none' | 'bearer' | 'api-key';
}

/**
 * Database schema specification
 */
export interface DatabaseSchema {
  tableName: string;
  description: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey?: boolean;
    unique?: boolean;
    default?: any;
    description: string;
  }>;
  indexes?: Array<{
    name: string;
    columns: string[];
    unique?: boolean;
  }>;
  foreignKeys?: Array<{
    column: string;
    references: {
      table: string;
      column: string;
    };
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  }>;
  timestamps?: {
    createdAt: boolean;
    updatedAt: boolean;
  };
}

/**
 * Code generation result
 */
export interface CodeGenerationResult {
  success: boolean;
  code: string;
  language: string;
  metadata: {
    generatedAt: Date;
    framework?: string;
    database?: string;
    lineCount: number;
    complexity: 'simple' | 'moderate' | 'complex';
  };
  validationErrors?: string[];
  warnings?: string[];
}

/**
 * Backend Agent Class
 *
 * Extends BaseAgent with backend-specific capabilities for:
 * - Generating REST API endpoints
 * - Designing database schemas
 * - Validating generated code
 * - Formatting code according to standards
 * - Handling backend-specific errors
 */
export class BackendAgent extends BaseAgent {
  private backendConfig: {
    apiFramework: 'express' | 'fastify' | 'nestjs';
    databaseType: 'postgresql' | 'mysql' | 'mongodb';
    codeStyle: 'camelCase' | 'snake_case';
    enableValidation: boolean;
    enableFormatting: boolean;
  };
  private generatedEndpoints: Map<string, APIEndpoint>;
  private generatedSchemas: Map<string, DatabaseSchema>;
  private codeCache: Map<string, CodeGenerationResult>;

  constructor(config: BackendAgentConfig) {
    // Merge backend config with base config
    const baseConfig: AgentConfig = {
      name: config.name || 'backend-agent',
      description: config.description || 'Backend development agent',
      maxIterations: config.maxIterations || 50,
      maxTokensPerTurn: config.maxTokensPerTurn || 2000,
      timeout: config.timeout || 300000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      role: 'full_stack_developer' as any,
    };

    super(baseConfig);

    this.backendConfig = {
      apiFramework: config.apiFramework || 'express',
      databaseType: config.databaseType || 'postgresql',
      codeStyle: config.codeStyle || 'camelCase',
      enableValidation: config.enableValidation ?? true,
      enableFormatting: config.enableFormatting ?? true,
    };

    this.generatedEndpoints = new Map();
    this.generatedSchemas = new Map();
    this.codeCache = new Map();

    this.initializeTools();
    this.log('info', 'Backend Agent initialized with framework: ' + this.backendConfig.apiFramework);
  }

  /**
   * Initialize backend-specific tools
   */
  private initializeTools(): void {
    // API Endpoint Generator Tool
    this.registerTool({
      name: 'generate-api-endpoint',
      description: 'Generate REST API endpoint specifications',
      parameters: [
        {
          name: 'method',
          type: 'string',
          description: 'HTTP method (GET, POST, PUT, DELETE, PATCH)',
          required: true,
        },
        {
          name: 'path',
          type: 'string',
          description: 'API endpoint path',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Endpoint description',
          required: true,
        },
        {
          name: 'requestBody',
          type: 'object',
          description: 'Request body schema',
          required: false,
        },
        {
          name: 'responseSchema',
          type: 'object',
          description: 'Response schema',
          required: true,
        },
      ],
      execute: async (params: any) => this.generateAPIEndpoint(params),
    });

    // Database Schema Generator Tool
    this.registerTool({
      name: 'generate-database-schema',
      description: 'Generate database schema specifications',
      parameters: [
        {
          name: 'tableName',
          type: 'string',
          description: 'Database table name',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Table description',
          required: true,
        },
        {
          name: 'columns',
          type: 'array',
          description: 'Column definitions',
          required: true,
        },
        {
          name: 'indexes',
          type: 'array',
          description: 'Index definitions',
          required: false,
        },
      ],
      execute: async (params: any) => this.generateDatabaseSchema(params),
    });

    // Code Validation Tool
    this.registerTool({
      name: 'validate-code',
      description: 'Validate generated code for syntax and best practices',
      parameters: [
        {
          name: 'code',
          type: 'string',
          description: 'Code to validate',
          required: true,
        },
        {
          name: 'language',
          type: 'string',
          description: 'Programming language',
          required: true,
        },
      ],
      execute: async (params: any) => this.validateCode(params),
    });

    // Code Formatter Tool
    this.registerTool({
      name: 'format-code',
      description: 'Format code according to style guidelines',
      parameters: [
        {
          name: 'code',
          type: 'string',
          description: 'Code to format',
          required: true,
        },
        {
          name: 'language',
          type: 'string',
          description: 'Programming language',
          required: true,
        },
      ],
      execute: async (params: any) => this.formatCode(params),
    });

    // Error Handler Tool
    this.registerTool({
      name: 'handle-error',
      description: 'Handle and recover from backend errors',
      parameters: [
        {
          name: 'error',
          type: 'string',
          description: 'Error message',
          required: true,
        },
        {
          name: 'context',
          type: 'object',
          description: 'Error context',
          required: false,
        },
      ],
      execute: async (params: any) => this.handleError(params),
    });

    this.log('info', 'Backend tools initialized');
  }

  /**
   * Generate API endpoint specification
   */
  private async generateAPIEndpoint(params: any): Promise<CodeGenerationResult> {
    try {
      this.log('info', `Generating API endpoint: ${params.method} ${params.path}`);

      const endpoint: APIEndpoint = {
        method: params.method.toUpperCase(),
        path: params.path,
        description: params.description,
        parameters: params.parameters || [],
        requestBody: params.requestBody,
        response: params.responseSchema,
        statusCodes: {
          200: 'Success',
          400: 'Bad Request',
          401: 'Unauthorized',
          404: 'Not Found',
          500: 'Internal Server Error',
        },
        authentication: params.authentication || 'none',
      };

      // Store endpoint
      const endpointKey = `${endpoint.method}:${endpoint.path}`;
      this.generatedEndpoints.set(endpointKey, endpoint);

      // Generate code based on framework
      const code = this.generateEndpointCode(endpoint);

      const result: CodeGenerationResult = {
        success: true,
        code,
        language: 'typescript',
        metadata: {
          generatedAt: new Date(),
          framework: this.backendConfig.apiFramework,
          lineCount: code.split('\n').length,
          complexity: this.calculateComplexity(endpoint),
        },
      };

      // Validate if enabled
      if (this.backendConfig.enableValidation) {
        const validation = await this.validateCode({ code, language: 'typescript' });
        if (!validation.success) {
          result.validationErrors = validation.validationErrors;
        }
      }

      // Format if enabled
      if (this.backendConfig.enableFormatting) {
        const formatted = await this.formatCode({ code, language: 'typescript' });
        if (formatted.success) {
          result.code = formatted.code;
        }
      }

      this.codeCache.set(endpointKey, result);
      this.emit('endpoint-generated', { endpoint, result });

      return result;
    } catch (error) {
      this.log('error', `Failed to generate API endpoint: ${(error as Error).message}`);
      return {
        success: false,
        code: '',
        language: 'typescript',
        metadata: {
          generatedAt: new Date(),
          lineCount: 0,
          complexity: 'simple',
        },
        validationErrors: [(error as Error).message],
      };
    }
  }

  /**
   * Generate database schema specification
   */
  private async generateDatabaseSchema(params: any): Promise<CodeGenerationResult> {
    try {
      this.log('info', `Generating database schema: ${params.tableName}`);

      const schema: DatabaseSchema = {
        tableName: params.tableName,
        description: params.description,
        columns: params.columns,
        indexes: params.indexes || [],
        foreignKeys: params.foreignKeys || [],
        timestamps: params.timestamps || { createdAt: true, updatedAt: true },
      };

      // Store schema
      this.generatedSchemas.set(params.tableName, schema);

      // Generate code based on database type
      const code = this.generateSchemaCode(schema);

      const result: CodeGenerationResult = {
        success: true,
        code,
        language: this.backendConfig.databaseType === 'mongodb' ? 'javascript' : 'sql',
        metadata: {
          generatedAt: new Date(),
          database: this.backendConfig.databaseType,
          lineCount: code.split('\n').length,
          complexity: this.calculateSchemaComplexity(schema),
        },
      };

      // Validate if enabled
      if (this.backendConfig.enableValidation) {
        const validation = await this.validateCode({
          code,
          language: result.language,
        });
        if (!validation.success) {
          result.validationErrors = validation.validationErrors;
        }
      }

      this.codeCache.set(params.tableName, result);
      this.emit('schema-generated', { schema, result });

      return result;
    } catch (error) {
      this.log('error', `Failed to generate database schema: ${(error as Error).message}`);
      return {
        success: false,
        code: '',
        language: 'sql',
        metadata: {
          generatedAt: new Date(),
          lineCount: 0,
          complexity: 'simple',
        },
        validationErrors: [(error as Error).message],
      };
    }
  }

  /**
   * Validate generated code
   */
  private async validateCode(params: any): Promise<CodeGenerationResult> {
    try {
      this.log('info', `Validating code (${params.language})`);

      const errors: string[] = [];
      const warnings: string[] = [];

      const code = params.code;

      // Basic syntax validation
      if (!code || code.trim().length === 0) {
        errors.push('Code is empty');
      }

      // Language-specific validation
      if (params.language === 'typescript') {
        // Check for common TypeScript issues
        if (code.includes('any') && !code.includes('// @ts-ignore')) {
          warnings.push('Use of "any" type detected - consider using specific types');
        }
        if (!code.includes('export')) {
          warnings.push('No exports found - ensure functions/classes are exported');
        }
      } else if (params.language === 'sql') {
        // Check for common SQL issues
        if (code.toUpperCase().includes('SELECT *')) {
          warnings.push('SELECT * detected - specify columns explicitly');
        }
        if (!code.includes('PRIMARY KEY')) {
          warnings.push('No primary key defined');
        }
      }

      return {
        success: errors.length === 0,
        code,
        language: params.language,
        metadata: {
          generatedAt: new Date(),
          lineCount: code.split('\n').length,
          complexity: 'simple',
        },
        validationErrors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.log('error', `Code validation failed: ${(error as Error).message}`);
      return {
        success: false,
        code: params.code,
        language: params.language,
        metadata: {
          generatedAt: new Date(),
          lineCount: 0,
          complexity: 'simple',
        },
        validationErrors: [(error as Error).message],
      };
    }
  }

  /**
   * Format code according to style guidelines
   */
  private async formatCode(params: any): Promise<CodeGenerationResult> {
    try {
      this.log('info', `Formatting code (${params.language})`);

      let formatted = params.code;

      // Apply basic formatting
      formatted = formatted
        .split('\n')
        .map((line: string) => line.trimEnd())
        .join('\n');

      // Remove trailing whitespace
      formatted = formatted.trim();

      // Add consistent indentation
      const lines = formatted.split('\n');
      const formattedLines = lines.map((line: string) => {
        const indent = line.match(/^\s*/)?.[0].length || 0;
        const content = line.trim();
        if (content.length === 0) return '';
        return ' '.repeat(Math.floor(indent / 2) * 2) + content;
      });

      formatted = formattedLines.join('\n');

      return {
        success: true,
        code: formatted,
        language: params.language,
        metadata: {
          generatedAt: new Date(),
          lineCount: formatted.split('\n').length,
          complexity: 'simple',
        },
      };
    } catch (error) {
      this.log('error', `Code formatting failed: ${(error as Error).message}`);
      return {
        success: false,
        code: params.code,
        language: params.language,
        metadata: {
          generatedAt: new Date(),
          lineCount: 0,
          complexity: 'simple',
        },
        validationErrors: [(error as Error).message],
      };
    }
  }

  /**
   * Handle backend-specific errors
   */
  private async handleError(params: any): Promise<CodeGenerationResult> {
    try {
      this.log('warn', `Handling error: ${params.error}`);

      const errorMessage = params.error;
      const context = params.context || {};

      let recovery = '';
      let suggestion = '';

      // Analyze error and provide recovery strategy
      if (errorMessage.includes('database')) {
        recovery = 'Check database connection and credentials';
        suggestion = 'Verify DATABASE_URL environment variable';
      } else if (errorMessage.includes('validation')) {
        recovery = 'Review input validation rules';
        suggestion = 'Check request schema against API specification';
      } else if (errorMessage.includes('timeout')) {
        recovery = 'Increase timeout or optimize query';
        suggestion = 'Add database indexes or break into smaller operations';
      } else if (errorMessage.includes('authentication')) {
        recovery = 'Verify authentication token';
        suggestion = 'Check JWT token expiration and permissions';
      } else {
        recovery = 'Review error logs and stack trace';
        suggestion = 'Enable debug logging for more details';
      }

      const recoveryCode = `
// Error Recovery Strategy
// Error: ${errorMessage}
// Recovery: ${recovery}
// Suggestion: ${suggestion}

try {
  // Your code here
} catch (error) {
  console.error('Error occurred:', error);
  // Implement recovery logic
}
      `.trim();

      return {
        success: true,
        code: recoveryCode,
        language: 'typescript',
        metadata: {
          generatedAt: new Date(),
          lineCount: recoveryCode.split('\n').length,
          complexity: 'simple',
        },
        warnings: [recovery, suggestion],
      };
    } catch (error) {
      this.log('error', `Error handling failed: ${(error as Error).message}`);
      return {
        success: false,
        code: '',
        language: 'typescript',
        metadata: {
          generatedAt: new Date(),
          lineCount: 0,
          complexity: 'simple',
        },
        validationErrors: [(error as Error).message],
      };
    }
  }

  /**
   * Generate endpoint code based on framework
   */
  private generateEndpointCode(endpoint: APIEndpoint): string {
    if (this.backendConfig.apiFramework === 'express') {
      return this.generateExpressEndpoint(endpoint);
    } else if (this.backendConfig.apiFramework === 'fastify') {
      return this.generateFastifyEndpoint(endpoint);
    } else {
      return this.generateNestJSEndpoint(endpoint);
    }
  }

  /**
   * Generate Express endpoint code
   */
  private generateExpressEndpoint(endpoint: APIEndpoint): string {
    const methodLower = endpoint.method.toLowerCase();
    const pathWithParams = endpoint.path.replace(/{(\w+)}/g, ':$1');

    return `
router.${methodLower}('${pathWithParams}', async (req: Request, res: Response) => {
  try {
    // ${endpoint.description}

    // Validate request
    // TODO: Add validation logic

    // Process request
    // TODO: Add business logic

    // Send response
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error('Error in ${endpoint.method} ${endpoint.path}:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});
    `.trim();
  }

  /**
   * Generate Fastify endpoint code
   */
  private generateFastifyEndpoint(endpoint: APIEndpoint): string {
    const methodLower = endpoint.method.toLowerCase();

    return `
fastify.${methodLower}('${endpoint.path}', async (request, reply) => {
  try {
    // ${endpoint.description}

    // Validate request
    // TODO: Add validation logic

    // Process request
    // TODO: Add business logic

    // Send response
    return {
      success: true,
      data: {},
    };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
});
    `.trim();
  }

  /**
   * Generate NestJS endpoint code
   */
  private generateNestJSEndpoint(endpoint: APIEndpoint): string {
    const methodDecorator = `@${endpoint.method.charAt(0) + endpoint.method.slice(1).toLowerCase()}('${endpoint.path}')`;

    return `
${methodDecorator}
async handle${this.toPascalCase(endpoint.path)}() {
  try {
    // ${endpoint.description}

    // Validate request
    // TODO: Add validation logic

    // Process request
    // TODO: Add business logic

    // Send response
    return {
      success: true,
      data: {},
    };
  } catch (error) {
    this.logger.error(error);
    throw new InternalServerErrorException('Internal server error');
  }
}
    `.trim();
  }

  /**
   * Generate schema code based on database type
   */
  private generateSchemaCode(schema: DatabaseSchema): string {
    if (this.backendConfig.databaseType === 'mongodb') {
      return this.generateMongoDBSchema(schema);
    } else if (this.backendConfig.databaseType === 'mysql') {
      return this.generateMySQLSchema(schema);
    } else {
      return this.generatePostgresSchema(schema);
    }
  }

  /**
   * Generate PostgreSQL schema
   */
  private generatePostgresSchema(schema: DatabaseSchema): string {
    let sql = `CREATE TABLE IF NOT EXISTS ${schema.tableName} (\n`;

    // Add columns
    schema.columns.forEach((col, idx) => {
      sql += `  ${col.name} ${col.type}`;
      if (col.primaryKey) sql += ' PRIMARY KEY';
      if (!col.nullable) sql += ' NOT NULL';
      if (col.unique) sql += ' UNIQUE';
      if (col.default !== undefined) sql += ` DEFAULT ${col.default}`;
      if (idx < schema.columns.length - 1) sql += ',';
      sql += '\n';
    });

    sql += ');\n';

    // Add indexes
    if (schema.indexes && schema.indexes.length > 0) {
      schema.indexes.forEach((idx) => {
        const unique = idx.unique ? 'UNIQUE' : '';
        sql += `CREATE ${unique} INDEX ${idx.name} ON ${schema.tableName} (${idx.columns.join(', ')});\n`;
      });
    }

    return sql.trim();
  }

  /**
   * Generate MySQL schema
   */
  private generateMySQLSchema(schema: DatabaseSchema): string {
    let sql = `CREATE TABLE IF NOT EXISTS \`${schema.tableName}\` (\n`;

    // Add columns
    schema.columns.forEach((col, idx) => {
      sql += `  \`${col.name}\` ${col.type}`;
      if (col.primaryKey) sql += ' PRIMARY KEY AUTO_INCREMENT';
      if (!col.nullable) sql += ' NOT NULL';
      if (col.unique) sql += ' UNIQUE';
      if (col.default !== undefined) sql += ` DEFAULT ${col.default}`;
      if (idx < schema.columns.length - 1) sql += ',';
      sql += '\n';
    });

    sql += ');\n';

    // Add indexes
    if (schema.indexes && schema.indexes.length > 0) {
      schema.indexes.forEach((idx) => {
        const unique = idx.unique ? 'UNIQUE' : '';
        sql += `CREATE ${unique} INDEX \`${idx.name}\` ON \`${schema.tableName}\` (\`${idx.columns.join('`, `')}\`);\n`;
      });
    }

    return sql.trim();
  }

  /**
   * Generate MongoDB schema
   */
  private generateMongoDBSchema(schema: DatabaseSchema): string {
    const properties: Record<string, any> = {};

    schema.columns.forEach((col) => {
      properties[col.name] = {
        type: this.mapMongoDBType(col.type),
        description: col.description,
      };
    });

    const mongoSchema = {
      $jsonSchema: {
        bsonType: 'object',
        required: schema.columns
          .filter((col) => !col.nullable)
          .map((col) => col.name),
        properties,
      },
    };

    return `db.createCollection("${schema.tableName}", ${JSON.stringify(mongoSchema, null, 2)});`;
  }

  /**
   * Map SQL type to MongoDB type
   */
  private mapMongoDBType(sqlType: string): string {
    const typeMap: Record<string, string> = {
      'INT': 'int',
      'VARCHAR': 'string',
      'TEXT': 'string',
      'BOOLEAN': 'bool',
      'TIMESTAMP': 'date',
      'DECIMAL': 'double',
      'JSON': 'object',
    };

    return typeMap[sqlType.toUpperCase()] || 'string';
  }

  /**
   * Calculate endpoint complexity
   */
  private calculateComplexity(
    endpoint: APIEndpoint
  ): 'simple' | 'moderate' | 'complex' {
    let score = 0;

    if (endpoint.parameters && endpoint.parameters.length > 2) score++;
    if (endpoint.requestBody) score++;
    if (endpoint.authentication !== 'none') score++;
    if (Object.keys(endpoint.statusCodes).length > 4) score++;

    if (score >= 3) return 'complex';
    if (score >= 1) return 'moderate';
    return 'simple';
  }

  /**
   * Calculate schema complexity
   */
  private calculateSchemaComplexity(
    schema: DatabaseSchema
  ): 'simple' | 'moderate' | 'complex' {
    let score = 0;

    if (schema.columns.length > 10) score++;
    if (schema.indexes && schema.indexes.length > 2) score++;
    if (schema.foreignKeys && schema.foreignKeys.length > 0) score++;

    if (score >= 2) return 'complex';
    if (score >= 1) return 'moderate';
    return 'simple';
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-/]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Get generated endpoints
   */
  public getGeneratedEndpoints(): APIEndpoint[] {
    return Array.from(this.generatedEndpoints.values());
  }

  /**
   * Get generated schemas
   */
  public getGeneratedSchemas(): DatabaseSchema[] {
    return Array.from(this.generatedSchemas.values());
  }

  /**
   * Get cached code
   */
  public getCachedCode(key: string): CodeGenerationResult | undefined {
    return this.codeCache.get(key);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.codeCache.clear();
    this.generatedEndpoints.clear();
    this.generatedSchemas.clear();
    this.log('info', 'Backend agent cache cleared');
  }

  /**
   * Get agent statistics
   */
  public getStatistics(): {
    endpointsGenerated: number;
    schemasGenerated: number;
    cachedItems: number;
  } {
    return {
      endpointsGenerated: this.generatedEndpoints.size,
      schemasGenerated: this.generatedSchemas.size,
      cachedItems: this.codeCache.size,
    };
  }


}

export default BackendAgent;
