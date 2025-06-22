import { AnalysisResult } from '../types/analysis-types';
export declare class ReportGenerator {
    /**
     * コンソール形式のレポートを生成
     */
    generateConsoleReport(result: AnalysisResult): Promise<void>;
    /**
     * JSON形式のレポートを生成
     */
    generateJsonReport(result: AnalysisResult, outputPath: string): Promise<void>;
    /**
     * HTML形式のレポートを生成
     */
    generateHtmlReport(result: AnalysisResult, outputPath: string): Promise<void>;
    /**
     * プロジェクト概要を出力
     */
    private printProjectOverview;
    /**
     * ファイル統計を出力
     */
    private printFileStatistics;
    /**
     * 依存関係統計を出力
     */
    private printDependencyStatistics;
    /**
     * コンポーネント統計を出力
     */
    private printComponentStatistics;
    /**
     * メトリクスを出力
     */
    private printMetrics;
    /**
     * 問題・警告を出力
     */
    private printIssues;
    /**
     * 推奨事項を出力
     */
    private printRecommendations;
    /**
     * 推奨事項を生成
     */
    private generateRecommendations;
    /**
     * サマリーを生成
     */
    private generateSummary;
    /**
     * 健全性スコアを計算
     */
    private calculateHealthScore;
    /**
     * HTML レポートのコンテンツを生成
     */
    private generateHtmlContent;
    /**
     * ファイルタイプのアイコンを取得
     */
    private getFileTypeIcon;
}
//# sourceMappingURL=report-generator.d.ts.map