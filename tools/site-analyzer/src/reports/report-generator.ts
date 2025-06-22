import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { AnalysisResult, AnalysisIssue, IssueSeverity } from '../types/analysis-types';

export class ReportGenerator {
  
  /**
   * コンソール形式のレポートを生成
   */
  async generateConsoleReport(result: AnalysisResult): Promise<void> {
    console.log('\n' + chalk.bold.blue('📊 サイト構造解析レポート'));
    console.log('='.repeat(50));

    // プロジェクト概要
    this.printProjectOverview(result);
    
    // ファイル統計
    this.printFileStatistics(result);
    
    // 依存関係統計
    this.printDependencyStatistics(result);
    
    // コンポーネント統計
    this.printComponentStatistics(result);
    
    // メトリクス
    this.printMetrics(result);
    
    // 問題・警告
    this.printIssues(result);
    
    // 推奨事項
    this.printRecommendations(result);
  }

  /**
   * JSON形式のレポートを生成
   */
  async generateJsonReport(result: AnalysisResult, outputPath: string): Promise<void> {
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      },
      summary: this.generateSummary(result),
      ...result
    };

    await fs.promises.writeFile(outputPath, JSON.stringify(reportData, null, 2));
  }

  /**
   * HTML形式のレポートを生成
   */
  async generateHtmlReport(result: AnalysisResult, outputPath: string): Promise<void> {
    const html = this.generateHtmlContent(result);
    await fs.promises.writeFile(outputPath, html);
  }

  /**
   * プロジェクト概要を出力
   */
  private printProjectOverview(result: AnalysisResult): void {
    console.log(chalk.bold('\n📂 プロジェクト概要'));
    console.log(`  📁 ルートパス: ${result.projectStructure.rootPath}`);
    console.log(`  📄 総ファイル数: ${result.projectStructure.totalFiles.toLocaleString()}`);
    console.log(`  📝 総行数: ${result.projectStructure.totalLines.toLocaleString()}`);
    console.log(`  📂 ディレクトリ数: ${result.projectStructure.directories.length}`);
  }

  /**
   * ファイル統計を出力
   */
  private printFileStatistics(result: AnalysisResult): void {
    console.log(chalk.bold('\n📊 ファイルタイプ別統計'));
    
    const filesByType = result.projectStructure.filesByType;
    const sortedTypes = Object.entries(filesByType)
      .filter(([_, files]) => files.length > 0)
      .sort(([, a], [, b]) => b.length - a.length);

    for (const [type, files] of sortedTypes) {
      const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
      const icon = this.getFileTypeIcon(type);
      console.log(`  ${icon} ${type}: ${files.length}ファイル (${totalLines.toLocaleString()}行)`);
    }
  }

  /**
   * 依存関係統計を出力
   */
  private printDependencyStatistics(result: AnalysisResult): void {
    console.log(chalk.bold('\n🔗 依存関係統計'));
    
    const deps = result.dependencies;
    const internal = deps.filter(d => d.type === 'internal').length;
    const external = deps.filter(d => d.type === 'external').length;
    const relative = deps.filter(d => d.type === 'relative').length;

    console.log(`  📦 総依存関係数: ${deps.length}`);
    console.log(`  🏠 内部依存: ${internal}`);
    console.log(`  🌐 外部依存: ${external}`);
    console.log(`  📁 相対依存: ${relative}`);

    // 最も依存されているファイル
    const dependencyCount = new Map<string, number>();
    deps.forEach(dep => {
      dependencyCount.set(dep.to, (dependencyCount.get(dep.to) || 0) + 1);
    });

    const topDependencies = Array.from(dependencyCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (topDependencies.length > 0) {
      console.log(chalk.bold('\n  📈 最も依存されているファイル:'));
      topDependencies.forEach(([file, count]) => {
        const fileName = path.basename(file);
        console.log(`    ${count}回: ${fileName}`);
      });
    }
  }

  /**
   * コンポーネント統計を出力
   */
  private printComponentStatistics(result: AnalysisResult): void {
    console.log(chalk.bold('\n⚛️  React コンポーネント統計'));
    
    const components = result.components;
    const defaultExports = components.filter(c => c.exportType === 'default').length;
    const namedExports = components.filter(c => c.exportType === 'named').length;

    console.log(`  📦 総コンポーネント数: ${components.length}`);
    console.log(`  🎯 デフォルトエクスポート: ${defaultExports}`);
    console.log(`  📝 名前付きエクスポート: ${namedExports}`);

    if (components.length > 0) {
      const topComponents = components
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5);

      if (topComponents.some(c => c.usageCount > 0)) {
        console.log(chalk.bold('\n  🔥 最も使用されているコンポーネント:'));
        topComponents
          .filter(c => c.usageCount > 0)
          .forEach(comp => {
            console.log(`    ${comp.usageCount}回: ${comp.name}`);
          });
      }
    }
  }

  /**
   * メトリクスを出力
   */
  private printMetrics(result: AnalysisResult): void {
    console.log(chalk.bold('\n📏 プロジェクトメトリクス'));
    
    const metrics = result.metrics;
    
    // 複雑性メトリクス
    console.log(chalk.bold('\n  🔧 複雑性:'));
    console.log(`    平均ファイルサイズ: ${metrics.complexity.averageFileSize}行`);
    console.log(`    依存関係の深さ: ${metrics.complexity.dependencyDepth}`);
    
    if (metrics.complexity.largestFiles.length > 0) {
      console.log(`    最大ファイル: ${metrics.complexity.largestFiles[0].name} (${metrics.complexity.largestFiles[0].lines}行)`);
    }

    // 保守性メトリクス
    console.log(chalk.bold('\n  🛠️  保守性:'));
    console.log(`    コンポーネント再利用性: ${metrics.maintainability.componentReusability}%`);
    console.log(`    結合度: ${metrics.maintainability.coupling.toFixed(2)}`);

    // テストカバレッジ
    console.log(chalk.bold('\n  🧪 テストカバレッジ:'));
    console.log(`    テストファイル数: ${metrics.testCoverage.totalTestFiles}`);
    console.log(`    テスト済みコンポーネント: ${metrics.testCoverage.testedComponents}`);
    console.log(`    推定カバレッジ: ${metrics.testCoverage.coveragePercentage}%`);
  }

  /**
   * 問題・警告を出力
   */
  private printIssues(result: AnalysisResult): void {
    const issues = result.issues;
    if (issues.length === 0) {
      console.log(chalk.green('\n✅ 問題は検出されませんでした！'));
      return;
    }

    console.log(chalk.bold('\n⚠️  検出された問題'));
    
    const errors = issues.filter(i => i.severity === IssueSeverity.ERROR);
    const warnings = issues.filter(i => i.severity === IssueSeverity.WARNING);
    const infos = issues.filter(i => i.severity === IssueSeverity.INFO);

    if (errors.length > 0) {
      console.log(chalk.red(`\n  🚨 エラー (${errors.length}件):`));
      errors.slice(0, 10).forEach(issue => {
        console.log(chalk.red(`    • ${issue.message}`));
        if (issue.suggestion) {
          console.log(chalk.gray(`      💡 ${issue.suggestion}`));
        }
      });
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow(`\n  ⚠️  警告 (${warnings.length}件):`));
      warnings.slice(0, 10).forEach(issue => {
        console.log(chalk.yellow(`    • ${issue.message}`));
        if (issue.suggestion) {
          console.log(chalk.gray(`      💡 ${issue.suggestion}`));
        }
      });
    }

    if (infos.length > 0) {
      console.log(chalk.blue(`\n  ℹ️  情報 (${infos.length}件):`));
      infos.slice(0, 5).forEach(issue => {
        console.log(chalk.blue(`    • ${issue.message}`));
      });
    }
  }

  /**
   * 推奨事項を出力
   */
  private printRecommendations(result: AnalysisResult): void {
    console.log(chalk.bold('\n💡 推奨事項'));
    
    const recommendations = this.generateRecommendations(result);
    
    if (recommendations.length === 0) {
      console.log(chalk.green('  現在のところ、特別な推奨事項はありません。'));
      return;
    }

    recommendations.forEach((rec, index) => {
      console.log(chalk.blue(`  ${index + 1}. ${rec}`));
    });
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(result: AnalysisResult): string[] {
    const recommendations: string[] = [];
    
    // テストカバレッジ
    if (result.metrics.testCoverage.coveragePercentage < 80) {
      recommendations.push('テストカバレッジを80%以上に向上させることをお勧めします');
    }
    
    // 大きなファイル
    if (result.metrics.complexity.largestFiles.length > 0) {
      const largeFile = result.metrics.complexity.largestFiles[0];
      if (largeFile.lines > 300) {
        recommendations.push(`${largeFile.name} (${largeFile.lines}行) の分割を検討してください`);
      }
    }
    
    // 循環依存
    const circularDeps = result.issues.filter(i => i.type === 'circular-dependency');
    if (circularDeps.length > 0) {
      recommendations.push('循環依存を解消してコードの保守性を向上させてください');
    }
    
    // 平均ファイルサイズ
    if (result.metrics.complexity.averageFileSize > 150) {
      recommendations.push('ファイルの平均サイズが大きいため、適切に分割することを検討してください');
    }
    
    // 依存関係の深さ
    if (result.metrics.complexity.dependencyDepth > 10) {
      recommendations.push('依存関係が深すぎます。アーキテクチャの見直しを検討してください');
    }

    return recommendations;
  }

  /**
   * サマリーを生成
   */
  private generateSummary(result: AnalysisResult): any {
    return {
      totalFiles: result.projectStructure.totalFiles,
      totalLines: result.projectStructure.totalLines,
      totalDependencies: result.dependencies.length,
      totalComponents: result.components.length,
      issueCount: {
        errors: result.issues.filter(i => i.severity === IssueSeverity.ERROR).length,
        warnings: result.issues.filter(i => i.severity === IssueSeverity.WARNING).length,
        infos: result.issues.filter(i => i.severity === IssueSeverity.INFO).length
      },
      healthScore: this.calculateHealthScore(result)
    };
  }

  /**
   * 健全性スコアを計算
   */
  private calculateHealthScore(result: AnalysisResult): number {
    let score = 100;
    
    const errors = result.issues.filter(i => i.severity === IssueSeverity.ERROR).length;
    const warnings = result.issues.filter(i => i.severity === IssueSeverity.WARNING).length;
    
    score -= errors * 10;
    score -= warnings * 3;
    
    const testCoverage = result.metrics.testCoverage.coveragePercentage;
    if (testCoverage < 50) {
      score -= 15;
    } else if (testCoverage < 80) {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * HTML レポートのコンテンツを生成
   */
  private generateHtmlContent(result: AnalysisResult): string {
    const summary = this.generateSummary(result);
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>サイト構造解析レポート</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .issues { margin: 20px 0; }
        .issue { margin: 10px 0; padding: 10px; border-left: 4px solid #fbbf24; background: #fefce8; }
        .issue.error { border-left-color: #ef4444; background: #fef2f2; }
        .issue.warning { border-left-color: #f59e0b; background: #fefce8; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .health-score { text-align: center; margin: 20px 0; }
        .score { font-size: 3em; font-weight: bold; color: ${summary.healthScore >= 80 ? '#10b981' : summary.healthScore >= 60 ? '#f59e0b' : '#ef4444'}; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 サイト構造解析レポート</h1>
        
        <div class="health-score">
            <div class="score">${summary.healthScore}</div>
            <div>総合ヘルススコア</div>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${summary.totalFiles.toLocaleString()}</div>
                <div class="metric-label">総ファイル数</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.totalLines.toLocaleString()}</div>
                <div class="metric-label">総行数</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.totalComponents}</div>
                <div class="metric-label">コンポーネント数</div>
            </div>
            <div class="metric">
                <div class="metric-value">${result.metrics.testCoverage.coveragePercentage}%</div>
                <div class="metric-label">テストカバレッジ</div>
            </div>
        </div>

        <h2>🔗 依存関係統計</h2>
        <table>
            <tr><th>タイプ</th><th>件数</th></tr>
            <tr><td>内部依存</td><td>${result.dependencies.filter(d => d.type === 'internal').length}</td></tr>
            <tr><td>外部依存</td><td>${result.dependencies.filter(d => d.type === 'external').length}</td></tr>
            <tr><td>相対依存</td><td>${result.dependencies.filter(d => d.type === 'relative').length}</td></tr>
        </table>

        <h2>⚠️ 検出された問題</h2>
        <div class="issues">
            ${result.issues.map(issue => `
                <div class="issue ${issue.severity}">
                    <strong>${issue.message}</strong>
                    ${issue.suggestion ? `<br><small>💡 ${issue.suggestion}</small>` : ''}
                </div>
            `).join('')}
        </div>

        <h2>💡 推奨事項</h2>
        <ul>
            ${this.generateRecommendations(result).map(rec => `<li>${rec}</li>`).join('')}
        </ul>

        <footer style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 0.9em;">
            生成日時: ${new Date().toLocaleString('ja-JP')}
        </footer>
    </div>
</body>
</html>`;
  }

  /**
   * ファイルタイプのアイコンを取得
   */
  private getFileTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'typescript': '🔷',
      'javascript': '🟨',
      'react-component': '⚛️',
      'next-page': '📄',
      'next-layout': '🎨',
      'config': '⚙️',
      'test': '🧪',
      'style': '💄',
      'markdown': '📝',
      'json': '📋',
      'other': '📄'
    };
    return icons[type] || '📄';
  }
}