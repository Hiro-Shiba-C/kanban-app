import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FileInfo, FileType } from '../types/analysis-types';

/**
 * ファイルタイプを拡張子から判定
 */
export function getFileType(filePath: string): FileType {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);
  const dirname = path.dirname(filePath);

  // Next.js 特有のファイル
  if (basename === 'page.tsx' || basename === 'page.js') {
    return FileType.NEXT_PAGE;
  }
  if (basename === 'layout.tsx' || basename === 'layout.js') {
    return FileType.NEXT_LAYOUT;
  }

  // テストファイル
  if (basename.includes('.test.') || basename.includes('.spec.') || dirname.includes('__tests__')) {
    return FileType.TEST;
  }

  // 設定ファイル
  const configFiles = [
    'package.json', 'tsconfig.json', 'next.config.ts', 'next.config.js',
    'tailwind.config.js', 'eslint.config.mjs', 'jest.config.js'
  ];
  if (configFiles.includes(basename)) {
    return FileType.CONFIG;
  }

  // 拡張子による判定
  switch (ext) {
    case '.tsx':
      return FileType.REACT_COMPONENT;
    case '.ts':
      return FileType.TYPESCRIPT;
    case '.js':
    case '.jsx':
      return FileType.JAVASCRIPT;
    case '.css':
    case '.scss':
    case '.sass':
      return FileType.STYLE;
    case '.md':
    case '.mdx':
      return FileType.MARKDOWN;
    case '.json':
      return FileType.JSON;
    default:
      return FileType.OTHER;
  }
}

/**
 * ファイル情報を取得
 */
export async function getFileInfo(filePath: string, rootPath: string): Promise<FileInfo> {
  const stats = await fs.promises.stat(filePath);
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const lines = content.split('\n').length;

  return {
    path: filePath,
    relativePath: path.relative(rootPath, filePath),
    name: path.basename(filePath),
    extension: path.extname(filePath),
    size: stats.size,
    lines,
    type: getFileType(filePath)
  };
}

/**
 * プロジェクト内のファイルをスキャン
 */
export async function scanProjectFiles(
  rootPath: string,
  includePatterns: string[] = ['**/*.{ts,tsx,js,jsx}'],
  excludePatterns: string[] = ['node_modules/**', 'dist/**', '.next/**', 'coverage/**']
): Promise<FileInfo[]> {
  const files: string[] = [];

  for (const pattern of includePatterns) {
    const matches = await glob(pattern, {
      cwd: rootPath,
      absolute: true,
      ignore: excludePatterns
    });
    files.push(...matches);
  }

  const uniqueFiles = [...new Set(files)];
  const fileInfos: FileInfo[] = [];

  for (const filePath of uniqueFiles) {
    try {
      const fileInfo = await getFileInfo(filePath, rootPath);
      fileInfos.push(fileInfo);
    } catch (error) {
      console.warn(`ファイル読み込みエラー: ${filePath}`, error);
    }
  }

  return fileInfos.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/**
 * ディレクトリ構造を取得
 */
export async function getDirectoryStructure(rootPath: string): Promise<{
  directories: string[];
  fileCount: Record<string, number>;
}> {
  const directories: string[] = [];
  const fileCount: Record<string, number> = {};

  async function walkDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!shouldSkipDirectory(entry.name)) {
            const relativePath = path.relative(rootPath, fullPath);
            directories.push(relativePath);
            await walkDirectory(fullPath);
          }
        } else {
          const dirRelativePath = path.relative(rootPath, dirPath);
          fileCount[dirRelativePath] = (fileCount[dirRelativePath] || 0) + 1;
        }
      }
    } catch (error) {
      console.warn(`ディレクトリ読み込みエラー: ${dirPath}`, error);
    }
  }

  await walkDirectory(rootPath);
  return { directories, fileCount };
}

/**
 * スキップすべきディレクトリかどうかを判定
 */
function shouldSkipDirectory(name: string): boolean {
  const skipDirs = [
    'node_modules', '.git', '.next', 'dist', 'build', 
    'coverage', '.vercel', '.npm', '.pnpm-store'
  ];
  return skipDirs.includes(name) || name.startsWith('.');
}

/**
 * ファイルの内容を読み取り、行数を取得
 */
export async function getFileLines(filePath: string): Promise<number> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/**
 * ファイルパスを正規化
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * 相対パスを解決
 */
export function resolveImportPath(currentFile: string, importPath: string): string {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const currentDir = path.dirname(currentFile);
    return path.resolve(currentDir, importPath);
  }
  return importPath;
}