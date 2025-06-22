"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteAnalyzer = void 0;
const project_scanner_1 = require("./analyzers/project-scanner");
const dependency_analyzer_1 = require("./analyzers/dependency-analyzer");
const analysis_types_1 = require("./types/analysis-types");
class SiteAnalyzer {
    constructor(config) {
        this.config = config;
        this.projectScanner = new project_scanner_1.ProjectScanner(config);
        this.dependencyAnalyzer = new dependency_analyzer_1.DependencyAnalyzer(config);
    }
    /**
     * 完全な解析を実行
     */
    async analyze() {
        console.log('🚀 サイト構造解析を開始します...');
        console.log(`📂 対象プロジェクト: ${this.config.projectRoot}`);
        const startTime = Date.now();
        try {
            // 1. プロジェクト構造をスキャン
            const projectStructure = await this.projectScanner.scanProject();
            // 2. 依存関係を解析
            const allFiles = Object.values(projectStructure.filesByType).flat();
            const dependencies = await this.dependencyAnalyzer.analyzeDependencies(allFiles);
            // 3. コンポーネント情報を解析
            const components = await this.dependencyAnalyzer.analyzeComponents(allFiles);
            // 4. メトリクスを計算
            const metrics = await this.calculateMetrics(projectStructure, dependencies, components);
            // 5. 問題を検出
            const issues = await this.detectIssues(projectStructure, dependencies, components);
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            console.log(`✅ 解析完了 (${duration.toFixed(2)}秒)`);
            return {
                projectStructure,
                dependencies,
                components,
                metrics,
                issues
            };
        }
        catch (error) {
            console.error('❌ 解析中にエラーが発生しました:', error);
            throw error;
        }
    }
    /**
     * プロジェクトメトリクスを計算
     */
    async calculateMetrics(projectStructure, dependencies, components) {
        const allFiles = Object.values(projectStructure.filesByType).flat();
        // 複雑性メトリクス
        const complexity = this.calculateComplexityMetrics(allFiles, dependencies);
        // 保守性メトリクス
        const maintainability = this.calculateMaintainabilityMetrics(components, dependencies);
        // テストカバレッジメトリクス
        const testCoverage = this.calculateTestCoverageMetrics(projectStructure, components);
        return {
            complexity,
            maintainability,
            testCoverage
        };
    }
    /**
     * 複雑性メトリクスを計算
     */
    calculateComplexityMetrics(files, dependencies) {
        const fileSizes = files.map(f => f.lines);
        const averageFileSize = fileSizes.reduce((sum, size) => sum + size, 0) / fileSizes.length;
        const largestFiles = files
            .sort((a, b) => b.lines - a.lines)
            .slice(0, 10);
        // 依存関係の深さを計算
        const dependencyDepth = this.calculateDependencyDepth(dependencies);
        return {
            averageFileSize: Math.round(averageFileSize),
            largestFiles,
            cyclomaticComplexity: 0, // TODO: 実装
            dependencyDepth
        };
    }
    /**
     * 保守性メトリクスを計算
     */
    calculateMaintainabilityMetrics(components, dependencies) {
        // コンポーネント再利用性
        const totalComponents = components.length;
        const reusedComponents = components.filter(c => c.usageCount > 1).length;
        const componentReusability = totalComponents > 0 ? (reusedComponents / totalComponents) * 100 : 0;
        // 結合度を計算
        const coupling = this.calculateCoupling(dependencies);
        return {
            componentReusability: Math.round(componentReusability),
            codeduplication: 0, // TODO: 実装
            coupling,
            cohesion: 0 // TODO: 実装
        };
    }
    /**
     * テストカバレッジメトリクスを計算
     */
    calculateTestCoverageMetrics(projectStructure, components) {
        const testFiles = projectStructure.filesByType.test || [];
        const totalTestFiles = testFiles.length;
        // テストされているコンポーネント数を推定
        const testedComponents = this.estimateTestedComponents(testFiles, components);
        const coveragePercentage = components.length > 0
            ? (testedComponents / components.length) * 100
            : 0;
        return {
            totalTestFiles,
            testedComponents,
            coveragePercentage: Math.round(coveragePercentage)
        };
    }
    /**
     * 問題を検出
     */
    async detectIssues(projectStructure, dependencies, components) {
        const issues = [];
        // プロジェクト健全性チェック
        const healthIssues = await this.projectScanner.checkProjectHealth(projectStructure);
        issues.push(...healthIssues.map(message => ({
            type: analysis_types_1.IssueType.NO_TESTS,
            severity: analysis_types_1.IssueSeverity.WARNING,
            message
        })));
        // 循環依存の検出
        const circularDependencies = this.dependencyAnalyzer.detectCircularDependencies(dependencies);
        for (const cycle of circularDependencies) {
            issues.push({
                type: analysis_types_1.IssueType.CIRCULAR_DEPENDENCY,
                severity: analysis_types_1.IssueSeverity.ERROR,
                message: `循環依存が検出されました: ${cycle.join(' → ')}`,
                suggestion: '依存関係を見直して循環を解消してください'
            });
        }
        // 大きなファイルの検出
        const allFiles = Object.values(projectStructure.filesByType).flat();
        const largeFiles = allFiles.filter(file => file.lines > 300);
        for (const file of largeFiles) {
            issues.push({
                type: analysis_types_1.IssueType.LARGE_FILE,
                severity: analysis_types_1.IssueSeverity.WARNING,
                message: `大きなファイルが検出されました: ${file.name} (${file.lines}行)`,
                file: file.path,
                suggestion: 'ファイルを分割することを検討してください'
            });
        }
        // 複雑なコンポーネントの検出
        const complexComponents = components.filter(comp => {
            const file = allFiles.find(f => f.path === comp.filePath);
            return file && file.lines > 200;
        });
        for (const comp of complexComponents) {
            issues.push({
                type: analysis_types_1.IssueType.COMPLEX_COMPONENT,
                severity: analysis_types_1.IssueSeverity.WARNING,
                message: `複雑なコンポーネント: ${comp.name}`,
                file: comp.filePath,
                suggestion: 'コンポーネントを小さく分割することを検討してください'
            });
        }
        return issues;
    }
    /**
     * 依存関係の深さを計算
     */
    calculateDependencyDepth(dependencies) {
        const graph = new Map();
        for (const dep of dependencies) {
            if (!graph.has(dep.from)) {
                graph.set(dep.from, []);
            }
            graph.get(dep.from).push(dep.to);
        }
        let maxDepth = 0;
        const visited = new Set();
        const dfs = (node, depth) => {
            if (visited.has(node))
                return;
            visited.add(node);
            maxDepth = Math.max(maxDepth, depth);
            const neighbors = graph.get(node) || [];
            for (const neighbor of neighbors) {
                dfs(neighbor, depth + 1);
            }
        };
        for (const node of graph.keys()) {
            if (!visited.has(node)) {
                dfs(node, 0);
            }
        }
        return maxDepth;
    }
    /**
     * 結合度を計算
     */
    calculateCoupling(dependencies) {
        const fileCount = new Set([
            ...dependencies.map(d => d.from),
            ...dependencies.map(d => d.to)
        ]).size;
        return fileCount > 0 ? dependencies.length / fileCount : 0;
    }
    /**
     * テストされているコンポーネント数を推定
     */
    estimateTestedComponents(testFiles, components) {
        let testedCount = 0;
        for (const component of components) {
            const componentName = component.name.toLowerCase();
            const hasTest = testFiles.some(testFile => testFile.name.toLowerCase().includes(componentName) ||
                testFile.path.toLowerCase().includes(componentName));
            if (hasTest) {
                testedCount++;
            }
        }
        return testedCount;
    }
}
exports.SiteAnalyzer = SiteAnalyzer;
//# sourceMappingURL=analyzer.js.map