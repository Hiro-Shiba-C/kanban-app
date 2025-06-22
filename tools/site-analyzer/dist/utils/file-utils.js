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
exports.getFileType = getFileType;
exports.getFileInfo = getFileInfo;
exports.scanProjectFiles = scanProjectFiles;
exports.getDirectoryStructure = getDirectoryStructure;
exports.getFileLines = getFileLines;
exports.normalizePath = normalizePath;
exports.resolveImportPath = resolveImportPath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const analysis_types_1 = require("../types/analysis-types");
/**
 * ファイルタイプを拡張子から判定
 */
function getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    const dirname = path.dirname(filePath);
    // Next.js 特有のファイル
    if (basename === 'page.tsx' || basename === 'page.js') {
        return analysis_types_1.FileType.NEXT_PAGE;
    }
    if (basename === 'layout.tsx' || basename === 'layout.js') {
        return analysis_types_1.FileType.NEXT_LAYOUT;
    }
    // テストファイル
    if (basename.includes('.test.') || basename.includes('.spec.') || dirname.includes('__tests__')) {
        return analysis_types_1.FileType.TEST;
    }
    // 設定ファイル
    const configFiles = [
        'package.json', 'tsconfig.json', 'next.config.ts', 'next.config.js',
        'tailwind.config.js', 'eslint.config.mjs', 'jest.config.js'
    ];
    if (configFiles.includes(basename)) {
        return analysis_types_1.FileType.CONFIG;
    }
    // 拡張子による判定
    switch (ext) {
        case '.tsx':
            return analysis_types_1.FileType.REACT_COMPONENT;
        case '.ts':
            return analysis_types_1.FileType.TYPESCRIPT;
        case '.js':
        case '.jsx':
            return analysis_types_1.FileType.JAVASCRIPT;
        case '.css':
        case '.scss':
        case '.sass':
            return analysis_types_1.FileType.STYLE;
        case '.md':
        case '.mdx':
            return analysis_types_1.FileType.MARKDOWN;
        case '.json':
            return analysis_types_1.FileType.JSON;
        default:
            return analysis_types_1.FileType.OTHER;
    }
}
/**
 * ファイル情報を取得
 */
async function getFileInfo(filePath, rootPath) {
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
async function scanProjectFiles(rootPath, includePatterns = ['**/*.{ts,tsx,js,jsx}'], excludePatterns = ['node_modules/**', 'dist/**', '.next/**', 'coverage/**']) {
    const files = [];
    for (const pattern of includePatterns) {
        const matches = await (0, glob_1.glob)(pattern, {
            cwd: rootPath,
            absolute: true,
            ignore: excludePatterns
        });
        files.push(...matches);
    }
    const uniqueFiles = [...new Set(files)];
    const fileInfos = [];
    for (const filePath of uniqueFiles) {
        try {
            const fileInfo = await getFileInfo(filePath, rootPath);
            fileInfos.push(fileInfo);
        }
        catch (error) {
            console.warn(`ファイル読み込みエラー: ${filePath}`, error);
        }
    }
    return fileInfos.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
/**
 * ディレクトリ構造を取得
 */
async function getDirectoryStructure(rootPath) {
    const directories = [];
    const fileCount = {};
    async function walkDirectory(dirPath) {
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
                }
                else {
                    const dirRelativePath = path.relative(rootPath, dirPath);
                    fileCount[dirRelativePath] = (fileCount[dirRelativePath] || 0) + 1;
                }
            }
        }
        catch (error) {
            console.warn(`ディレクトリ読み込みエラー: ${dirPath}`, error);
        }
    }
    await walkDirectory(rootPath);
    return { directories, fileCount };
}
/**
 * スキップすべきディレクトリかどうかを判定
 */
function shouldSkipDirectory(name) {
    const skipDirs = [
        'node_modules', '.git', '.next', 'dist', 'build',
        'coverage', '.vercel', '.npm', '.pnpm-store'
    ];
    return skipDirs.includes(name) || name.startsWith('.');
}
/**
 * ファイルの内容を読み取り、行数を取得
 */
async function getFileLines(filePath) {
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return content.split('\n').length;
    }
    catch {
        return 0;
    }
}
/**
 * ファイルパスを正規化
 */
function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
}
/**
 * 相対パスを解決
 */
function resolveImportPath(currentFile, importPath) {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const currentDir = path.dirname(currentFile);
        return path.resolve(currentDir, importPath);
    }
    return importPath;
}
//# sourceMappingURL=file-utils.js.map