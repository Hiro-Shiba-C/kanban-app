import * as path from 'path';
import { 
  ProjectStructure, 
  DirectoryInfo, 
  FileInfo, 
  FileType,
  AnalyzerConfig 
} from '../types/analysis-types';
import { 
  scanProjectFiles, 
  getDirectoryStructure,
  normalizePath 
} from '../utils/file-utils';

export class ProjectScanner {
  private config: AnalyzerConfig;

  constructor(config: AnalyzerConfig) {
    this.config = config;
  }

  /**
   * プロジェクト全体をスキャンして構造を解析
   */
  async scanProject(): Promise<ProjectStructure> {
    console.log(`🔍 プロジェクトをスキャン中: ${this.config.projectRoot}`);

    // ファイル一覧を取得
    const files = await scanProjectFiles(
      this.config.projectRoot,
      this.config.includePatterns,
      this.config.excludePatterns
    );

    // ディレクトリ構造を取得
    const { directories, fileCount } = await getDirectoryStructure(this.config.projectRoot);

    // ファイルタイプ別に分類
    const filesByType = this.groupFilesByType(files);

    // ディレクトリ情報を構築
    const directoryInfos = this.buildDirectoryInfos(directories, fileCount);

    // 統計を計算
    const totalLines = files.reduce((sum, file) => sum + file.lines, 0);

    const projectStructure: ProjectStructure = {
      rootPath: normalizePath(this.config.projectRoot),
      totalFiles: files.length,
      totalLines,
      filesByType,
      directories: directoryInfos
    };

    if (this.config.verbose) {
      this.logProjectSummary(projectStructure);
    }

    return projectStructure;
  }

  /**
   * ファイルをタイプ別にグループ化
   */
  private groupFilesByType(files: FileInfo[]): Record<FileType, FileInfo[]> {
    const grouped: Record<FileType, FileInfo[]> = {
      [FileType.TYPESCRIPT]: [],
      [FileType.JAVASCRIPT]: [],
      [FileType.REACT_COMPONENT]: [],
      [FileType.NEXT_PAGE]: [],
      [FileType.NEXT_LAYOUT]: [],
      [FileType.CONFIG]: [],
      [FileType.TEST]: [],
      [FileType.STYLE]: [],
      [FileType.MARKDOWN]: [],
      [FileType.JSON]: [],
      [FileType.OTHER]: []
    };

    for (const file of files) {
      grouped[file.type].push(file);
    }

    return grouped;
  }

  /**
   * ディレクトリ情報を構築
   */
  private buildDirectoryInfos(directories: string[], fileCount: Record<string, number>): DirectoryInfo[] {
    return directories.map(dir => {
      const fullPath = path.join(this.config.projectRoot, dir);
      return {
        path: normalizePath(fullPath),
        name: path.basename(dir) || path.basename(this.config.projectRoot),
        fileCount: fileCount[dir] || 0,
        subdirectories: this.getSubdirectories(dir, directories)
      };
    });
  }

  /**
   * サブディレクトリ一覧を取得
   */
  private getSubdirectories(parentDir: string, allDirectories: string[]): string[] {
    return allDirectories.filter(dir => {
      const parentPath = parentDir + '/';
      return dir.startsWith(parentPath) && 
             dir.slice(parentPath.length).indexOf('/') === -1;
    });
  }

  /**
   * プロジェクト概要をログ出力
   */
  private logProjectSummary(structure: ProjectStructure): void {
    console.log('\n📊 プロジェクト概要:');
    console.log(`  📁 総ディレクトリ数: ${structure.directories.length}`);
    console.log(`  📄 総ファイル数: ${structure.totalFiles}`);
    console.log(`  📝 総行数: ${structure.totalLines.toLocaleString()}`);
    
    console.log('\n📂 ファイルタイプ別統計:');
    for (const [type, files] of Object.entries(structure.filesByType)) {
      if (files.length > 0) {
        const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
        console.log(`  ${this.getFileTypeIcon(type as FileType)} ${type}: ${files.length}ファイル (${totalLines}行)`);
      }
    }

    console.log('\n📁 主要ディレクトリ:');
    const mainDirectories = structure.directories
      .filter(dir => !dir.name.startsWith('.') && dir.fileCount > 0)
      .sort((a, b) => b.fileCount - a.fileCount)
      .slice(0, 10);
    
    for (const dir of mainDirectories) {
      console.log(`  📂 ${dir.name}: ${dir.fileCount}ファイル`);
    }
  }

  /**
   * ファイルタイプのアイコンを取得
   */
  private getFileTypeIcon(type: FileType): string {
    const icons: Record<FileType, string> = {
      [FileType.TYPESCRIPT]: '🔷',
      [FileType.JAVASCRIPT]: '🟨',
      [FileType.REACT_COMPONENT]: '⚛️',
      [FileType.NEXT_PAGE]: '📄',
      [FileType.NEXT_LAYOUT]: '🎨',
      [FileType.CONFIG]: '⚙️',
      [FileType.TEST]: '🧪',
      [FileType.STYLE]: '💄',
      [FileType.MARKDOWN]: '📝',
      [FileType.JSON]: '📋',
      [FileType.OTHER]: '📄'
    };
    return icons[type] || '📄';
  }

  /**
   * プロジェクトの健全性をチェック
   */
  async checkProjectHealth(structure: ProjectStructure): Promise<string[]> {
    const issues: string[] = [];

    // 基本的なファイルの存在チェック
    const hasPackageJson = structure.filesByType[FileType.CONFIG]
      .some(file => file.name === 'package.json');
    if (!hasPackageJson) {
      issues.push('package.json が見つかりません');
    }

    const hasTsConfig = structure.filesByType[FileType.CONFIG]
      .some(file => file.name === 'tsconfig.json');
    if (!hasTsConfig) {
      issues.push('tsconfig.json が見つかりません（TypeScript プロジェクトの場合）');
    }

    // ファイル数のバランスチェック
    const totalFiles = structure.totalFiles;
    const testFiles = structure.filesByType[FileType.TEST].length;
    const componentFiles = structure.filesByType[FileType.REACT_COMPONENT].length;

    if (testFiles === 0) {
      issues.push('テストファイルが見つかりません');
    } else if (componentFiles > 0 && testFiles / componentFiles < 0.3) {
      issues.push('テストファイルの数が少ない可能性があります');
    }

    // 大きすぎるファイルの検出
    const largeFiles = Object.values(structure.filesByType)
      .flat()
      .filter(file => file.lines > 300)
      .sort((a, b) => b.lines - a.lines);

    if (largeFiles.length > 0) {
      issues.push(`大きなファイルが ${largeFiles.length} 個見つかりました (300行以上)`);
    }

    return issues;
  }
}