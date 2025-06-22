import { Project, SourceFile, SyntaxKind, ImportDeclaration, ExportDeclaration } from 'ts-morph';
import * as path from 'path';
import {
  DependencyInfo,
  DependencyType,
  ImportInfo,
  ExportInfo,
  ComponentInfo,
  FileInfo,
  AnalyzerConfig
} from '../types/analysis-types';
import { resolveImportPath, normalizePath } from '../utils/file-utils';

export class DependencyAnalyzer {
  private project: Project;
  private config: AnalyzerConfig;

  constructor(config: AnalyzerConfig) {
    this.config = config;
    this.project = new Project({
      tsConfigFilePath: path.join(config.projectRoot, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: true
    });
  }

  /**
   * プロジェクト全体の依存関係を解析
   */
  async analyzeDependencies(files: FileInfo[]): Promise<DependencyInfo[]> {
    console.log('📊 依存関係を解析中...');

    // TypeScript/JavaScript ファイルのみを対象とする
    const sourceFiles = files.filter(file => 
      file.extension === '.ts' || 
      file.extension === '.tsx' ||
      file.extension === '.js' ||
      file.extension === '.jsx'
    );

    // プロジェクトにファイルを追加
    const addedFiles = sourceFiles.map(file => 
      this.project.addSourceFileAtPath(file.path)
    );

    const dependencies: DependencyInfo[] = [];

    for (const sourceFile of addedFiles) {
      const fileDependencies = await this.analyzeFileImports(sourceFile);
      dependencies.push(...fileDependencies);
    }

    if (this.config.verbose) {
      console.log(`✅ ${dependencies.length} 個の依存関係を検出しました`);
    }

    return dependencies;
  }

  /**
   * 単一ファイルのインポート情報を解析
   */
  private async analyzeFileImports(sourceFile: SourceFile): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    const filePath = sourceFile.getFilePath();

    // import文を解析
    const importDeclarations = sourceFile.getImportDeclarations();
    
    for (const importDecl of importDeclarations) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) continue;

      const importInfo = this.extractImportInfo(importDecl);
      const dependencyType = this.determineDependencyType(moduleSpecifier);
      
      let resolvedPath = moduleSpecifier;
      if (dependencyType === DependencyType.RELATIVE || dependencyType === DependencyType.INTERNAL) {
        resolvedPath = resolveImportPath(filePath, moduleSpecifier);
      }

      dependencies.push({
        from: normalizePath(filePath),
        to: normalizePath(resolvedPath),
        type: dependencyType,
        imports: importInfo.imports
      });
    }

    return dependencies;
  }

  /**
   * インポート情報を抽出
   */
  private extractImportInfo(importDecl: ImportDeclaration): ImportInfo {
    const moduleSpecifier = importDecl.getModuleSpecifierValue() || '';
    const imports: string[] = [];
    let isDefault = false;
    let isNamespace = false;

    // default import
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      imports.push(defaultImport.getText());
      isDefault = true;
    }

    // namespace import (import * as foo)
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      imports.push(namespaceImport.getText());
      isNamespace = true;
    }

    // named imports
    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
      imports.push(namedImport.getName());
    }

    return {
      source: moduleSpecifier,
      imports,
      isDefault,
      isNamespace,
      line: importDecl.getStartLineNumber()
    };
  }

  /**
   * エクスポート情報を解析
   */
  async analyzeExports(files: FileInfo[]): Promise<Map<string, ExportInfo[]>> {
    const exportsMap = new Map<string, ExportInfo[]>();

    const sourceFiles = files.filter(file => 
      file.extension === '.ts' || 
      file.extension === '.tsx' ||
      file.extension === '.js' ||
      file.extension === '.jsx'
    );

    for (const file of sourceFiles) {
      try {
        const sourceFile = this.project.addSourceFileAtPath(file.path);
        const exports = this.extractExportInfo(sourceFile);
        exportsMap.set(normalizePath(file.path), exports);
      } catch (error) {
        console.warn(`エクスポート解析エラー: ${file.path}`, error);
      }
    }

    return exportsMap;
  }

  /**
   * エクスポート情報を抽出
   */
  private extractExportInfo(sourceFile: SourceFile): ExportInfo[] {
    const exports: ExportInfo[] = [];

    // export declarations
    const exportDeclarations = sourceFile.getExportDeclarations();
    for (const exportDecl of exportDeclarations) {
      const namedExports = exportDecl.getNamedExports();
      for (const namedExport of namedExports) {
        exports.push({
          name: namedExport.getName(),
          isDefault: false,
          line: exportDecl.getStartLineNumber()
        });
      }
    }

    // function declarations with export
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      if (func.hasExportKeyword()) {
        exports.push({
          name: func.getName() || 'anonymous',
          isDefault: func.hasDefaultKeyword(),
          line: func.getStartLineNumber(),
          type: 'function'
        });
      }
    }

    // variable declarations with export
    const variableStatements = sourceFile.getVariableStatements();
    for (const varStatement of variableStatements) {
      if (varStatement.hasExportKeyword()) {
        const declarations = varStatement.getDeclarations();
        for (const decl of declarations) {
          exports.push({
            name: decl.getName(),
            isDefault: varStatement.hasDefaultKeyword(),
            line: varStatement.getStartLineNumber(),
            type: 'variable'
          });
        }
      }
    }

    // class declarations with export
    const classes = sourceFile.getClasses();
    for (const cls of classes) {
      if (cls.hasExportKeyword()) {
        exports.push({
          name: cls.getName() || 'anonymous',
          isDefault: cls.hasDefaultKeyword(),
          line: cls.getStartLineNumber(),
          type: 'class'
        });
      }
    }

    // interface declarations with export
    const interfaces = sourceFile.getInterfaces();
    for (const iface of interfaces) {
      if (iface.hasExportKeyword()) {
        exports.push({
          name: iface.getName(),
          isDefault: false,
          line: iface.getStartLineNumber(),
          type: 'interface'
        });
      }
    }

    return exports;
  }

  /**
   * React コンポーネント情報を解析
   */
  async analyzeComponents(files: FileInfo[]): Promise<ComponentInfo[]> {
    console.log('⚛️  React コンポーネントを解析中...');

    const components: ComponentInfo[] = [];
    const reactFiles = files.filter(file => 
      file.extension === '.tsx' || 
      (file.extension === '.jsx' && file.name.includes('Component'))
    );

    for (const file of reactFiles) {
      try {
        const sourceFile = this.project.addSourceFileAtPath(file.path);
        const fileComponents = await this.extractComponentInfo(sourceFile);
        components.push(...fileComponents);
      } catch (error) {
        console.warn(`コンポーネント解析エラー: ${file.path}`, error);
      }
    }

    if (this.config.verbose) {
      console.log(`✅ ${components.length} 個の React コンポーネントを検出しました`);
    }

    return components;
  }

  /**
   * コンポーネント情報を抽出
   */
  private async extractComponentInfo(sourceFile: SourceFile): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    const filePath = sourceFile.getFilePath();

    // 関数コンポーネントを検索
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      if (this.isReactComponent(func.getText())) {
        const component: ComponentInfo = {
          name: func.getName() || 'Anonymous',
          filePath: normalizePath(filePath),
          props: [], // TODO: prop types を解析
          isReactComponent: true,
          exportType: func.hasDefaultKeyword() ? 'default' : 'named',
          usageCount: 0 // TODO: 使用回数を計算
        };
        components.push(component);
      }
    }

    // 変数として定義されたコンポーネントを検索
    const variableStatements = sourceFile.getVariableStatements();
    for (const varStatement of variableStatements) {
      const declarations = varStatement.getDeclarations();
      for (const decl of declarations) {
        const initializer = decl.getInitializer();
        if (initializer && this.isReactComponent(initializer.getText())) {
          const component: ComponentInfo = {
            name: decl.getName(),
            filePath: normalizePath(filePath),
            props: [],
            isReactComponent: true,
            exportType: varStatement.hasDefaultKeyword() ? 'default' : 'named',
            usageCount: 0
          };
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * React コンポーネントかどうかを判定
   */
  private isReactComponent(code: string): boolean {
    // JSX の return 文があるかどうかをチェック
    const hasJSXReturn = /return\s*\(?\s*</.test(code) || /return\s*</.test(code);
    
    // React hooks の使用があるかどうかをチェック
    const hasReactHooks = /use[A-Z]\w*\(/.test(code);
    
    return hasJSXReturn || hasReactHooks;
  }

  /**
   * 依存関係のタイプを判定
   */
  private determineDependencyType(moduleSpecifier: string): DependencyType {
    if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
      return DependencyType.RELATIVE;
    }
    
    if (moduleSpecifier.startsWith('@/') || 
        moduleSpecifier.startsWith('~/') ||
        !moduleSpecifier.includes('/') && !moduleSpecifier.startsWith('@')) {
      return DependencyType.INTERNAL;
    }
    
    return DependencyType.EXTERNAL;
  }

  /**
   * 循環依存を検出
   */
  detectCircularDependencies(dependencies: DependencyInfo[]): string[][] {
    const graph = new Map<string, string[]>();
    
    // グラフを構築
    for (const dep of dependencies) {
      if (dep.type !== DependencyType.EXTERNAL) {
        if (!graph.has(dep.from)) {
          graph.set(dep.from, []);
        }
        graph.get(dep.from)!.push(dep.to);
      }
    }

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // 循環を発見
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), node]);
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, [...path]);
      }

      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }
}