import { DependencyInfo, ExportInfo, ComponentInfo, FileInfo, AnalyzerConfig } from '../types/analysis-types';
export declare class DependencyAnalyzer {
    private project;
    private config;
    constructor(config: AnalyzerConfig);
    /**
     * プロジェクト全体の依存関係を解析
     */
    analyzeDependencies(files: FileInfo[]): Promise<DependencyInfo[]>;
    /**
     * 単一ファイルのインポート情報を解析
     */
    private analyzeFileImports;
    /**
     * インポート情報を抽出
     */
    private extractImportInfo;
    /**
     * エクスポート情報を解析
     */
    analyzeExports(files: FileInfo[]): Promise<Map<string, ExportInfo[]>>;
    /**
     * エクスポート情報を抽出
     */
    private extractExportInfo;
    /**
     * React コンポーネント情報を解析
     */
    analyzeComponents(files: FileInfo[]): Promise<ComponentInfo[]>;
    /**
     * コンポーネント情報を抽出
     */
    private extractComponentInfo;
    /**
     * React コンポーネントかどうかを判定
     */
    private isReactComponent;
    /**
     * 依存関係のタイプを判定
     */
    private determineDependencyType;
    /**
     * 循環依存を検出
     */
    detectCircularDependencies(dependencies: DependencyInfo[]): string[][];
}
//# sourceMappingURL=dependency-analyzer.d.ts.map