// @ts-check
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const JSON_PATH   = path.resolve(__dirname, '../jest-output.json');
const OUTPUT_PATH = path.resolve(__dirname, '../jest-results.xlsx');

const COLOR = {
  headerDark: '1F4E79',
  headerBlue: '2E75B6',
  pass:       'E2EFDA',
  passText:   '375623',
  fail:       'FCE4D6',
  failText:   '9C0006',
  skip:       'FFF2CC',
  border:     'BFBFBF',
  white:      'FFFFFF',
  lightGray:  'F2F2F2',
};

function solidFill(hex) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
}
function thinBorder() {
  const s = { style: 'thin', color: { argb: 'FF' + COLOR.border } };
  return { top: s, left: s, bottom: s, right: s };
}
function centerAlign() { return { vertical: 'middle', horizontal: 'center', wrapText: false }; }
function leftAlign()   { return { vertical: 'middle', horizontal: 'left',   wrapText: true  }; }

function applyHeaderRow(row, colorHex) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill      = solidFill(colorHex);
    cell.border    = thinBorder();
    cell.alignment = centerAlign();
  });
}

function suiteName(fullPath) { return path.basename(fullPath); }
function formatMs(ms) {
  if (ms == null) return '-';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// =========================================================
// シート①: サマリー
// =========================================================
function createSummarySheet(wb, data) {
  const ws = wb.addWorksheet('サマリー');

  ws.mergeCells('A1:F1');
  const titleCell = ws.getCell('A1');
  titleCell.value     = 'Jest テスト実行結果 — サマリー';
  titleCell.font      = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleCell.fill      = solidFill(COLOR.headerDark);
  titleCell.alignment = centerAlign();
  ws.getRow(1).height = 36;

  const runDate = new Date(data.startTime);
  const totalMs = data.testResults.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);

  const infoRows = [
    ['実行日時', runDate.toLocaleString('ja-JP')],
    ['実行時間', formatMs(totalMs)],
    ['総テスト数', data.numTotalTests],
    ['成功',       data.numPassedTests],
    ['失敗',       data.numFailedTests],
    ['スキップ',   data.numPendingTests],
    ['結果',       data.success ? '✅ PASSED' : '❌ FAILED'],
  ];

  infoRows.forEach(([label, value]) => {
    const row = ws.addRow([label, value]);
    row.height = 22;
    row.getCell(1).font      = { bold: true, size: 10 };
    row.getCell(1).fill      = solidFill(COLOR.lightGray);
    row.getCell(1).border    = thinBorder();
    row.getCell(1).alignment = leftAlign();
    row.getCell(2).font      = { size: 10 };
    row.getCell(2).border    = thinBorder();
    row.getCell(2).alignment = leftAlign();

    if (label === '結果') {
      row.getCell(2).font = { bold: true, size: 10, color: { argb: data.success ? 'FF' + COLOR.passText : 'FF' + COLOR.failText } };
      row.getCell(2).fill = solidFill(data.success ? COLOR.pass : COLOR.fail);
    }
    if (label === '成功') {
      row.getCell(2).font = { bold: true, size: 10, color: { argb: 'FF' + COLOR.passText } };
      row.getCell(2).fill = solidFill(COLOR.pass);
    }
    if (label === '失敗' && data.numFailedTests > 0) {
      row.getCell(2).font = { bold: true, size: 10, color: { argb: 'FF' + COLOR.failText } };
      row.getCell(2).fill = solidFill(COLOR.fail);
    }
  });

  ws.addRow([]);

  // スイート別
  ws.mergeCells(`A${ws.rowCount + 1}:F${ws.rowCount + 1}`);
  const suiteTitle = ws.getCell(`A${ws.rowCount}`);
  suiteTitle.value     = 'テストスイート別';
  suiteTitle.font      = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  suiteTitle.fill      = solidFill(COLOR.headerBlue);
  suiteTitle.alignment = centerAlign();
  ws.getRow(ws.rowCount).height = 24;

  const suiteHeaderRow = ws.addRow(['ファイル', '結果', '成功', '失敗', 'スキップ', '実行時間']);
  applyHeaderRow(suiteHeaderRow, COLOR.headerBlue);

  data.testResults.forEach((suite) => {
    const passed  = suite.assertionResults.filter((t) => t.status === 'passed').length;
    const failed  = suite.assertionResults.filter((t) => t.status === 'failed').length;
    const skipped = suite.assertionResults.filter((t) => t.status === 'pending').length;
    const ok = suite.status === 'passed';

    const row = ws.addRow([
      suiteName(suite.name),
      ok ? 'PASS' : 'FAIL',
      passed, failed, skipped,
      formatMs(suite.endTime - suite.startTime),
    ]);
    row.height = 22;
    row.eachCell((cell) => { cell.border = thinBorder(); cell.alignment = leftAlign(); cell.font = { size: 10 }; });
    row.getCell(2).alignment = centerAlign();
    row.getCell(2).font = { bold: true, size: 10, color: { argb: ok ? 'FF' + COLOR.passText : 'FF' + COLOR.failText } };
    row.getCell(2).fill = solidFill(ok ? COLOR.pass : COLOR.fail);
    if (failed > 0) {
      row.getCell(4).font = { bold: true, size: 10, color: { argb: 'FF' + COLOR.failText } };
      row.getCell(4).fill = solidFill(COLOR.fail);
    }
  });

  ws.getColumn(1).width = 28; ws.getColumn(2).width = 10;
  ws.getColumn(3).width = 8;  ws.getColumn(4).width = 8;
  ws.getColumn(5).width = 10; ws.getColumn(6).width = 12;
}

// =========================================================
// シート②: テスト詳細
// =========================================================
function createDetailSheet(wb, data) {
  const ws = wb.addWorksheet('テスト詳細');

  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value     = 'Jest テスト実行結果 — 詳細';
  titleCell.font      = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleCell.fill      = solidFill(COLOR.headerDark);
  titleCell.alignment = centerAlign();
  ws.getRow(1).height = 36;

  const headers = ['スイート', 'describe', 'テストケース', '結果', '実行時間', 'アサート数', 'エラーメッセージ'];
  const widths  = [24, 24, 52, 10, 12, 12, 50];
  const headerRow = ws.addRow(headers);
  applyHeaderRow(headerRow, COLOR.headerBlue);
  headers.forEach((_, i) => { ws.getColumn(i + 1).width = widths[i]; });

  let prevSuite = '';

  data.testResults.forEach((suite) => {
    const name = suiteName(suite.name);
    suite.assertionResults.forEach((t) => {
      const isPassed  = t.status === 'passed';
      const isPending = t.status === 'pending';
      const describe  = t.ancestorTitles.join(' > ') || '(トップレベル)';
      const errorMsg  = t.failureMessages.join('\n').slice(0, 300) || '';

      const row = ws.addRow([
        name !== prevSuite ? name : '',
        describe,
        t.title,
        isPassed ? 'PASS' : isPending ? 'SKIP' : 'FAIL',
        formatMs(t.duration),
        t.numPassingAsserts,
        errorMsg,
      ]);

      row.height = errorMsg ? 40 : 20;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = thinBorder(); cell.font = { size: 10 }; cell.alignment = leftAlign();
      });

      const resultCell = row.getCell(4);
      resultCell.alignment = centerAlign();
      if (isPassed) {
        resultCell.font = { bold: true, size: 10, color: { argb: 'FF' + COLOR.passText } };
        resultCell.fill = solidFill(COLOR.pass);
      } else if (isPending) {
        resultCell.font = { bold: true, size: 10, color: { argb: 'FF856404' } };
        resultCell.fill = solidFill(COLOR.skip);
      } else {
        resultCell.font = { bold: true, size: 10, color: { argb: 'FF' + COLOR.failText } };
        resultCell.fill = solidFill(COLOR.fail);
        row.getCell(7).font = { name: 'Courier New', size: 9, color: { argb: 'FF' + COLOR.failText } };
      }

      if (name !== prevSuite) {
        row.getCell(1).font = { bold: true, size: 10 };
        row.getCell(1).fill = solidFill(COLOR.lightGray);
        prevSuite = name;
      }
    });
  });

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];
}

// =========================================================
// メイン
// =========================================================
async function main() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error('❌ jest-output.json が見つかりません。先に npm test を実行してください。');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SIer Slack Bot';
  wb.created = wb.modified = new Date();

  createSummarySheet(wb, data);
  createDetailSheet(wb, data);

  await wb.xlsx.writeFile(OUTPUT_PATH);

  const status = data.success ? '✅ PASSED' : '❌ FAILED';
  console.log(`${status} — ${data.numPassedTests}/${data.numTotalTests} テスト成功`);
  console.log('📊 Excel を出力しました:', OUTPUT_PATH);
}

main().catch((err) => { console.error('❌ 変換失敗:', err); process.exit(1); });
