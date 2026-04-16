/**
 * Frontend Agent Unit Tests
 *
 * Comprehensive test suite for the FrontendAgent class.
 * Tests React component generation, design validation, accessibility checking,
 * responsive design generation, and style generation.
 *
 * Architecture: Phase 2 - Core Agents Implementation
 * Task: Task 17 - Frontend Agent Implementation (Week 3)
 *
 * @module tests/agents/frontend-agent.test.ts
 */

import { FrontendAgent, FrontendAgentConfig, ComponentGenerationResult } from '../../src/agents/frontend-agent';

describe('FrontendAgent', () => {
  let agent: FrontendAgent;

  beforeEach(() => {
    const config: FrontendAgentConfig = {
      name: 'test-frontend-agent',
      description: 'Test frontend agent',
      componentFramework: 'react',
      styleFramework: 'tailwind',
      enableAccessibility: true,
      enableResponsive: true,
      enableValidation: true,
      maxIterations: 50,
      timeout: 30000,
      retryAttempts: 3,
    };

    agent = new FrontendAgent(config);
  });

  afterEach(() => {
    agent.clearCache();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      const info = agent.getInfo();
      expect(info.name).toBe('test-frontend-agent');
      expect(info.description).toBe('Test frontend agent');
    });

    it('should initialize with default values', () => {
      const config: FrontendAgentConfig = {
        name: 'minimal-agent',
        description: 'Minimal agent',
      };

      const minimalAgent = new FrontendAgent(config);
      const info = minimalAgent.getInfo();

      expect(info.name).toBe('minimal-agent');
      expect(info.tools.length).toBeGreaterThan(0);
    });

    it('should register all frontend tools', () => {
      const tools = agent.getTools();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).toContain('generate-react-component');
      expect(toolNames).toContain('validate-design');
      expect(toolNames).toContain('check-accessibility');
      expect(toolNames).toContain('generate-responsive-design');
      expect(toolNames).toContain('generate-styles');
    });

    it('should have 5 tools registered', () => {
      const tools = agent.getTools();
      expect(tools.length).toBe(5);
    });
  });

  describe('React Component Generation', () => {
    it('should generate a functional component', async () => {
      const result = await (agent as any).generateReactComponent({
        componentName: 'Button',
        componentType: 'functional',
        props: [
          { name: 'label', type: 'string', required: true },
          { name: 'onClick', type: 'function', required: false },
        ],
        description: 'A reusable button component',
      });

      expect(result.success).toBe(true);
      expect(result.code).toContain('Button');
      expect(result.code).toContain('React.FC');
      expect(result.language).toBe('typescript');
      expect(result.metadata.framework).toBe('react');
      expect(result.metadata.lineCount).toBeGreaterThan(0);
      expect(result.metadata.complexity).toBeGreaterThan(0);
    });

    it('should generate a class component', async () => {
      const result = await (agent as any).generateReactComponent({
        componentName: 'Card',
        componentType: 'class',
        props: [{ name: 'title', type: 'string', required: true }],
        description: 'A card component',
      });

      expect(result.success).toBe(true);
      expect(result.code).toContain('extends React.Component');
      expect(result.code).toContain('Card');
    });

    it('should generate a hook component', async () => {
      const result = await (agent as any).generateReactComponent({
        componentName: 'useCounter',
        componentType: 'hook',
        props: [{ name: 'initialValue', type: 'number', required: false }],
        description: 'A counter hook',
      });

      expect(result.success).toBe(true);
      expect(result.code).toContain('useCounter');
      expect(result.code).toContain('useState');
    });

    it('should cache generated components', async () => {
      const result1 = await (agent as any).generateReactComponent({
        componentName: 'Button',
        componentType: 'functional',
        props: [],
        description: 'Button component',
      });

      const result2 = await (agent as any).generateReactComponent({
        componentName: 'Button',
        componentType: 'functional',
        props: [],
        description: 'Button component',
      });

      expect(result1.code).toBe(result2.code);
    });

    it('should store generated components', async () => {
      await (agent as any).generateReactComponent({
        componentName: 'TestComponent',
        componentType: 'functional',
        props: [],
        description: 'Test component',
      });

      const components = agent.getGeneratedComponents();
      expect(components.length).toBeGreaterThan(0);
      expect(components[0].componentName).toBe('TestComponent');
    });

    it('should emit component-generated event', (done) => {
      agent.on('component-generated', (data) => {
        expect(data.componentName).toBeDefined();
        expect(data.result).toBeDefined();
        done();
      });

      (agent as any).generateReactComponent({
        componentName: 'EventTest',
        componentType: 'functional',
        props: [],
        description: 'Event test component',
      });
    });

    it('should handle component generation errors gracefully', async () => {
      const result = await (agent as any).generateReactComponent({
        componentName: '',
        componentType: 'invalid',
        props: [],
        description: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
    });

    it('should generate components with multiple props', async () => {
      const result = await (agent as any).generateReactComponent({
        componentName: 'Form',
        componentType: 'functional',
        props: [
          { name: 'title', type: 'string', required: true },
          { name: 'onSubmit', type: 'function', required: true },
          { name: 'fields', type: 'array', required: true },
          { name: 'loading', type: 'boolean', required: false },
        ],
        description: 'A form component',
      });

      expect(result.success).toBe(true);
      expect(result.props.length).toBe(4);
      expect(result.metadata.complexity).toBeGreaterThan(1);
    });
  });

  describe('Design Validation', () => {
    it('should validate a valid design', async () => {
      const result = await (agent as any).validateDesign({
        design: {
          name: 'MyDesign',
          components: [{ name: 'Button' }],
          colors: { primary: '#007bff' },
          typography: { fontFamily: 'Arial' },
        },
      });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect missing design name', async () => {
      const result = await (agent as any).validateDesign({
        design: {
          components: [{ name: 'Button' }],
        },
      });

      expect(result.success).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('missing-name');
    });

    it('should detect missing components', async () => {
      const result = await (agent as any).validateDesign({
        design: {
          name: 'MyDesign',
        },
      });

      expect(result.issues.some((i: any) => i.type === 'missing-components')).toBe(true);
    });

    it('should validate color scheme', async () => {
      const result = await (agent as any).validateDesign({
        design: {
          name: 'MyDesign',
          components: [{ name: 'Button' }],
          colors: {},
        },
      });

      expect(result.issues.some((i: any) => i.type === 'missing-primary-color')).toBe(true);
    });

    it('should validate typography', async () => {
      const result = await (agent as any).validateDesign({
        design: {
          name: 'MyDesign',
          components: [{ name: 'Button' }],
          typography: {},
        },
      });

      expect(result.issues.some((i: any) => i.type === 'missing-font-family')).toBe(true);
    });

    it('should emit design-validated event', (done) => {
      agent.on('design-validated', (data) => {
        expect(data.success).toBeDefined();
        done();
      });

      (agent as any).validateDesign({
        design: { name: 'Test', components: [{ name: 'Button' }] },
      });
    });

    it('should handle validation errors gracefully', async () => {
      const result = await (agent as any).validateDesign({
        design: null,
      });

      expect(result.success).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility Checking', () => {
    it('should check accessibility for valid component', async () => {
      const result = await (agent as any).checkAccessibility({
        component: {
          type: 'button',
          ariaLabel: 'Submit',
          interactive: true,
          keyboardAccessible: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.wcagLevel).toBe('AA');
      expect(result.metadata.totalChecks).toBeGreaterThan(0);
    });

    it('should detect missing alt text', async () => {
      const result = await (agent as any).checkAccessibility({
        component: {
          type: 'image',
          interactive: false,
        },
      });

      expect(result.issues.some((i: any) => i.rule === 'image-alt-text')).toBe(true);
    });

    it('should detect missing ARIA labels', async () => {
      const result = await (agent as any).checkAccessibility({
        component: {
          type: 'button',
          interactive: true,
        },
      });

      expect(result.issues.some((i: any) => i.rule === 'aria-label')).toBe(true);
    });

    it('should detect keyboard navigation issues', async () => {
      const result = await (agent as any).checkAccessibility({
        component: {
          type: 'button',
          interactive: true,
          keyboardAccessible: false,
        },
      });

      expect(result.issues.some((i: any) => i.rule === 'keyboard-navigation')).toBe(true);
    });

    it('should support different WCAG levels', async () => {
      const result = await (agent as any).checkAccessibility({
        component: { type: 'button' },
        wcagLevel: 'AAA',
      });

      expect(result.wcagLevel).toBe('AAA');
    });

    it('should emit accessibility-checked event', (done) => {
      agent.on('accessibility-checked', (data) => {
        expect(data.success).toBeDefined();
        done();
      });

      (agent as any).checkAccessibility({
        component: { type: 'button' },
      });
    });

    it('should calculate accessibility score', async () => {
      const result = await (agent as any).checkAccessibility({
        component: {
          type: 'button',
          ariaLabel: 'Click me',
          interactive: true,
          keyboardAccessible: true,
        },
      });

      expect(result.metadata.passedChecks).toBeGreaterThan(0);
      expect(result.metadata.totalChecks).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design Generation', () => {
    it('should generate responsive design with default breakpoints', async () => {
      const result = await (agent as any).generateResponsiveDesign({
        baseDesign: { name: 'MyDesign' },
      });

      expect(result.success).toBe(true);
      expect(result.breakpoints.length).toBeGreaterThan(0);
      expect(result.metadata.breakpointCount).toBeGreaterThan(0);
    });

    it('should generate responsive design with custom breakpoints', async () => {
      const result = await (agent as any).generateResponsiveDesign({
        baseDesign: { name: 'MyDesign' },
        breakpoints: [
          { name: 'small', width: 480 },
          { name: 'large', width: 1200 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.breakpoints.length).toBe(2);
      expect(result.breakpoints[0].name).toBe('small');
      expect(result.breakpoints[1].name).toBe('large');
    });

    it('should generate media queries', async () => {
      const result = await (agent as any).generateResponsiveDesign({
        baseDesign: { name: 'MyDesign' },
      });

      expect(result.breakpoints.every((bp: any) => bp.code)).toBe(true);
    });

    it('should emit responsive-design-generated event', (done) => {
      agent.on('responsive-design-generated', (data) => {
        expect(data.success).toBeDefined();
        done();
      });

      (agent as any).generateResponsiveDesign({
        baseDesign: { name: 'Test' },
      });
    });

    it('should use mobile-first approach', async () => {
      const result = await (agent as any).generateResponsiveDesign({
        baseDesign: { name: 'MyDesign' },
      });

      expect(result.metadata.mobileFirst).toBe(true);
    });

    it('should handle responsive design errors gracefully', async () => {
      const result = await (agent as any).generateResponsiveDesign({
        baseDesign: null,
      });

      expect(result.success).toBe(false);
      expect(result.breakpoints.length).toBe(0);
    });
  });

  describe('Style Generation', () => {
    it('should generate Tailwind styles', async () => {
      const result = await (agent as any).generateStyles({
        design: {
          colors: { primary: '#007bff', secondary: '#6c757d' },
          spacing: { small: '0.5rem', medium: '1rem' },
        },
        framework: 'tailwind',
      });

      expect(result.success).toBe(true);
      expect(result.language).toBe('html');
      expect(result.styles).toContain('primary');
      expect(result.metadata.framework).toBe('tailwind');
    });

    it('should generate styled-components styles', async () => {
      const result = await (agent as any).generateStyles({
        design: {
          colors: { primary: '#007bff' },
        },
        framework: 'styled-components',
      });

      expect(result.success).toBe(true);
      expect(result.language).toBe('css');
      expect(result.styles).toContain('styled');
    });

    it('should generate CSS Modules styles', async () => {
      const result = await (agent as any).generateStyles({
        design: {
          colors: { primary: '#007bff' },
        },
        framework: 'css-modules',
      });

      expect(result.success).toBe(true);
      expect(result.language).toBe('css');
      expect(result.styles).toContain(':root');
    });

    it('should extract design variables', async () => {
      const result = await (agent as any).generateStyles({
        design: {
          colors: { primary: '#007bff', secondary: '#6c757d' },
          spacing: { small: '0.5rem' },
        },
      });

      expect(result.variables).toBeDefined();
      expect(Object.keys(result.variables || {}).length).toBeGreaterThan(0);
    });

    it('should emit styles-generated event', (done) => {
      agent.on('styles-generated', (data) => {
        expect(data.success).toBeDefined();
        done();
      });

      (agent as any).generateStyles({
        design: { colors: { primary: '#007bff' } },
      });
    });

    it('should handle style generation errors gracefully', async () => {
      const result = await (agent as any).generateStyles({
        design: null,
      });

      expect(result.success).toBe(false);
      expect(result.styles).toBe('');
    });

    it('should use default framework if not specified', async () => {
      const result = await (agent as any).generateStyles({
        design: { colors: { primary: '#007bff' } },
      });

      expect(result.success).toBe(true);
      expect(result.metadata.framework).toBe('tailwind');
    });
  });

  describe('Statistics and Cache Management', () => {
    it('should track generated components', async () => {
      await (agent as any).generateReactComponent({
        componentName: 'Component1',
        componentType: 'functional',
        description: 'Component 1',
      });

      await (agent as any).generateReactComponent({
        componentName: 'Component2',
        componentType: 'functional',
        description: 'Component 2',
      });

      const stats = agent.getStatistics();
      expect(stats.componentsGenerated).toBe(2);
    });

    it('should track cached components', async () => {
      await (agent as any).generateReactComponent({
        componentName: 'Button',
        componentType: 'functional',
        description: 'Button component',
      });

      await (agent as any).generateReactComponent({
        componentName: 'Button',
        componentType: 'functional',
        description: 'Button component',
      });

      const stats = agent.getStatistics();
      expect(stats.cachedComponents).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      await (agent as any).generateReactComponent({
        componentName: 'Button',
        componentType: 'functional',
        description: 'Button component',
      });

      agent.clearCache();

      const stats = agent.getStatistics();
      expect(stats.cachedComponents).toBe(0);
    });

    it('should return statistics', () => {
      const stats = agent.getStatistics();

      expect(stats.componentsGenerated).toBeDefined();
      expect(stats.cachedComponents).toBeDefined();
      expect(stats.designPatterns).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should generate complete component with validation and accessibility', async () => {
      const result = await (agent as any).generateReactComponent({
        componentName: 'CompleteButton',
        componentType: 'functional',
        props: [
          { name: 'label', type: 'string', required: true },
          { name: 'onClick', type: 'function', required: true },
        ],
        description: 'A complete button component',
      });

      expect(result.success).toBe(true);
      expect(result.code).toContain('CompleteButton');
      expect(result.metadata.lineCount).toBeGreaterThan(0);
    });

    it('should validate and generate styles for design', async () => {
      const design = {
        name: 'TestDesign',
        components: [{ name: 'Button' }],
        colors: { primary: '#007bff' },
        typography: { fontFamily: 'Arial' },
      };

      const validation = await (agent as any).validateDesign({ design });
      expect(validation.success).toBe(true);

      const styles = await (agent as any).generateStyles({ design });
      expect(styles.success).toBe(true);
    });

    it('should generate responsive design with accessibility checks', async () => {
      const component = {
        type: 'button',
        ariaLabel: 'Submit',
        interactive: true,
        keyboardAccessible: true,
      };

      const a11y = await (agent as any).checkAccessibility({ component });
      expect(a11y.success).toBe(true);

      const responsive = await (agent as any).generateResponsiveDesign({
        baseDesign: { name: 'TestDesign' },
      });
      expect(responsive.success).toBe(true);
    });

    it('should handle multiple component generations', async () => {
      const components = ['Button', 'Card', 'Modal', 'Form', 'Input'];

      for (const name of components) {
        const result = await (agent as any).generateReactComponent({
          componentName: name,
          componentType: 'functional',
          description: `${name} component`,
        });
        expect(result.success).toBe(true);
      }

      const generated = agent.getGeneratedComponents();
      expect(generated.length).toBe(components.length);
    });
  });

  describe('Configuration Options', () => {
    it('should respect component framework configuration', () => {
      const config: FrontendAgentConfig = {
        name: 'vue-agent',
        description: 'Vue agent',
        componentFramework: 'vue',
      };

      const vueAgent = new FrontendAgent(config);
      const info = vueAgent.getInfo();

      expect(info.name).toBe('vue-agent');
    });

    it('should respect style framework configuration', () => {
      const config: FrontendAgentConfig = {
        name: 'styled-agent',
        description: 'Styled agent',
        styleFramework: 'styled-components',
      };

      const styledAgent = new FrontendAgent(config);
      expect(styledAgent).toBeDefined();
    });

    it('should respect accessibility configuration', async () => {
      const config: FrontendAgentConfig = {
        name: 'no-a11y-agent',
        description: 'No a11y agent',
        enableAccessibility: false,
      };

      const noA11yAgent = new FrontendAgent(config);
      const result = await (noA11yAgent as any).generateReactComponent({
        componentName: 'Button',
        componentType: 'functional',
        description: 'Button component',
      });

      expect(result.success).toBe(true);
    });

    it('should respect responsive design configuration', async () => {
      const config: FrontendAgentConfig = {
        name: 'no-responsive-agent',
        description: 'No responsive agent',
        enableResponsive: false,
      };

      const noResponsiveAgent = new FrontendAgent(config);
      expect(noResponsiveAgent).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid component types', async () => {
      const result = await (agent as any).generateReactComponent({
        componentName: 'Test',
        componentType: 'invalid-type',
        description: 'Test component',
      });

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
    });

    it('should handle null parameters gracefully', async () => {
      const result = await (agent as any).generateReactComponent({
        componentName: null,
        componentType: null,
        description: 'Test',
      });

      expect(result.success).toBe(true);
    });

    it('should handle design validation with null design', async () => {
      const result = await (agent as any).validateDesign({
        design: null,
      });

      expect(result.success).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle accessibility check with null component', async () => {
      const result = await (agent as any).checkAccessibility({
        component: null,
      });

      expect(result.success).toBe(false);
    });
  });
});
