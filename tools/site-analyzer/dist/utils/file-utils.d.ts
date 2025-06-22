import { FileInfo, FileType } from '../types/analysis-types';
/**
 * ファイルタイプを拡張子から判定
 */
export declare function getFileType(filePath: string): FileType;
/**
 * ファイル情報を取得
 */
export declare function getFileInfo(filePath: string, rootPath: string): Promise<FileInfo>;
/**
 * プロジェクト内のファイルをスキャン
 */
export declare function scanProjectFiles(rootPath: string, includePatterns?: string[], excludePatterns?: string[]): Promise<FileInfo[]>;
/**
 * ディレクトリ構造を取得
 */
export declare function getDirectoryStructure(rootPath: string): Promise<{
    directories: string[];
    fileCount: Record<string, number>;
}>;
/**
 * ファイルの内容を読み取り、行数を取得
 */
export declare function getFileLines(filePath: string): Promise<number>;
/**
 * ファイルパスを正規化
 */
export declare function normalizePath(filePath: string): string;
/**
 * 相対パスを解決
 */
export declare function resolveImportPath(currentFile: string, importPath: string): string;
//# sourceMappingURL=file-utils.d.ts.map