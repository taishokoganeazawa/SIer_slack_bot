// @ts-check
const ExcelJS = require('exceljs');
const path = require('path');

const OUTPUT_PATH = path.resolve(__dirname, '../test-results.xlsx');

const COLOR = {
  header:    '1F4E79',
  subHeader: '2E75B6',
  pass:      'E2EFDA',
  fail:      'FCE4D6',
  skip:      'FFF2CC',
  border:    'BFBFBF',
  white:     'FFFFFF',
  lightGray: 'F2F2F2',
};

function solidFill(hex) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
}
function thinBorder() {
  const s = { style: 'thin', color: { argb: 'FF' + COLOR.border } };
  return { top: s, left: s, bottom: s, right: s };
}
function centerAlign(wrap = false) { return { vertical: 'middle', horizontal: 'center', wrapText: wrap }; }
function leftAlign(wrap = false)   { return { vertical: 'middle', horizontal: 'left',   wrapText: wrap }; }

function applyHeaderRow(row, colorHex) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill      = solidFill(colorHex);
    cell.border    = thinBorder();
    cell.alignment = centerAlign();
  });
}

function applyDataRow(row) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font      = { size: 10 };
    cell.border    = thinBorder();
    cell.alignment = leftAlign();
  });
}

// =========================================================
// シート①：自動テスト（Jest）一覧
// =========================================================
function createAutoTestSheet(wb) {
  const ws = wb.addWorksheet('自動テスト（Jest）');

  ws.mergeCells('A1:H1');
  const title = ws.getCell('A1');
  title.value     = 'SIer Slack Bot — 自動テスト記録（Jest）';
  title.font      = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.fill      = solidFill(COLOR.header);
  title.alignment = centerAlign();
  ws.getRow(1).height = 36;

  const headers = ['ID', 'モジュール', 'テストケース', '期待結果', '結果', '実行日', 'バージョン', '備考'];
  const widths  = [8, 16, 52, 36, 10, 14, 14, 24];
  const headerRow = ws.addRow(headers);
  applyHeaderRow(headerRow, COLOR.subHeader);
  headers.forEach((_, i) => { ws.getColumn(i + 1).width = widths[i]; });

  const PASS_VALUES = ['PASS', 'FAIL', 'SKIP', '未実施'];

  const cases = [
    ['F-01', 'filter.ts', '大手SIer名（富士通）を含む記事が高スコアになる',          '富士通記事が先頭にソートされる'],
    ['F-02', 'filter.ts', '大手SIer名（NTTデータ）を含む記事が高スコアになる',       'NTTデータ記事が先頭にソートされる'],
    ['F-03', 'filter.ts', '金融キーワード（メガバンク）を含む記事が高スコアになる',   'メガバンク記事が先頭にソートされる'],
    ['F-04', 'filter.ts', 'descriptionのキーワードもスコアに加算される',              'description内キーワードが評価される'],
    ['F-05', 'filter.ts', '複数キーワードでスコアが加算される（銀行+DX > SIer単体）', '銀行DX記事がSIer単体より上位'],
    ['F-06', 'filter.ts', 'キーワードなしの記事はスコア0で末尾になる',                'キーワードなし記事が末尾に位置する'],
    ['F-07', 'filter.ts', '英語キーワード（fujitsu）も大文字小文字を問わずマッチ',   '英語記事が正しくスコアリングされる'],
    ['F-08', 'filter.ts', '元の配列を変更しない（イミュータブル）',                   'ソート前後で元配列が変わらない'],
    ['F-09', 'filter.ts', '空配列を渡すと空配列が返る',                               '[]が返る'],
    ['F-10', 'filter.ts', '1件のみの配列はそのまま返る',                              '要素数1の配列が返る'],
    ['U-01', 'urlStore.ts', '未投稿の記事のみ返す',                                   '未投稿記事1件のみが返る'],
    ['U-02', 'urlStore.ts', '全て投稿済みの場合は空配列を返す',                       '[]が返る'],
    ['U-03', 'urlStore.ts', 'postedUrlsが空の場合は全件返す',                         '全記事が返る'],
    ['U-04', 'urlStore.ts', 'articlesが空の場合は空配列を返す',                       '[]が返る'],
    ['U-05', 'urlStore.ts', 'フラット配列形式を読み込める',                            'URLs配列が正しく読み込まれる'],
    ['U-06', 'urlStore.ts', '{ urls: [] } 形式を読み込める',                          'URLs配列が正しく読み込まれる'],
    ['U-07', 'urlStore.ts', 'ファイルが存在しない場合は空配列を返す',                 '[]が返る'],
    ['U-08', 'urlStore.ts', '不正なJSONの場合は空配列を返す',                         '[]が返る'],
    ['U-09', 'urlStore.ts', '空のファイルの場合は空配列を返す',                        '[]が返る'],
    ['U-10', 'urlStore.ts', 'URLを { urls: [...] } 形式で保存する',                   'JSONが正しい形式で書き込まれる'],
    ['U-11', 'urlStore.ts', '1,000件以内はそのまま保存される',                         '100件がそのまま保存される'],
    ['U-12', 'urlStore.ts', '1,001件の場合、最古の1件が削除されて1,000件になる',      '件数1000・先頭URLが1番目のものになる'],
    ['U-13', 'urlStore.ts', '空配列を保存できる',                                     '{ urls: [] } で保存される'],
    ['R-01', 'rss.ts', '正常なXMLから記事を抽出できる',                               'title/url/descriptionが正しく抽出される'],
    ['R-02', 'rss.ts', '複数のアイテムを正しく処理する',                               '3件の記事が正しい順で返る'],
    ['R-03', 'rss.ts', 'titleがない<item>はスキップされる',                           '[]が返る'],
    ['R-04', 'rss.ts', 'linkがない<item>はスキップされる',                            '[]が返る'],
    ['R-05', 'rss.ts', '空のXMLは空配列を返す',                                       '[]が返る'],
    ['R-06', 'rss.ts', '<item>が存在しないXMLは空配列を返す',                         '[]が返る'],
    ['R-07', 'rss.ts', '&amp; を & にデコードする',                                   'タイトルが "A & B" になる'],
    ['R-08', 'rss.ts', '&lt; &gt; をデコードする',                                    'タイトルが "<テスト>" になる'],
    ['R-09', 'rss.ts', '&quot; をデコードする',                                       'タイトルが \'"引用"\' になる'],
    ['R-10', 'rss.ts', "&#39; と &apos; をデコードする",                              "タイトルが \"it's 'ok'\" になる"],
    ['R-11', 'rss.ts', 'タイトルのCDATAを処理できる',                                 'CDATAがそのままテキストとして取得される'],
    ['R-12', 'rss.ts', 'descriptionのCDATAを処理できる',                              'HTMLタグを含む概要が取得される'],
    ['R-13', 'rss.ts', 'media:thumbnail から画像URLを抽出する',                       '画像URLが正しく取得される'],
    ['R-14', 'rss.ts', 'media:content（imageタイプ）から画像URLを抽出する',           '画像URLが正しく取得される'],
    ['R-15', 'rss.ts', 'enclosure（imageタイプ）から画像URLを抽出する',               '画像URLが正しく取得される'],
    ['R-16', 'rss.ts', '画像タグがない場合は imageUrl が undefined',                  'imageUrl が undefined になる'],
  ];

  cases.forEach(([id, module_, testCase, expected]) => {
    const row = ws.addRow([id, module_, testCase, expected, '未実施', '', '', '']);
    applyDataRow(row);
    const resultCell = row.getCell(5);
    resultCell.dataValidation = {
      type: 'list', allowBlank: false,
      formulae: ['"' + PASS_VALUES.join(',') + '"'],
    };
    resultCell.alignment = centerAlign();
  });

  ws.getColumn(6).numFmt = 'yyyy/mm/dd';
}

// =========================================================
// シート②：手動テスト記録
// =========================================================
function createManualTestSheet(wb) {
  const ws = wb.addWorksheet('手動テスト');

  ws.mergeCells('A1:I1');
  const title = ws.getCell('A1');
  title.value     = 'SIer Slack Bot — 手動テスト記録';
  title.font      = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.fill      = solidFill(COLOR.header);
  title.alignment = centerAlign();
  ws.getRow(1).height = 36;

  const headers = ['ID', 'テスト項目', '確認手順', '期待結果', '実際の結果', '合否', '実行日時', '担当者', '備考'];
  const widths  = [8, 24, 44, 36, 36, 10, 18, 14, 24];
  const headerRow = ws.addRow(headers);
  applyHeaderRow(headerRow, COLOR.subHeader);
  headers.forEach((_, i) => { ws.getColumn(i + 1).width = widths[i]; });

  const PASS_VALUES = ['PASS', 'FAIL', 'SKIP', '未実施'];

  const cases = [
    ['M-01', 'GitHub Actions 手動実行',
      '1. GitHubリポジトリ > Actions > news-bot を開く\n2. "Run workflow" をクリックして実行',
      'ワークフローが成功（緑チェック）で完了する'],
    ['M-02', 'RSS取得ログ確認',
      '1. M-01実行後、ワークフローログを開く\n2. "[RSS] 取得完了" が3フィード分出力されているか確認',
      '"[RSS] 取得完了: https://..." が3行ログに表示される'],
    ['M-03', 'Slack投稿確認（テキスト）',
      '1. M-01実行後、対象Slackチャンネルを開く\n2. 投稿メッセージを確認する',
      'タイトル・AI要約・URLを含むメッセージが投稿されている'],
    ['M-04', 'Slack投稿確認（サムネイル付き）',
      '1. M-03で確認したメッセージのうち、画像付きのものを確認',
      '記事サムネイル画像がBlock Kitで正しく表示されている'],
    ['M-05', 'AI要約品質確認',
      '1. M-03のSlack投稿を確認\n2. 各記事のAI要約（2〜3文）を読む',
      '日本語で2〜3文の自然な要約が生成されている。フォールバックテキストが表示されていない'],
    ['M-06', '重複チェック確認',
      '1. M-01を2回連続で手動実行する\n2. 2回目の実行ログを確認',
      '2回目の実行で同じURLが再投稿されない'],
    ['M-07', 'posted_urls.json 更新確認',
      '1. M-01実行後、リポジトリのコミット履歴を確認\n2. posted_urls.json が更新されているか確認',
      'posted_urls.json に今回投稿したURLが追記されている'],
    ['M-08', 'キーワードフィルタリング確認',
      '1. M-01のSlack投稿を確認\n2. 金融・SIer関連のキーワードを含む記事が優先されているか確認',
      '銀行・SIer・DX関連の記事が一般ニュースより上位に投稿されている'],
    ['M-09', 'RSS取得失敗時のフォールバック確認',
      '1. src/rss.ts の FEED_URLS に無効なURLを1件追加する\n2. 実行してログを確認\n3. 変更を元に戻す',
      '"フィード取得失敗（スキップ）" ログが出力され、他のフィードは正常に処理される'],
    ['M-10', 'Groq APIキー未設定時のエラー確認',
      '1. GitHub Secrets の GROQ_API_KEY を一時的に空にする\n2. ワークフローを実行する',
      'エラーログが出力される、またはフォールバックテキストが使用される'],
  ];

  cases.forEach(([id, item, steps, expected]) => {
    const row = ws.addRow([id, item, steps, expected, '', '未実施', '', '', '']);
    row.height = 60;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { size: 10 }; cell.border = thinBorder(); cell.alignment = leftAlign(true);
    });
    const passCell = row.getCell(6);
    passCell.dataValidation = {
      type: 'list', allowBlank: false,
      formulae: ['"' + PASS_VALUES.join(',') + '"'],
    };
    passCell.alignment = centerAlign();
  });

  ws.getColumn(7).numFmt = 'yyyy/mm/dd hh:mm';
}

// =========================================================
// シート③：凡例
// =========================================================
function createLegendSheet(wb) {
  const ws = wb.addWorksheet('凡例');

  ws.mergeCells('A1:C1');
  const title = ws.getCell('A1');
  title.value     = '凡例（合否の判定基準）';
  title.font      = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  title.fill      = solidFill(COLOR.header);
  title.alignment = centerAlign();
  ws.getRow(1).height = 32;

  const headerRow = ws.addRow(['値', '意味', '背景色']);
  applyHeaderRow(headerRow, COLOR.subHeader);

  const legends = [
    ['PASS',  '期待通りに動作した',     COLOR.pass],
    ['FAIL',  '期待と異なる動作をした', COLOR.fail],
    ['SKIP',  'テストをスキップした',   COLOR.skip],
    ['未実施', 'まだ実行していない',     COLOR.white],
  ];

  legends.forEach(([val, desc, color]) => {
    const row = ws.addRow([val, desc, '']);
    row.height = 24;
    row.getCell(1).fill = solidFill(color);
    row.getCell(1).font = { bold: true, size: 10 };
    row.getCell(3).fill = solidFill(color);
    row.eachCell((cell) => { cell.border = thinBorder(); cell.alignment = leftAlign(); });
  });

  ws.getColumn(1).width = 12;
  ws.getColumn(2).width = 30;
  ws.getColumn(3).width = 12;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SIer Slack Bot';
  wb.created = wb.modified = new Date();

  createAutoTestSheet(wb);
  createManualTestSheet(wb);
  createLegendSheet(wb);

  await wb.xlsx.writeFile(OUTPUT_PATH);
  console.log('✅ テンプレートを生成しました:', OUTPUT_PATH);
}

main().catch((err) => { console.error('❌ 生成失敗:', err); process.exit(1); });
