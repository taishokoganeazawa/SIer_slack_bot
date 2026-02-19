# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## チケット管理ルール

実装タスクは `docs/` 配下のMarkdownファイルで管理する。

| 状態 | 表記 |
|---|---|
| 未着手 | `[ ]` |
| 完了 | `[×]` |

**ルール：** 機能の実装が完了したら、該当チケットの `[ ]` を `[×]` に更新すること。

### チケット一覧

| ファイル | 内容 |
|---|---|
| `docs/001_project-setup.md` | プロジェクト初期セットアップ |
| `docs/002_rss-fetcher.md` | RSSフィード取得モジュール |
| `docs/003_duplicate-check.md` | 重複チェック・URL管理モジュール |
| `docs/004_claude-api.md` | AI要約生成モジュール（Groq API） |
| `docs/005_slack-webhook.md` | Slack Incoming Webhook投稿モジュール |
| `docs/006_main-orchestration.md` | メイン処理（オーケストレーション） |
| `docs/007_github-actions.md` | GitHub Actionsワークフロー設定 |

---

## プロジェクト概要

本リポジトリは、金融業界および大手SIer（システムインテグレーター）に関連するニュースを毎朝自動収集し、Groq APIによるAI要約を付けてSlackチャンネルへ投稿するBotです。業務担当者がニュースを個別に収集する手間を省き、関連情報を効率よく把握できる環境を提供します。

---

## システム構成

| コンポーネント | 役割 |
|---|---|
| GitHub Actions | スケジュール実行（Cron）。毎朝決まった時刻にBotを起動する |
| RSSフィードパーサー | 指定メディアのRSSを取得・パースし、記事一覧を生成する |
| キーワードフィルター | 金融・SIer関連キーワードでスコアリングし関連度順に並び替える |
| OGP画像取得 | 記事ページのog:imageを取得しサムネイルとして付与する |
| 重複チェックモジュール | 投稿済みURLをJSONで管理し、再投稿を防止する |
| Groq API（llama-3.3-70b-versatile） | 記事タイトルと概要をもとにAIが日本語要約を生成する |
| Slack Webhook | Incoming Webhookを通じて指定チャンネルへ投稿する |

---

## 処理フロー

1. GitHub ActionsがCronスケジュールに従いワークフローを起動する
2. 3つのRSSフィードから最新記事を取得・パースする
3. `posted_urls.json` を参照し、未投稿の記事のみを抽出する
4. キーワードスコアで関連度順にソートし、上位5件を選出する
5. 各記事のOGP画像（og:image）を取得してArticleに付与する
6. 各記事をGroq APIに送信し、日本語要約（2〜3文）を生成する
7. Slack Incoming WebhookへタイトルAI要約・URL・サムネイルを含むメッセージを投稿する
8. 投稿済みURLを `posted_urls.json` に追記・保存する（最大1,000件保持）

---

## 機能要件

### RSSフィード取得

| 項目 | 内容 |
|---|---|
| 対象メディア① | NHK ビジネスニュース `https://www.nhk.or.jp/rss/news/cat6.xml` |
| 対象メディア② | ITmedia AI＋IT `https://rss.itmedia.co.jp/rss/2.0/ait.xml` |
| 対象メディア③ | ITmedia エンタープライズ `https://rss.itmedia.co.jp/rss/2.0/enterprise.xml` |
| 取得タイムアウト | 15秒 |
| リダイレクト対応 | あり（HTTPリダイレクトを自動追従、相対URLも解決） |
| User-Agent | `Mozilla/5.0 (compatible; SIerSlackBot/1.0)` |
| エラー時の挙動 | 対象フィードのみスキップし、他フィードの処理を継続する |

### 記事フィルタリング・選出

| 項目 | 内容 |
|---|---|
| 最大投稿件数 | 1回の実行につき最大5件 |
| 重複排除 | `posted_urls.json` に記録済みのURLを持つ記事は除外する |
| 選出順序 | キーワードスコアによる関連度順（金融・大手SIer関連を優先） |
| 件数が0件の場合 | Slackへの投稿はスキップし、正常終了とする |

### サムネイル画像取得

| 項目 | 内容 |
|---|---|
| 取得方法 | 記事ページのHTMLから `<meta property="og:image">` を抽出 |
| フォールバック | RSSに画像URLが含まれる場合はそちらを優先使用 |
| エラー時 | 画像取得失敗は無視し、画像なしで投稿を継続する |
| 並列処理 | 上位5件を `Promise.allSettled` で並列取得 |

### AI要約生成

| 項目 | 内容 |
|---|---|
| 使用サービス | Groq API |
| 使用モデル | `llama-3.3-70b-versatile` |
| 要約言語 | 日本語 |
| 要約長 | 2〜3文 |
| 入力情報 | 記事タイトル + RSSのdescription（概要テキスト） |
| API呼び出し | 選出された記事ごとに個別に呼び出す |
| エラー時の挙動 | 要約失敗時はフォールバックテキストを表示し、投稿は継続する |

### Slack投稿

| 項目 | 内容 |
|---|---|
| 投稿方式 | Slack Incoming Webhook |
| 投稿フォーマット（画像あり） | Block Kit（section + image accessory）でサムネイル付き投稿 |
| 投稿フォーマット（画像なし） | タイトル・AI要約・記事URLのシンプルテキスト |
| 投稿タイミング | 毎朝1回（時刻はGitHub Actionsで設定） |
| 複数記事の投稿 | 1記事につき1メッセージを順次投稿する |
| エラー時の挙動 | Webhook送信失敗はログ出力のうえ次記事へ継続 |

---

## 非機能要件

| 区分 | 内容 |
|---|---|
| 実行環境 | GitHub Actions（無料プラン）。外部サーバー不要 |
| 実行コスト | GitHub Actions無料枠（2,000分/月）およびGroq API（無料枠14,400リクエスト/日）のみ |
| 重複投稿防止 | `posted_urls.json` をリポジトリにコミットし永続管理する |
| シークレット管理 | `SLACK_WEBHOOK_URL` および `GROQ_API_KEY` はGitHub Secretsに格納 |
| ログ | GitHub Actionsのログに各処理ステップの状況を出力する |
| 保守性 | RSSフィードURLはソースコード上部の設定オブジェクトで一元管理する |

---

## 技術スタック

| 技術 | バージョン・詳細 |
|---|---|
| 言語 | TypeScript（Node.js上で実行） |
| 実行基盤 | GitHub Actions（ubuntu-latest） |
| RSSパース | 外部ライブラリ不使用（正規表現による自前パース） |
| HTTP通信 | Node.js標準モジュール（`https`/`http`）。axios等は不使用 |
| AI要約 | Groq API（`llama-3.3-70b-versatile`）※無料枠14,400リクエスト/日 |
| Slack連携 | Incoming Webhook（Slack App設定が必要） |
| 状態管理 | `posted_urls.json`（リポジトリ内に保存・Git管理） |

---

## ファイル構成

```
.
├── .github/
│   └── workflows/
│       └── news-bot.yml       # GitHub Actionsワークフロー定義（Cron・環境変数設定）
├── src/
│   ├── index.ts               # メイン処理（RSS取得→フィルタ→OGP取得→要約→Slack投稿）
│   ├── rss.ts                 # RSSフィード取得・パース・OGP画像取得
│   ├── filter.ts              # キーワードスコアリング・関連度ソート
│   ├── urlStore.ts            # 投稿済みURL管理（読み込み・保存・重複チェック）
│   ├── summarizer.ts          # Groq API呼び出し・AI要約生成
│   └── slack.ts               # Slack Incoming Webhook投稿
├── posted_urls.json           # 投稿済みURL一覧（最大1,000件保持）
├── package.json               # Node.jsパッケージ定義（依存関係は最小限）
├── tsconfig.json              # TypeScriptコンパイル設定
└── .env.example               # 環境変数サンプル（実際の値はGitHub Secretsで管理）
```

---

## 環境変数（GitHub Secrets）

| 変数名 | 説明 |
|---|---|
| `SLACK_WEBHOOK_URL` | SlackアプリのIncoming Webhook URL。チャンネルごとに発行する |
| `GROQ_API_KEY` | Groq API キー。console.groq.com から無料で取得する |

---

## 実行スケジュール

GitHub ActionsのCronはUTCで設定するため、JST（日本時間）からの変換が必要。

| 項目 | 設定値 |
|---|---|
| 実行頻度 | 毎日1回 |
| 実行時刻（JST） | 毎朝7:00 |
| Cron式（UTC） | `0 22 * * *`（前日UTC 22:00 = JST 7:00） |
| 手動実行 | `workflow_dispatch` により手動トリガーも可能 |

---

## セットアップ手順

1. Slackワークスペースでアプリを作成し、Incoming Webhook URLを取得する
2. [console.groq.com](https://console.groq.com) でAPIキーを発行する
3. GitHubリポジトリの **Settings > Secrets and variables** に `SLACK_WEBHOOK_URL` と `GROQ_API_KEY` を登録する
4. `posted_urls.json` を空の状態（`[]`）でリポジトリにコミットする
5. GitHub Actionsワークフローを有効化し、手動実行で動作確認を行う
6. 正常動作を確認後、Cronスケジュールによる自動実行を開始する

---

## 制約・前提条件

- RSSフィードの仕様変更（URL変更・提供停止）が発生した場合は手動でソースを更新する必要がある
- Groq APIは無料枠（14,400リクエスト/日）内での運用を前提とする
- GitHub Actionsの無料枠（2,000分/月）内での運用を前提とする。1回の実行は通常1〜2分以内に完了する見込み
- Slack Incoming Webhookの投稿レート制限（1秒1件）を考慮し、記事間に適切なウェイトを設ける
- RSSの `description` フィールドのみを要約インプットとするため、有料会員限定の本文は使用しない

---

## Node.js Best Practices

### Project Structure
- `src/` にアプリケーションコードを置く。`index.js` はエントリーポイントのみにする
- 機能単位でモジュールを分割する（例: `src/handlers/`, `src/services/`, `src/utils/`）
- 環境変数は `.env` で管理し、`.env.example` をリポジトリに含める（`.env` 自体は `.gitignore` に追加）

### 環境変数・設定
- シークレット（APIキー、トークン等）をコードにハードコードしない
- `dotenv` を使用し、`process.env` 経由でアクセスする
- 起動時に必須の環境変数が揃っているか検証する

### エラーハンドリング
- `async/await` + `try/catch` を使う。コールバックスタイルは避ける
- Promise を握りつぶさない。必ず `.catch()` または `try/catch` で処理する
- 予期しないエラーは `process.on('uncaughtException')` と `process.on('unhandledRejection')` でログに残してプロセスを終了する
- エラーオブジェクトには `message` と `stack` を含めてログ出力する

### 非同期処理
- `async/await` を基本とし、コールバック地獄を避ける
- 並列実行できる非同期処理は `Promise.all()` を使う
- I/O バウンドな処理はノンブロッキングで実装する

### セキュリティ
- 外部入力は必ずバリデーション・サニタイズする
- 依存パッケージは定期的に `npm audit` でチェックする
- 最小権限の原則を守る（不要なスコープのトークンを使わない）
- `npm install --save-exact` または `package-lock.json` でバージョンを固定する

### コーディングスタイル
- ESLint を導入し、コードスタイルを統一する（推奨: `eslint:recommended`）
- セミコロン、インデント（スペース2つ）、クォート（シングル）を統一する
- 変数宣言は `const` を優先し、再代入が必要な場合のみ `let` を使う。`var` は使わない
- 関数は小さく単一責任に保つ

### ログ
- `console.log` の代わりに構造化ロガー（`pino` や `winston`）を使う
- ログレベル（`info`, `warn`, `error`, `debug`）を適切に使い分ける
- 本番環境では `debug` ログを出力しない

### パッケージ管理
- `npm` を使用する（`yarn` や `pnpm` との混在を避ける）
- `devDependencies` と `dependencies` を正しく分ける
- `node_modules/` は `.gitignore` に追加する

### テスト
- ユニットテストを `__tests__/` または `*.test.js` に置く
- テストフレームワークは `Jest` を使用する
- テストカバレッジ 80% 以上を目標とする
