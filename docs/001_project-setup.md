# 001 プロジェクト初期セットアップ

## 概要

Node.js / TypeScript プロジェクトの基盤を整備する。
実行に必要な設定ファイル・初期データを用意し、開発・CI環境が動作できる状態にする。

---

## TODO

- [×] `package.json` を作成する（`name`, `scripts`, `dependencies`, `devDependencies` を定義）
- [×] `tsconfig.json` を作成する（`strict: true`, `outDir: dist`, `target: ES2020` 等を設定）
- [×] `.env.example` を作成する（`SLACK_WEBHOOK_URL`, `GROQ_API_KEY` のサンプルを記載）
- [×] `.gitignore` を作成する（`node_modules/`, `dist/`, `.env` を除外）
- [×] `posted_urls.json` を初期状態（`[]`）で作成し、リポジトリにコミットする
- [×] `src/` ディレクトリを作成する

---

## 受け入れ条件

- `npm install` が正常に完了する
- `npm run build`（tsc）がエラーなく通る
- `.env` がリポジトリに含まれないことを確認する
