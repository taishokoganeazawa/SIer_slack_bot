# 008 テスト環境

## 概要

Jest + ts-jest によるユニットテスト環境を整備する。
テスト結果はExcelファイルに出力できる。

---

## テスト対象

| モジュール | テストケース数 | 内容 |
|---|---|---|
| `filter.ts` | 10件 | キーワードスコアリング・ソート順・イミュータブル性 |
| `urlStore.ts` | 14件 | 重複チェック・ファイル読み書き・上限管理 |
| `rss.ts` | 15件 | XMLパース・HTMLエンティティ・CDATA・画像URL抽出 |

---

## コマンド

| コマンド | 内容 |
|---|---|
| `npm test` | ユニットテストを実行する |
| `npm run test:coverage` | カバレッジ付きでテストを実行する |
| `npm run test:report` | テスト実行 → `jest-results.xlsx` を自動生成する |
| `npm run test:template` | 手動テスト記録テンプレート `test-results.xlsx` を生成する |

---

## Excel出力ファイル

| ファイル | 生成コマンド | 内容 |
|---|---|---|
| `jest-results.xlsx` | `npm run test:report` | Jest実行結果（サマリー＋詳細）。実行のたびに上書き |
| `test-results.xlsx` | `npm run test:template` | 自動テスト39件＋手動テスト10件の記録テンプレート |

> `jest-results.xlsx` と `test-results.xlsx` は `.gitignore` で除外されており、リポジトリにはコミットされない。

---

## TODO

- [×] `jest`・`ts-jest`・`@types/jest`・`exceljs` を `devDependencies` に追加する
- [×] `jest.config.js` を作成する（`ts-jest` プリセット、テストパターン設定）
- [×] `src/__tests__/filter.test.ts` を作成する（10件）
- [×] `src/__tests__/urlStore.test.ts` を作成する（14件）
- [×] `src/__tests__/rss.test.ts` を作成する（15件）
- [×] `scripts/jest-to-excel.js` を作成する（Jest JSON → Excel変換）
- [×] `scripts/create-test-template.js` を作成する（手動テスト記録テンプレート生成）
- [×] `scripts/run-test-report.js` を作成する（テスト実行 + Excel出力のランナー）
- [×] `package.json` に `test`・`test:coverage`・`test:report`・`test:template` スクリプトを追加する
- [×] `.gitignore` に `jest-output.json`・`jest-results.xlsx`・`test-results.xlsx` を追加する

---

## 受け入れ条件

- `npm test` で全39件がパスする
- `npm run test:report` で `jest-results.xlsx` が生成される
- `npm run test:template` で `test-results.xlsx` が生成される
- 生成された Excel ファイルはリポジトリにコミットされない
