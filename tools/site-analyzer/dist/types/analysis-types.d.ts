export interface FileInfo {
    path: string;
    relativePath: string;
    name: string;
    extension: string;
    size: number;
    lines: number;
    type: FileType;
}
export declare enum FileType {
    TYPESCRIPT = "typescript",
    JAVASCRIPT = "javascript",
    REACT_COMPONENT = "react-component",
    NEXT_PAGE = "next-page",
    NEXT_LAYOUT = "next-layout",
    CONFIG = "config",
    TEST = "test",
    STYLE = "style",
    MARKDOWN = "markdown",
    JSON = "json",
    OTHER = "other"
}
export interface ImportInfo {
    source: string;
    imports: string[];
    isDefault: boolean;
    isNamespace: boolean;
    line: number;
}
export interface ExportInfo {
    name: string;
    isDefault: boolean;
    line: number;
    type?: string;
}
export interface DependencyInfo {
    from: string;
    to: string;
    type: DependencyType;
    imports: string[];
}
export declare enum DependencyType {
    INTERNAL = "internal",
    EXTERNAL = "external",
    RELATIVE = "relative"
}
export interface ComponentInfo {
    name: string;
    filePath: string;
    props: PropInfo[];
    isReactComponent: boolean;
    exportType: 'default' | 'named';
    usageCount: number;
}
export interface PropInfo {
    name: string;
    type: string;
    required: boolean;
    description?: string;
}
export interface ProjectStructure {
    rootPath: string;
    totalFiles: number;
    totalLines: number;
    filesByType: Record<FileType, FileInfo[]>;
    directories: DirectoryInfo[];
}
export interface DirectoryInfo {
    path: string;
    name: string;
    fileCount: number;
    subdirectories: string[];
}
export interface AnalysisResult {
    projectStructure: ProjectStructure;
    dependencies: DependencyInfo[];
    components: ComponentInfo[];
    metrics: ProjectMetrics;
    issues: AnalysisIssue[];
}
export interface ProjectMetrics {
    complexity: ComplexityMetrics;
    maintainability: MaintainabilityMetrics;
    testCoverage: TestCoverageMetrics;
}
export interface ComplexityMetrics {
    averageFileSize: number;
    largestFiles: FileInfo[];
    cyclomaticComplexity: number;
    dependencyDepth: number;
}
export interface MaintainabilityMetrics {
    componentReusability: number;
    codeduplication: number;
    coupling: number;
    cohesion: number;
}
export interface TestCoverageMetrics {
    totalTestFiles: number;
    testedComponents: number;
    coveragePercentage: number;
}
export interface AnalysisIssue {
    type: IssueType;
    severity: IssueSeverity;
    message: string;
    file?: string;
    line?: number;
    suggestion?: string;
}
export declare enum IssueType {
    CIRCULAR_DEPENDENCY = "circular-dependency",
    UNUSED_IMPORT = "unused-import",
    MISSING_TYPES = "missing-types",
    LARGE_FILE = "large-file",
    COMPLEX_COMPONENT = "complex-component",
    NO_TESTS = "no-tests"
}
export declare enum IssueSeverity {
    ERROR = "error",
    WARNING = "warning",
    INFO = "info"
}
export interface AnalyzerConfig {
    projectRoot: string;
    includePatterns: string[];
    excludePatterns: string[];
    outputFormat: 'json' | 'html' | 'console';
    outputPath?: string;
    generateGraph: boolean;
    verbose: boolean;
}
export interface ReportOptions {
    includeMetrics: boolean;
    includeDependencies: boolean;
    includeComponents: boolean;
    includeIssues: boolean;
    format: 'json' | 'html' | 'console';
}
//# sourceMappingURL=analysis-types.d.ts.map