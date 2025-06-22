"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyAnalyzer = void 0;
const ts_morph_1 = require("ts-morph");
const path = __importStar(require("path"));
const analysis_types_1 = require("../types/analysis-types");
const file_utils_1 = require("../utils/file-utils");
class DependencyAnalyzer {
    constructor(config) {
        this.config = config;
        this.project = new ts_morph_1.Project({
            tsConfigFilePath: path.join(config.projectRoot, 'tsconfig.json'),
            skipAddingFilesFromTsConfig: true
        });
    }
    /**
     * プロジェクト全体の依存関係を解析
     */
    async analyzeDependencies(files) {
        console.log('📊 依存関係を解析中...');
        // TypeScript/JavaScript ファイルのみを対象とする
        const sourceFiles = files.filter(file => file.extension === '.ts' ||
            file.extension === '.tsx' ||
            file.extension === '.js' ||
            file.extension === '.jsx');
        // プロジェクトにファイルを追加
        const addedFiles = sourceFiles.map(file => this.project.addSourceFileAtPath(file.path));
        const dependencies = [];
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
    async analyzeFileImports(sourceFile) {
        const dependencies = [];
        const filePath = sourceFile.getFilePath();
        // import文を解析
        const importDeclarations = sourceFile.getImportDeclarations();
        for (const importDecl of importDeclarations) {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            if (!moduleSpecifier)
                continue;
            const importInfo = this.extractImportInfo(importDecl);
            const dependencyType = this.determineDependencyType(moduleSpecifier);
            let resolvedPath = moduleSpecifier;
            if (dependencyType === analysis_types_1.DependencyType.RELATIVE || dependencyType === analysis_types_1.DependencyType.INTERNAL) {
                resolvedPath = (0, file_utils_1.resolveImportPath)(filePath, moduleSpecifier);
            }
            dependencies.push({
                from: (0, file_utils_1.normalizePath)(filePath),
                to: (0, file_utils_1.normalizePath)(resolvedPath),
                type: dependencyType,
                imports: importInfo.imports
            });
        }
        return dependencies;
    }
    /**
     * インポート情報を抽出
     */
    extractImportInfo(importDecl) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue() || '';
        const imports = [];
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
    async analyzeExports(files) {
        const exportsMap = new Map();
        const sourceFiles = files.filter(file => file.extension === '.ts' ||
            file.extension === '.tsx' ||
            file.extension === '.js' ||
            file.extension === '.jsx');
        for (const file of sourceFiles) {
            try {
                const sourceFile = this.project.addSourceFileAtPath(file.path);
                const exports = this.extractExportInfo(sourceFile);
                exportsMap.set((0, file_utils_1.normalizePath)(file.path), exports);
            }
            catch (error) {
                console.warn(`エクスポート解析エラー: ${file.path}`, error);
            }
        }
        return exportsMap;
    }
    /**
     * エクスポート情報を抽出
     */
    extractExportInfo(sourceFile) {
        const exports = [];
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
    async analyzeComponents(files) {
        console.log('⚛️  React コンポーネントを解析中...');
        const components = [];
        const reactFiles = files.filter(file => file.extension === '.tsx' ||
            (file.extension === '.jsx' && file.name.includes('Component')));
        for (const file of reactFiles) {
            try {
                const sourceFile = this.project.addSourceFileAtPath(file.path);
                const fileComponents = await this.extractComponentInfo(sourceFile);
                components.push(...fileComponents);
            }
            catch (error) {
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
    async extractComponentInfo(sourceFile) {
        const components = [];
        const filePath = sourceFile.getFilePath();
        // 関数コンポーネントを検索
        const functions = sourceFile.getFunctions();
        for (const func of functions) {
            if (this.isReactComponent(func.getText())) {
                const component = {
                    name: func.getName() || 'Anonymous',
                    filePath: (0, file_utils_1.normalizePath)(filePath),
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
                    const component = {
                        name: decl.getName(),
                        filePath: (0, file_utils_1.normalizePath)(filePath),
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
    isReactComponent(code) {
        // JSX の return 文があるかどうかをチェック
        const hasJSXReturn = /return\s*\(?\s*</.test(code) || /return\s*</.test(code);
        // React hooks の使用があるかどうかをチェック
        const hasReactHooks = /use[A-Z]\w*\(/.test(code);
        return hasJSXReturn || hasReactHooks;
    }
    /**
     * 依存関係のタイプを判定
     */
    determineDependencyType(moduleSpecifier) {
        if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
            return analysis_types_1.DependencyType.RELATIVE;
        }
        if (moduleSpecifier.startsWith('@/') ||
            moduleSpecifier.startsWith('~/') ||
            !moduleSpecifier.includes('/') && !moduleSpecifier.startsWith('@')) {
            return analysis_types_1.DependencyType.INTERNAL;
        }
        return analysis_types_1.DependencyType.EXTERNAL;
    }
    /**
     * 循環依存を検出
     */
    detectCircularDependencies(dependencies) {
        const graph = new Map();
        // グラフを構築
        for (const dep of dependencies) {
            if (dep.type !== analysis_types_1.DependencyType.EXTERNAL) {
                if (!graph.has(dep.from)) {
                    graph.set(dep.from, []);
                }
                graph.get(dep.from).push(dep.to);
            }
        }
        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (node, path) => {
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
exports.DependencyAnalyzer = DependencyAnalyzer;
//# sourceMappingURL=dependency-analyzer.js.map