import { AnalysisResult, AnalyzerConfig } from './types/analysis-types';
export declare class SiteAnalyzer {
    private config;
    private projectScanner;
    private dependencyAnalyzer;
    constructor(config: AnalyzerConfig);
    /**
     * 完全な解析を実行
     */
    analyze(): Promise<AnalysisResult>;
    /**
     * プロジェクトメトリクスを計算
     */
    private calculateMetrics;
    /**
     * 複雑性メトリクスを計算
     */
    private calculateComplexityMetrics;
    /**
     * 保守性メトリクスを計算
     */
    private calculateMaintainabilityMetrics;
    /**
     * テストカバレッジメトリクスを計算
     */
    private calculateTestCoverageMetrics;
    /**
     * 問題を検出
     */
    private detectIssues;
    /**
     * 依存関係の深さを計算
     */
    private calculateDependencyDepth;
    /**
     * 結合度を計算
     */
    private calculateCoupling;
    /**
     * テストされているコンポーネント数を推定
     */
    private estimateTestedComponents;
}
//# sourceMappingURL=analyzer.d.ts.map