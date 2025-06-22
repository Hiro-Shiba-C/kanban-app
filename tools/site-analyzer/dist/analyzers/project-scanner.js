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
exports.ProjectScanner = void 0;
const path = __importStar(require("path"));
const analysis_types_1 = require("../types/analysis-types");
const file_utils_1 = require("../utils/file-utils");
class ProjectScanner {
    constructor(config) {
        this.config = config;
    }
    /**
     * プロジェクト全体をスキャンして構造を解析
     */
    async scanProject() {
        console.log(`🔍 プロジェクトをスキャン中: ${this.config.projectRoot}`);
        // ファイル一覧を取得
        const files = await (0, file_utils_1.scanProjectFiles)(this.config.projectRoot, this.config.includePatterns, this.config.excludePatterns);
        // ディレクトリ構造を取得
        const { directories, fileCount } = await (0, file_utils_1.getDirectoryStructure)(this.config.projectRoot);
        // ファイルタイプ別に分類
        const filesByType = this.groupFilesByType(files);
        // ディレクトリ情報を構築
        const directoryInfos = this.buildDirectoryInfos(directories, fileCount);
        // 統計を計算
        const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
        const projectStructure = {
            rootPath: (0, file_utils_1.normalizePath)(this.config.projectRoot),
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
    groupFilesByType(files) {
        const grouped = {
            [analysis_types_1.FileType.TYPESCRIPT]: [],
            [analysis_types_1.FileType.JAVASCRIPT]: [],
            [analysis_types_1.FileType.REACT_COMPONENT]: [],
            [analysis_types_1.FileType.NEXT_PAGE]: [],
            [analysis_types_1.FileType.NEXT_LAYOUT]: [],
            [analysis_types_1.FileType.CONFIG]: [],
            [analysis_types_1.FileType.TEST]: [],
            [analysis_types_1.FileType.STYLE]: [],
            [analysis_types_1.FileType.MARKDOWN]: [],
            [analysis_types_1.FileType.JSON]: [],
            [analysis_types_1.FileType.OTHER]: []
        };
        for (const file of files) {
            grouped[file.type].push(file);
        }
        return grouped;
    }
    /**
     * ディレクトリ情報を構築
     */
    buildDirectoryInfos(directories, fileCount) {
        return directories.map(dir => {
            const fullPath = path.join(this.config.projectRoot, dir);
            return {
                path: (0, file_utils_1.normalizePath)(fullPath),
                name: path.basename(dir) || path.basename(this.config.projectRoot),
                fileCount: fileCount[dir] || 0,
                subdirectories: this.getSubdirectories(dir, directories)
            };
        });
    }
    /**
     * サブディレクトリ一覧を取得
     */
    getSubdirectories(parentDir, allDirectories) {
        return allDirectories.filter(dir => {
            const parentPath = parentDir + '/';
            return dir.startsWith(parentPath) &&
                dir.slice(parentPath.length).indexOf('/') === -1;
        });
    }
    /**
     * プロジェクト概要をログ出力
     */
    logProjectSummary(structure) {
        console.log('\n📊 プロジェクト概要:');
        console.log(`  📁 総ディレクトリ数: ${structure.directories.length}`);
        console.log(`  📄 総ファイル数: ${structure.totalFiles}`);
        console.log(`  📝 総行数: ${structure.totalLines.toLocaleString()}`);
        console.log('\n📂 ファイルタイプ別統計:');
        for (const [type, files] of Object.entries(structure.filesByType)) {
            if (files.length > 0) {
                const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
                console.log(`  ${this.getFileTypeIcon(type)} ${type}: ${files.length}ファイル (${totalLines}行)`);
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
    getFileTypeIcon(type) {
        const icons = {
            [analysis_types_1.FileType.TYPESCRIPT]: '🔷',
            [analysis_types_1.FileType.JAVASCRIPT]: '🟨',
            [analysis_types_1.FileType.REACT_COMPONENT]: '⚛️',
            [analysis_types_1.FileType.NEXT_PAGE]: '📄',
            [analysis_types_1.FileType.NEXT_LAYOUT]: '🎨',
            [analysis_types_1.FileType.CONFIG]: '⚙️',
            [analysis_types_1.FileType.TEST]: '🧪',
            [analysis_types_1.FileType.STYLE]: '💄',
            [analysis_types_1.FileType.MARKDOWN]: '📝',
            [analysis_types_1.FileType.JSON]: '📋',
            [analysis_types_1.FileType.OTHER]: '📄'
        };
        return icons[type] || '📄';
    }
    /**
     * プロジェクトの健全性をチェック
     */
    async checkProjectHealth(structure) {
        const issues = [];
        // 基本的なファイルの存在チェック
        const hasPackageJson = structure.filesByType[analysis_types_1.FileType.CONFIG]
            .some(file => file.name === 'package.json');
        if (!hasPackageJson) {
            issues.push('package.json が見つかりません');
        }
        const hasTsConfig = structure.filesByType[analysis_types_1.FileType.CONFIG]
            .some(file => file.name === 'tsconfig.json');
        if (!hasTsConfig) {
            issues.push('tsconfig.json が見つかりません（TypeScript プロジェクトの場合）');
        }
        // ファイル数のバランスチェック
        const totalFiles = structure.totalFiles;
        const testFiles = structure.filesByType[analysis_types_1.FileType.TEST].length;
        const componentFiles = structure.filesByType[analysis_types_1.FileType.REACT_COMPONENT].length;
        if (testFiles === 0) {
            issues.push('テストファイルが見つかりません');
        }
        else if (componentFiles > 0 && testFiles / componentFiles < 0.3) {
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
exports.ProjectScanner = ProjectScanner;
//# sourceMappingURL=project-scanner.js.map