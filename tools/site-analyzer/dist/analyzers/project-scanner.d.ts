import { ProjectStructure, AnalyzerConfig } from '../types/analysis-types';
export declare class ProjectScanner {
    private config;
    constructor(config: AnalyzerConfig);
    /**
     * プロジェクト全体をスキャンして構造を解析
     */
    scanProject(): Promise<ProjectStructure>;
    /**
     * ファイルをタイプ別にグループ化
     */
    private groupFilesByType;
    /**
     * ディレクトリ情報を構築
     */
    private buildDirectoryInfos;
    /**
     * サブディレクトリ一覧を取得
     */
    private getSubdirectories;
    /**
     * プロジェクト概要をログ出力
     */
    private logProjectSummary;
    /**
     * ファイルタイプのアイコンを取得
     */
    private getFileTypeIcon;
    /**
     * プロジェクトの健全性をチェック
     */
    checkProjectHealth(structure: ProjectStructure): Promise<string[]>;
}
//# sourceMappingURL=project-scanner.d.ts.map