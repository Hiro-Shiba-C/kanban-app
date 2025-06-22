#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { SiteAnalyzer } from './analyzer';
import { AnalyzerConfig, ReportOptions } from './types/analysis-types';
import { ReportGenerator } from './reports/report-generator';

const program = new Command();

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
    } catch (error) {
      console.error(chalk.red('❌ エラーが発生しました:'), error);
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
    } catch (error) {
      console.error(chalk.red('❌ レポート生成エラー:'), error);
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
    } catch (error) {
      console.error(chalk.red('❌ ヘルスチェックエラー:'), error);
      process.exit(1);
    }
  });

async function runAnalysis(options: any) {
  const projectPath = path.resolve(options.project);
  
  if (!fs.existsSync(projectPath)) {
    throw new Error(`プロジェクトパスが見つかりません: ${projectPath}`);
  }

  console.log(chalk.blue('🔍 サイト構造解析を開始します...'));
  console.log(chalk.gray(`📂 プロジェクト: ${projectPath}`));

  const config: AnalyzerConfig = {
    projectRoot: projectPath,
    includePatterns: options.include.split(','),
    excludePatterns: options.exclude.split(','),
    outputFormat: options.format,
    outputPath: options.output,
    generateGraph: options.graph !== false,
    verbose: options.verbose || false
  };

  const analyzer = new SiteAnalyzer(config);
  const result = await analyzer.analyze();

  // 結果を出力
  const reportGenerator = new ReportGenerator();
  
  if (config.outputFormat === 'console') {
    await reportGenerator.generateConsoleReport(result);
  } else {
    const outputPath = config.outputPath || `./analysis-result.${config.outputFormat}`;
    
    if (config.outputFormat === 'json') {
      await reportGenerator.generateJsonReport(result, outputPath);
    } else if (config.outputFormat === 'html') {
      await reportGenerator.generateHtmlReport(result, outputPath);
    }
    
    console.log(chalk.green(`✅ レポートを生成しました: ${outputPath}`));
  }
}

async function generateReport(options: any) {
  const inputPath = path.resolve(options.input);
  
  if (!fs.existsSync(inputPath)) {
    throw new Error(`入力ファイルが見つかりません: ${inputPath}`);
  }

  const resultData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const reportGenerator = new ReportGenerator();
  
  if (options.format === 'console') {
    await reportGenerator.generateConsoleReport(resultData);
  } else {
    const outputPath = options.output || `./report.${options.format}`;
    
    if (options.format === 'json') {
      await reportGenerator.generateJsonReport(resultData, outputPath);
    } else if (options.format === 'html') {
      await reportGenerator.generateHtmlReport(resultData, outputPath);
    }
    
    console.log(chalk.green(`✅ レポートを生成しました: ${outputPath}`));
  }
}

async function runHealthCheck(options: any) {
  const projectPath = path.resolve(options.project);
  
  if (!fs.existsSync(projectPath)) {
    throw new Error(`プロジェクトパスが見つかりません: ${projectPath}`);
  }

  console.log(chalk.blue('🏥 プロジェクトヘルスチェックを実行中...'));
  
  const config: AnalyzerConfig = {
    projectRoot: projectPath,
    includePatterns: ['**/*.{ts,tsx,js,jsx}'],
    excludePatterns: ['node_modules/**', 'dist/**', '.next/**', 'coverage/**'],
    outputFormat: 'console',
    generateGraph: false,
    verbose: false
  };

  const analyzer = new SiteAnalyzer(config);
  const result = await analyzer.analyze();

  // 健全性スコアを計算
  const healthScore = calculateHealthScore(result);
  
  console.log('\n' + chalk.bold('📊 ヘルスチェック結果:'));
  console.log(`${getScoreColor(healthScore)} 総合スコア: ${healthScore}/100`);
  
  // 主要な問題を表示
  const criticalIssues = result.issues.filter(issue => issue.severity === 'error');
  const warnings = result.issues.filter(issue => issue.severity === 'warning');
  
  if (criticalIssues.length > 0) {
    console.log(chalk.red(`\n🚨 重要な問題: ${criticalIssues.length}件`));
    criticalIssues.slice(0, 5).forEach(issue => {
      console.log(chalk.red(`  • ${issue.message}`));
    });
  }
  
  if (warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠️  警告: ${warnings.length}件`));
    warnings.slice(0, 3).forEach(issue => {
      console.log(chalk.yellow(`  • ${issue.message}`));
    });
  }
  
  // 推奨事項を表示
  console.log(chalk.blue('\n💡 推奨事項:'));
  const recommendations = generateRecommendations(result);
  recommendations.forEach(rec => {
    console.log(chalk.blue(`  • ${rec}`));
  });
}

function calculateHealthScore(result: any): number {
  let score = 100;
  
  // エラーは-10点、警告は-3点
  const errors = result.issues.filter((i: any) => i.severity === 'error').length;
  const warnings = result.issues.filter((i: any) => i.severity === 'warning').length;
  
  score -= errors * 10;
  score -= warnings * 3;
  
  // テストカバレッジに基づく調整
  const testCoverage = result.metrics.testCoverage.coveragePercentage;
  if (testCoverage < 50) {
    score -= 15;
  } else if (testCoverage < 80) {
    score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

function getScoreColor(score: number): string {
  if (score >= 80) return chalk.green('🟢');
  if (score >= 60) return chalk.yellow('🟡');
  return chalk.red('🔴');
}

function generateRecommendations(result: any): string[] {
  const recommendations: string[] = [];
  
  if (result.metrics.testCoverage.coveragePercentage < 80) {
    recommendations.push('テストカバレッジを向上させる');
  }
  
  if (result.metrics.complexity.largestFiles.length > 0) {
    recommendations.push('大きなファイルを分割する');
  }
  
  const circularDeps = result.issues.filter((i: any) => i.type === 'circular-dependency');
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
  console.error(chalk.red('❌ 予期しないエラーが発生しました:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ 未処理のPromise拒否:'), reason);
  process.exit(1);
});

program.parse();