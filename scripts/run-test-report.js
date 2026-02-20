// @ts-check
// Jest を実行して JSON 出力を取得し、Excel レポートを生成するランナー
const { spawnSync } = require('child_process');
const path = require('path');

console.log('▶ Jest を実行中...\n');

// テストが失敗しても Excel 生成は行うため shell: true で続行する
const result = spawnSync(
  'npx',
  ['jest', '--json', '--outputFile=jest-output.json'],
  { stdio: 'inherit', cwd: path.resolve(__dirname, '..'), shell: true }
);

console.log('\n▶ Excel レポートを生成中...');
require('./jest-to-excel.js');

// Jest の終了コードをそのまま引き継ぐ（CI で失敗を検知できるように）
process.exitCode = result.status ?? 1;
