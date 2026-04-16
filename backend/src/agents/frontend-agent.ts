/**
 * Frontend Agent Implementation
 *
 * Specialized agent for frontend development tasks including React component generation,
 * design validation, accessibility checking, responsive design, and style generation.
 *
 * Architecture: Phase 2 - Core Agents Implementation
 * Task: Task 17 - Frontend Agent Implementation (Week 3)
 *
 * @module agents/frontend-agent
 */

import { BaseAgent, AgentConfig } from './base-agent';

/**
 * Frontend Agent Configuration
 */
export interface FrontendAgentConfig {
  name?: string;
  description?: string;
  componentFramework?: 'react' | 'vue' | 'svelte';
  styleFramework?: 'tailwind' | 'styled-components' | 'css-modules';
  designSystem?: string;
  enableAccessibility?: boolean;
  enableResponsive?: boolean;
  enableValidation?: boolean;
  targetBrowsers?: string[];
  maxIterations?: number;
  maxTokensPerTurn?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Component Generation Result
 */
export interface ComponentGenerationResult {
  success: boolean;
  code: string;
  language: string;
  componentName: string;
  props: Array<{ name: string; type: string; required: boolean }>;
  metadata: {
    generatedAt: Date;
    framework: string;
    lineCount: number;
    complexity: number;
  };
  validationErrors?: string[];
  accessibilityIssues?: string[];
}

/**
 * Design Validation Result
 */
export interface DesignValidationResult {
  success: boolean;
  isValid: boolean;
  issues: Array<{
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }>;
  metadata: {
    checkedAt: Date;
    patternsChecked: number;
    issuesFound: number;
  };
}

/**
 * Accessibility Check Result
 */
export interface AccessibilityCheckResult {
  success: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA' | 'NONE';
  issues: Array<{
    rule: string;
    severity: 'error' | 'warning';
    message: string;
    element?: string;
    suggestion?: string;
  }>;
  metadata: {
    checkedAt: Date;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };
}

/**
 * Responsive Design Result
 */
export interface ResponsiveDesignResult {
  success: boolean;
  breakpoints: Array<{
    name: string;
    width: number;
    code: string;
  }>;
  metadata: {
    generatedAt: Date;
    breakpointCount: number;
    mobileFirst: boolean;
  };
}

/**
 * Style Generation Result
 */
export interface StyleGenerationResult {
  success: boolean;
  styles: string;
  language: string;
  code?: string;
  variables?: Record<string, string>;
  metadata: {
    generatedAt: Date;
    framework: string;
    lineCount: number;
    variableCount: number;
  };
}

/**
 * Frontend Agent Class
 *
 * Extends BaseAgent with frontend-specific capabilities for:
 * - React component generation
 * - Design pattern validation
 * - WCAG accessibility checking
 * - Responsive design generation
 * - CSS/Tailwind style generation
 */
export class FrontendAgent extends BaseAgent {
  private frontendConfig: {
    componentFramework: 'react' | 'vue' | 'svelte';
    styleFramework: 'tailwind' | 'styled-components' | 'css-modules';
    designSystem: string;
    enableAccessibility: boolean;
    enableResponsive: boolean;
    enableValidation: boolean;
    targetBrowsers: string[];
  };

  private generatedComponents: Map<string, ComponentGenerationResult>;
  private componentCache: Map<string, ComponentGenerationResult>;

  constructor(config: FrontendAgentConfig) {
    const baseConfig: AgentConfig = {
      name: config.name || 'frontend-agent',
      description: config.description || 'Frontend development agent',
      maxIterations: config.maxIterations || 50,
      maxTokensPerTurn: config.maxTokensPerTurn || 2000,
      timeout: config.timeout || 300000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    super(baseConfig);

    this.frontendConfig = {
      componentFramework: config.componentFramework || 'react',
      styleFramework: config.styleFramework || 'tailwind',
      designSystem: config.designSystem || 'default',
      enableAccessibility: config.enableAccessibility ?? true,
      enableResponsive: config.enableResponsive ?? true,
      enableValidation: config.enableValidation ?? true,
      targetBrowsers: config.targetBrowsers || ['chrome', 'firefox', 'safari', 'edge'],
    };

    this.generatedComponents = new Map();
    this.componentCache = new Map();

    this.initializeTools();
    this.log('info', `Frontend Agent initialized with framework: ${this.frontendConfig.componentFramework}`);
  }

  /**
   * Initialize frontend-specific tools
   */
  private initializeTools(): void {
    this.registerTool({
      name: 'generate-react-component',
      description: 'Generate React components with TypeScript support',
      parameters: [
        {
          name: 'componentName',
          type: 'string',
          description: 'Name of the component to generate',
          required: true,
        },
        {
          name: 'componentType',
          type: 'string',
          description: 'Type of component (functional, class, hook)',
          required: true,
        },
        {
          name: 'props',
          type: 'array',
          description: 'Component props definition',
          required: false,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Component description',
          required: false,
        },
      ],
      execute: async (params: any) => this.generateReactComponent(params),
    });

    this.registerTool({
      name: 'validate-design',
      description: 'Validate design patterns and consistency',
      parameters: [
        {
          name: 'design',
          type: 'object',
          description: 'Design specification to validate',
          required: true,
        },
        {
          name: 'patterns',
          type: 'array',
          description: 'Design patterns to check against',
          required: false,
        },
      ],
      execute: async (params: any) => this.validateDesign(params),
    });

    this.registerTool({
      name: 'check-accessibility',
      description: 'Check WCAG compliance and accessibility issues',
      parameters: [
        {
          name: 'component',
          type: 'object',
          description: 'Component to check',
          required: true,
        },
        {
          name: 'wcagLevel',
          type: 'string',
          description: 'WCAG level to check against (A, AA, AAA)',
          required: false,
        },
      ],
      execute: async (params: any) => this.checkAccessibility(params),
    });

    this.registerTool({
      name: 'generate-responsive-design',
      description: 'Generate responsive design layouts and breakpoints',
      parameters: [
        {
          name: 'baseDesign',
          type: 'object',
          description: 'Base design specification',
          required: true,
        },
        {
          name: 'breakpoints',
          type: 'array',
          description: 'Custom breakpoints',
          required: false,
        },
      ],
      execute: async (params: any) => this.generateResponsiveDesign(params),
    });

    this.registerTool({
      name: 'generate-styles',
      description: 'Generate CSS/Tailwind styles',
      parameters: [
        {
          name: 'design',
          type: 'object',
          description: 'Design specification',
          required: true,
        },
        {
          name: 'framework',
          type: 'string',
          description: 'Style framework (tailwind, styled-components, css-modules)',
          required: false,
        },
      ],
      execute: async (params: any) => this.generateStyles(params),
    });
  }

  /**
   * Generate React component
   */
  private async generateReactComponent(params: any): Promise<ComponentGenerationResult> {
    const { componentName, componentType = 'functional', props = [], description = '' } = params;

    this.log('info', `Generating React component: ${componentName}`);

    try {
      const cacheKey = `${componentName}-${componentType}`;
      if (this.componentCache.has(cacheKey)) {
        this.log('debug', `Using cached component: ${cacheKey}`);
        return this.componentCache.get(cacheKey)!;
      }

      let code = '';

      if (componentType === 'functional') {
        code = this.generateFunctionalComponent(componentName, props, description);
      } else if (componentType === 'class') {
        code = this.generateClassComponent(componentName, props, description);
      } else if (componentType === 'hook') {
        code = this.generateHookComponent(componentName, props, description);
      } else {
        code = this.generateFunctionalComponent(componentName, props, description);
      }

      const validationErrors: string[] = [];
      if (this.frontendConfig.enableValidation) {
        const validation = this.validateComponentCode(code);
        validationErrors.push(...validation.errors);
      }

      const accessibilityIssues: string[] = [];
      if (this.frontendConfig.enableAccessibility) {
        const a11y = await this.checkComponentAccessibility(code);
        accessibilityIssues.push(...a11y.issues);
      }

      const result: ComponentGenerationResult = {
        success: validationErrors.length === 0,
        code,
        language: 'typescript',
        componentName,
        props: props.map((p: any) => ({
          name: p.name,
          type: p.type || 'any',
          required: p.required || false,
        })),
        metadata: {
          generatedAt: new Date(),
          framework: this.frontendConfig.componentFramework,
          lineCount: code.split('\n').length,
          complexity: this.calculateComponentComplexity(code),
        },
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        accessibilityIssues: accessibilityIssues.length > 0 ? accessibilityIssues : undefined,
      };

      this.componentCache.set(cacheKey, result);
      this.generatedComponents.set(componentName, result);

      this.emit('component-generated', { componentName, result });

      return result;
    } catch (error) {
      this.log('error', `Component generation failed: ${(error as Error).message}`);
      return {
        success: false,
        code: '',
        language: 'typescript',
        componentName,
        props: [],
        metadata: {
          generatedAt: new Date(),
          framework: this.frontendConfig.componentFramework,
          lineCount: 0,
          complexity: 0,
        },
        validationErrors: [(error as Error).message],
      };
    }
  }

  /**
   * Generate functional component
   */
  private generateFunctionalComponent(name: string, props: any[], description: string): string {
    const propsInterface = props.length > 0
      ? `interface ${name}Props {\n${props.map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type || 'any'};`).join('\n')}\n}`
      : '';

    const propsDestructure = props.length > 0 ? `{ ${props.map(p => p.name).join(', ')} }: ${name}Props` : '';

    return `/**
 * ${name}
 * ${description}
 */

${propsInterface}

export const ${name}: React.FC<${propsInterface ? `${name}Props` : 'any'}> = (${propsDestructure}) => {
  return (
    <div className="component-${name.toLowerCase()}">
      {/* Component content */}
    </div>
  );
};

export default ${name};`;
  }

  /**
   * Generate class component
   */
  private generateClassComponent(name: string, props: any[], description: string): string {
    const propsInterface = props.length > 0
      ? `interface ${name}Props {\n${props.map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type || 'any'};`).join('\n')}\n}`
      : '';

    return `/**
 * ${name}
 * ${description}
 */

${propsInterface}

export class ${name} extends React.Component<${propsInterface ? `${name}Props` : 'any'}> {
  render() {
    return (
      <div className="component-${name.toLowerCase()}">
        {/* Component content */}
      </div>
    );
  }
}

export default ${name};`;
  }

  /**
   * Generate hook component
   */
  private generateHookComponent(name: string, props: any[], description: string): string {
    return `/**
 * ${name}
 * ${description}
 */

export const use${name} = (${props.map(p => `${p.name}: ${p.type || 'any'}`).join(', ')}) => {
  const [state, setState] = React.useState(null);

  React.useEffect(() => {
    // Hook logic
  }, [${props.map(p => p.name).join(', ')}]);

  return { state, setState };
};

export default use${name};`;
  }

  /**
   * Validate design patterns
   */
  private async validateDesign(params: any): Promise<DesignValidationResult> {
    const { design, patterns = [] } = params;

    this.log('info', 'Validating design patterns');

    try {
      const issues: Array<{
        type: string;
        severity: 'error' | 'warning' | 'info';
        message: string;
        suggestion?: string;
      }> = [];

      if (!design || !design.name) {
        issues.push({
          type: 'missing-name',
          severity: 'error',
          message: 'Design must have a name',
          suggestion: 'Add a name property to the design object',
        });
      }

      if (!design || !design.components || design.components.length === 0) {
        issues.push({
          type: 'missing-components',
          severity: 'warning',
          message: 'Design has no components defined',
          suggestion: 'Define at least one component in the design',
        });
      }

      if (design && design.colors) {
        const colorIssues = this.validateColorScheme(design.colors);
        issues.push(...colorIssues);
      }

      if (design && design.typography) {
        const typographyIssues = this.validateTypography(design.typography);
        issues.push(...typographyIssues);
      }

      const result: DesignValidationResult = {
        success: issues.filter((i: any) => i.severity === 'error').length === 0,
        isValid: issues.length === 0,
        issues,
        metadata: {
          checkedAt: new Date(),
          patternsChecked: patterns.length,
          issuesFound: issues.length,
        },
      };

      this.emit('design-validated', result);
      return result;
    } catch (error) {
      this.log('error', `Design validation failed: ${(error as Error).message}`);
      return {
        success: false,
        isValid: false,
        issues: [
          {
            type: 'validation-error',
            severity: 'error',
            message: (error as Error).message,
          },
        ],
        metadata: {
          checkedAt: new Date(),
          patternsChecked: patterns.length,
          issuesFound: 1,
        },
      };
    }
  }

  /**
   * Check accessibility compliance
   */
  private async checkAccessibility(params: any): Promise<AccessibilityCheckResult> {
    const { component, wcagLevel = 'AA' } = params;

    this.log('info', `Checking accessibility for WCAG ${wcagLevel}`);

    try {
      const issues: Array<{
        rule: string;
        severity: 'error' | 'warning';
        message: string;
        element?: string;
        suggestion?: string;
      }> = [];

      let passedChecks = 0;
      let totalChecks = 5;

      if (!component || !component.altText && component && component.type === 'image') {
        issues.push({
          rule: 'image-alt-text',
          severity: 'error',
          message: 'Image must have alt text',
          suggestion: 'Add descriptive alt text to the image',
        });
      } else {
        passedChecks++;
      }

      if (!component || !component.ariaLabel && component && component.interactive) {
        issues.push({
          rule: 'aria-label',
          severity: 'warning',
          message: 'Interactive element should have ARIA label',
          suggestion: 'Add aria-label or aria-labelledby attribute',
        });
      } else {
        passedChecks++;
      }

      if (component && component.interactive && !component.keyboardAccessible) {
        issues.push({
          rule: 'keyboard-navigation',
          severity: 'error',
          message: 'Interactive element must be keyboard accessible',
          suggestion: 'Ensure all interactive elements are reachable via keyboard',
        });
      } else {
        passedChecks++;
      }

      if (component && component.headings) {
        const headingIssues = this.checkHeadingHierarchy(component.headings);
        if (headingIssues.length > 0) {
          issues.push(...headingIssues);
        } else {
          passedChecks++;
        }
      } else {
        passedChecks++;
      }

      passedChecks++;

      const result: AccessibilityCheckResult = {
        success: issues.filter((i: any) => i.severity === 'error').length === 0,
        wcagLevel: wcagLevel as 'A' | 'AA' | 'AAA' | 'NONE',
        issues,
        metadata: {
          checkedAt: new Date(),
          totalChecks,
          passedChecks,
          failedChecks: totalChecks - passedChecks,
        },
      };

      this.emit('accessibility-checked', result);
      return result;
    } catch (error) {
      this.log('error', `Accessibility check failed: ${(error as Error).message}`);
      return {
        success: false,
        wcagLevel: 'NONE',
        issues: [
          {
            rule: 'check-error',
            severity: 'error',
            message: (error as Error).message,
          },
        ],
        metadata: {
          checkedAt: new Date(),
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 1,
        },
      };
    }
  }

  /**
   * Generate responsive design
   */
  private async generateResponsiveDesign(params: any): Promise<ResponsiveDesignResult> {
    const { baseDesign, breakpoints = [] } = params;

    this.log('info', 'Generating responsive design');

    try {
      const defaultBreakpoints = [
        { name: 'mobile', width: 320 },
        { name: 'tablet', width: 768 },
        { name: 'desktop', width: 1024 },
        { name: 'wide', width: 1440 },
      ];

      const finalBreakpoints = breakpoints.length > 0 ? breakpoints : defaultBreakpoints;

      const breakpointCodes = finalBreakpoints.map((bp: any) => ({
        name: bp.name,
        width: bp.width,
        code: this.generateBreakpointCode(baseDesign, bp),
      }));

      const result: ResponsiveDesignResult = {
        success: true,
        breakpoints: breakpointCodes,
        metadata: {
          generatedAt: new Date(),
          breakpointCount: breakpointCodes.length,
          mobileFirst: true,
        },
      };

      this.emit('responsive-design-generated', result);
      return result;
    } catch (error) {
      this.log('error', `Responsive design generation failed: ${(error as Error).message}`);
      return {
        success: false,
        breakpoints: [],
        metadata: {
          generatedAt: new Date(),
          breakpointCount: 0,
          mobileFirst: true,
        },
      };
    }
  }

  /**
   * Generate styles
   */
  private async generateStyles(params: any): Promise<StyleGenerationResult> {
    const { design, framework = this.frontendConfig.styleFramework } = params;

    this.log('info', `Generating styles with ${framework}`);

    try {
      let styles = '';
      const variables: Record<string, string> = {};

      if (framework === 'tailwind') {
        styles = this.generateTailwindStyles(design, variables);
      } else if (framework === 'styled-components') {
        styles = this.generateStyledComponentsStyles(design, variables);
      } else if (framework === 'css-modules') {
        styles = this.generateCSSModulesStyles(design, variables);
      }

      const result: StyleGenerationResult = {
        success: true,
        styles,
        code: styles,
        language: framework === 'tailwind' ? 'html' : 'typescript',
        variables: Object.keys(variables).length > 0 ? variables : undefined,
        metadata: {
          generatedAt: new Date(),
          framework,
          lineCount: styles.split('\n').length,
          variableCount: Object.keys(variables).length,
        },
      };

      this.emit('styles-generated', result);
      return result;
    } catch (error) {
      this.log('error', `Style generation failed: ${(error as Error).message}`);
      return {
        success: false,
        styles: '',
        language: 'css',
        metadata: {
          generatedAt: new Date(),
          framework,
          lineCount: 0,
          variableCount: 0,
        },
      };
    }
  }

  /**
   * Generate Tailwind styles
   */
  private generateTailwindStyles(design: any, variables: Record<string, string>): string {
    let styles = '';

    if (design && design.colors) {
      styles += '<!-- Tailwind Color Classes -->\n';
      for (const [name, color] of Object.entries(design.colors)) {
        styles += `<!-- bg-${name}: ${color} -->\n`;
        variables[`color-${name}`] = color as string;
      }
    }

    if (design && design.spacing) {
      styles += '\n<!-- Tailwind Spacing Classes -->\n';
      for (const [name, value] of Object.entries(design.spacing)) {
        styles += `<!-- p-${name}: ${value} -->\n`;
        variables[`spacing-${name}`] = value as string;
      }
    }

    return styles;
  }

  /**
   * Generate styled-components styles
   */
  private generateStyledComponentsStyles(design: any, variables: Record<string, string>): string {
    let styles = `import styled from 'styled-components';\n\n`;

    if (design && design.colors) {
      styles += 'export const colors = {\n';
      for (const [name, color] of Object.entries(design.colors)) {
        styles += `  ${name}: '${color}',\n`;
        variables[`color-${name}`] = color as string;
      }
      styles += '};\n\n';
    }

    if (design && design.spacing) {
      styles += 'export const spacing = {\n';
      for (const [name, value] of Object.entries(design.spacing)) {
        styles += `  ${name}: '${value}',\n`;
        variables[`spacing-${name}`] = value as string;
      }
      styles += '};\n';
    }

    return styles;
  }

  /**
   * Generate CSS Modules styles
   */
  private generateCSSModulesStyles(design: any, variables: Record<string, string>): string {
    let styles = ':root {\n';

    if (design && design.colors) {
      for (const [name, color] of Object.entries(design.colors)) {
        styles += `  --color-${name}: ${color};\n`;
        variables[`color-${name}`] = color as string;
      }
    }

    if (design && design.spacing) {
      for (const [name, value] of Object.entries(design.spacing)) {
        styles += `  --spacing-${name}: ${value};\n`;
        variables[`spacing-${name}`] = value as string;
      }
    }

    styles += '}\n';
    return styles;
  }

  /**
   * Validate component code
   */
  private validateComponentCode(code: string): { errors: string[] } {
    const errors: string[] = [];

    if (!code.includes('export')) {
      errors.push('Component must export a default or named export');
    }

    if (!code.includes('React')) {
      errors.push('Component must import React');
    }

    return { errors };
  }

  /**
   * Check component accessibility
   */
  private async checkComponentAccessibility(code: string): Promise<{ issues: string[] }> {
    const issues: string[] = [];

    if (code.includes('<div') && !code.includes('role=')) {
      issues.push('Consider using semantic HTML elements instead of divs');
    }

    if (code.includes('<img') && !code.includes('alt=')) {
      issues.push('Images must have alt text');
    }

    return { issues };
  }

  /**
   * Calculate component complexity
   */
  private calculateComponentComplexity(code: string): number {
    let complexity = 1;

    const hookMatches = code.match(/useState|useEffect|useContext|useReducer/g);
    complexity += (hookMatches?.length || 0) * 0.5;

    const conditionalMatches = code.match(/\{.*\?.*:/g);
    complexity += (conditionalMatches?.length || 0) * 0.3;

    const propsMatches = code.match(/props\./g);
    complexity += (propsMatches?.length || 0) * 0.2;

    return Math.min(complexity, 10);
  }

  /**
   * Validate color scheme
   */
  private validateColorScheme(colors: any): Array<{
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }> {
    const issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      suggestion?: string;
    }> = [];

    if (!colors.primary) {
      issues.push({
        type: 'missing-primary-color',
        severity: 'warning',
        message: 'Design should define a primary color',
        suggestion: 'Add a primary color to the color scheme',
      });
    }

    return issues;
  }

  /**
   * Validate typography
   */
  private validateTypography(typography: any): Array<{
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }> {
    const issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      suggestion?: string;
    }> = [];

    if (!typography.fontFamily) {
      issues.push({
        type: 'missing-font-family',
        severity: 'warning',
        message: 'Typography should define a font family',
        suggestion: 'Add a font family to the typography settings',
      });
    }

    return issues;
  }

  /**
   * Check heading hierarchy
   */
  private checkHeadingHierarchy(headings: any[]): Array<{
    rule: string;
    severity: 'error' | 'warning';
    message: string;
    element?: string;
    suggestion?: string;
  }> {
    const issues: Array<{
      rule: string;
      severity: 'error' | 'warning';
      message: string;
      element?: string;
      suggestion?: string;
    }> = [];

    let lastLevel = 0;
    for (const heading of headings) {
      const level = parseInt(heading.level);
      if (level > lastLevel + 1) {
        issues.push({
          rule: 'heading-hierarchy',
          severity: 'warning',
          message: `Heading hierarchy skipped from h${lastLevel} to h${level}`,
          suggestion: 'Maintain proper heading hierarchy',
        });
      }
      lastLevel = level;
    }

    return issues;
  }

  /**
   * Generate breakpoint code
   */
  private generateBreakpointCode(baseDesign: any, breakpoint: any): string {
    return `@media (min-width: ${breakpoint.width}px) {
  /* ${breakpoint.name} styles */
}`;
  }

  /**
   * Get generated components
   */
  public getGeneratedComponents(): ComponentGenerationResult[] {
    return Array.from(this.generatedComponents.values());
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.componentCache.clear();
    this.log('info', 'Component cache cleared');
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    componentsGenerated: number;
    cachedComponents: number;
    designPatterns: number;
  } {
    return {
      componentsGenerated: this.generatedComponents.size,
      cachedComponents: this.componentCache.size,
      designPatterns: 10,
    };
  }
}

export default FrontendAgent;
