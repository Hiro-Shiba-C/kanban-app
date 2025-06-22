#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const analyzer_1 = require("./analyzer");
const report_generator_1 = require("./reports/report-generator");
const program = new commander_1.Command();
program
    .name('site-analyzer')
    .description('サイト構造解析ツール')
    .version('1.0.0');
program
    .command('analyze')
    .description('プロジェクトを解析します')
    .option('-p, --project <path>', 'プロジェクトのルートパス', process.cwd())
    .option('-o, --output <path>', '出力ファイルパス')
    .option('-f, --format <format>', '出力フォーマット (json|html|console)', 'console')
    .option('--include <patterns>', 'インクルードパターン (カンマ区切り)', '**/*.{ts,tsx,js,jsx}')
    .option('--exclude <patterns>', 'エクスクルードパターン (カンマ区切り)', 'node_modules/**,dist/**,.next/**,coverage/**')
    .option('--no-graph', '依存関係グラフを無効にする')
    .option('-v, --verbose', '詳細な出力を表示')
    .action(async (options) => {
    try {
        await runAnalysis(options);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ エラーが発生しました:'), error);
        process.exit(1);
    }
});
program
    .command('report')
    .description('既存の解析結果からレポートを生成します')
    .option('-i, --input <path>', '解析結果のJSONファイルパス', './analysis-result.json')
    .option('-o, --output <path>', '出力ファイルパス')
    .option('-f, --format <format>', '出力フォーマット (json|html|console)', 'html')
    .action(async (options) => {
    try {
        await generateReport(options);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ レポート生成エラー:'), error);
        process.exit(1);
    }
});
program
    .command('health')
    .description('プロジェクトの健全性をクイックチェックします')
    .option('-p, --project <path>', 'プロジェクトのルートパス', process.cwd())
    .action(async (options) => {
    try {
        await runHealthCheck(options);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ ヘルスチェックエラー:'), error);
        process.exit(1);
    }
});
async function runAnalysis(options) {
    const projectPath = path.resolve(options.project);
    if (!fs.existsSync(projectPath)) {
        throw new Error(`プロジェクトパスが見つかりません: ${projectPath}`);
    }
    console.log(chalk_1.default.blue('🔍 サイト構造解析を開始します...'));
    console.log(chalk_1.default.gray(`📂 プロジェクト: ${projectPath}`));
    const config = {
        projectRoot: projectPath,
        includePatterns: options.include.split(','),
        excludePatterns: options.exclude.split(','),
        outputFormat: options.format,
        outputPath: options.output,
        generateGraph: options.graph !== false,
        verbose: options.verbose || false
    };
    const analyzer = new analyzer_1.SiteAnalyzer(config);
    const result = await analyzer.analyze();
    // 結果を出力
    const reportGenerator = new report_generator_1.ReportGenerator();
    if (config.outputFormat === 'console') {
        await reportGenerator.generateConsoleReport(result);
    }
    else {
        const outputPath = config.outputPath || `./analysis-result.${config.outputFormat}`;
        if (config.outputFormat === 'json') {
            await reportGenerator.generateJsonReport(result, outputPath);
        }
        else if (config.outputFormat === 'html') {
            await reportGenerator.generateHtmlReport(result, outputPath);
        }
        console.log(chalk_1.default.green(`✅ レポートを生成しました: ${outputPath}`));
    }
}
async function generateReport(options) {
    const inputPath = path.resolve(options.input);
    if (!fs.existsSync(inputPath)) {
        throw new Error(`入力ファイルが見つかりません: ${inputPath}`);
    }
    const resultData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const reportGenerator = new report_generator_1.ReportGenerator();
    if (options.format === 'console') {
        await reportGenerator.generateConsoleReport(resultData);
    }
    else {
        const outputPath = options.output || `./report.${options.format}`;
        if (options.format === 'json') {
            await reportGenerator.generateJsonReport(resultData, outputPath);
        }
        else if (options.format === 'html') {
            await reportGenerator.generateHtmlReport(resultData, outputPath);
        }
        console.log(chalk_1.default.green(`✅ レポートを生成しました: ${outputPath}`));
    }
}
async function runHealthCheck(options) {
    const projectPath = path.resolve(options.project);
    if (!fs.existsSync(projectPath)) {
        throw new Error(`プロジェクトパスが見つかりません: ${projectPath}`);
    }
    console.log(chalk_1.default.blue('🏥 プロジェクトヘルスチェックを実行中...'));
    const config = {
        projectRoot: projectPath,
        includePatterns: ['**/*.{ts,tsx,js,jsx}'],
        excludePatterns: ['node_modules/**', 'dist/**', '.next/**', 'coverage/**'],
        outputFormat: 'console',
        generateGraph: false,
        verbose: false
    };
    const analyzer = new analyzer_1.SiteAnalyzer(config);
    const result = await analyzer.analyze();
    // 健全性スコアを計算
    const healthScore = calculateHealthScore(result);
    console.log('\n' + chalk_1.default.bold('📊 ヘルスチェック結果:'));
    console.log(`${getScoreColor(healthScore)} 総合スコア: ${healthScore}/100`);
    // 主要な問題を表示
    const criticalIssues = result.issues.filter(issue => issue.severity === 'error');
    const warnings = result.issues.filter(issue => issue.severity === 'warning');
    if (criticalIssues.length > 0) {
        console.log(chalk_1.default.red(`\n🚨 重要な問題: ${criticalIssues.length}件`));
        criticalIssues.slice(0, 5).forEach(issue => {
            console.log(chalk_1.default.red(`  • ${issue.message}`));
        });
    }
    if (warnings.length > 0) {
        console.log(chalk_1.default.yellow(`\n⚠️  警告: ${warnings.length}件`));
        warnings.slice(0, 3).forEach(issue => {
            console.log(chalk_1.default.yellow(`  • ${issue.message}`));
        });
    }
    // 推奨事項を表示
    console.log(chalk_1.default.blue('\n💡 推奨事項:'));
    const recommendations = generateRecommendations(result);
    recommendations.forEach(rec => {
        console.log(chalk_1.default.blue(`  • ${rec}`));
    });
}
function calculateHealthScore(result) {
    let score = 100;
    // エラーは-10点、警告は-3点
    const errors = result.issues.filter((i) => i.severity === 'error').length;
    const warnings = result.issues.filter((i) => i.severity === 'warning').length;
    score -= errors * 10;
    score -= warnings * 3;
    // テストカバレッジに基づく調整
    const testCoverage = result.metrics.testCoverage.coveragePercentage;
    if (testCoverage < 50) {
        score -= 15;
    }
    else if (testCoverage < 80) {
        score -= 5;
    }
    return Math.max(0, Math.min(100, score));
}
function getScoreColor(score) {
    if (score >= 80)
        return chalk_1.default.green('🟢');
    if (score >= 60)
        return chalk_1.default.yellow('🟡');
    return chalk_1.default.red('🔴');
}
function generateRecommendations(result) {
    const recommendations = [];
    if (result.metrics.testCoverage.coveragePercentage < 80) {
        recommendations.push('テストカバレッジを向上させる');
    }
    if (result.metrics.complexity.largestFiles.length > 0) {
        recommendations.push('大きなファイルを分割する');
    }
    const circularDeps = result.issues.filter((i) => i.type === 'circular-dependency');
    if (circularDeps.length > 0) {
        recommendations.push('循環依存を解消する');
    }
    if (result.metrics.complexity.averageFileSize > 150) {
        recommendations.push('ファイルサイズを適切に管理する');
    }
    return recommendations;
}
// エラーハンドリング
process.on('uncaughtException', (error) => {
    console.error(chalk_1.default.red('❌ 予期しないエラーが発生しました:'), error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk_1.default.red('❌ 未処理のPromise拒否:'), reason);
    process.exit(1);
});
program.parse();
//# sourceMappingURL=cli.js.map