# SIer Slack Bot

金融・大手SIer業界に関連するニュースを毎朝自動収集し、AI要約付きでSlackへ投稿するBotです。

---

## 概要

3つのRSSフィードから最新ニュースを取得し、キーワードスコアで関連度の高い記事を優先選出します。
Groq APIによる日本語要約とOGPサムネイル画像を付けてSlackチャンネルへ自動投稿します。
GitHub Actionsで動作するため、外部サーバーは不要です。

---

## 投稿イメージ

```
【記事タイトル】
要約テキスト（2〜3文）
記事を読む → [URL]
[サムネイル画像]
```

---

## 取得対象フィード

| メディア | カテゴリ |
|---|---|
| NHK ビジネスニュース | 国内ビジネス・経済 |
| ITmedia AI＋IT | AI・IT技術 |
| ITmedia エンタープライズ | 企業向けIT |

---

## 機能

- **RSSフィード取得**: 3フィードを並列取得、1フィード失敗時も継続
- **関連度フィルタリング**: 富士通・NEC・NTTデータ・日立・金融・DXなどのキーワードでスコアリング
- **OGP画像取得**: 記事ページから`og:image`を自動取得しサムネイルとして付与
- **AI要約**: Groq API（llama-3.3-70b-versatile）で2〜3文の日本語要約を生成
- **Slack投稿**: 画像ありはBlock Kit、画像なしはシンプルテキストで投稿
- **重複防止**: `posted_urls.json`で投稿済みURLを管理（最大1,000件）

---

## セットアップ

### 1. Slack Webhook URLを取得

1. [api.slack.com/apps](https://api.slack.com/apps) でアプリを作成
2. **Incoming Webhooks** を有効化
3. 投稿先チャンネルを選択してWebhook URLを発行

### 2. Groq APIキーを取得

1. [console.groq.com](https://console.groq.com) にアクセス
2. **API Keys** からキーを発行（無料）

### 3. GitHub Secretsに登録

リポジトリの **Settings > Secrets and variables > Actions** に以下を追加：

| シークレット名 | 値 |
|---|---|
| `SLACK_WEBHOOK_URL` | SlackのWebhook URL |
| `GROQ_API_KEY` | GroqのAPIキー |

### 4. 手動実行で動作確認

Actions タブの「Run workflow」から手動実行し、Slackへの投稿を確認します。

### 5. 毎朝の自動実行を有効化

動作確認が取れたら、以下の変数を設定することで毎朝7:00（JST）の自動実行が始まります。

**Settings > Secrets and variables > Actions > Variables タブ**

| 変数名 | 値 |
|---|---|
| `BOT_ENABLED` | `true` |

> 変数を削除または `false` にすると自動実行が止まります。

---

## 実行スケジュール

| 項目 | 設定値 |
|---|---|
| 実行時刻 | 毎朝 7:00（日本時間） |
| Cron式（UTC） | `0 22 * * *` |
| 自動実行の有効化 | GitHub Variables に `BOT_ENABLED=true` を設定 |
| 手動実行 | Actions タブの「Run workflow」から可能 |

---

## ファイル構成

```
.
├── .github/workflows/news-bot.yml  # GitHub Actionsワークフロー
├── src/
│   ├── index.ts                    # メイン処理
│   ├── rss.ts                      # RSSフィード取得・パース・OGP画像取得
│   ├── filter.ts                   # キーワードスコアリング・関連度ソート
│   ├── urlStore.ts                 # 投稿済みURL管理
│   ├── summarizer.ts               # Groq API・AI要約生成
│   ├── slack.ts                    # Slack Webhook投稿
│   └── __tests__/                  # ユニットテスト
│       ├── filter.test.ts
│       ├── urlStore.test.ts
│       └── rss.test.ts
├── scripts/
│   ├── create-test-template.js     # 手動テスト記録Excel生成
│   ├── jest-to-excel.js            # Jest結果 → Excel変換
│   └── run-test-report.js          # テスト実行 + Excel出力
├── posted_urls.json                # 投稿済みURL履歴
├── jest.config.js                  # Jestテスト設定
├── package.json
├── tsconfig.json
└── .env.example                    # 環境変数サンプル
```

---

## テスト

```bash
# ユニットテスト実行
npm test

# テスト実行 + 結果をExcel出力（jest-results.xlsx）
npm run test:report

# 手動テスト記録テンプレートを生成（test-results.xlsx）
npm run test:template
```

| コマンド | 内容 |
|---|---|
| `npm test` | Jest で39件のユニットテストを実行 |
| `npm run test:report` | テスト実行 → `jest-results.xlsx` を自動生成 |
| `npm run test:template` | 手動テスト記録テンプレート `test-results.xlsx` を生成 |

---

## 技術スタック

| 技術 | 詳細 |
|---|---|
| 言語 | TypeScript / Node.js |
| 実行基盤 | GitHub Actions |
| AI要約 | Groq API（llama-3.3-70b-versatile）|
| Slack連携 | Incoming Webhook |
| RSSパース | 正規表現による自前実装（外部ライブラリなし） |
| HTTP通信 | Node.js標準モジュール（`https`/`http`） |
| テスト | Jest + ts-jest |

---

## ローカル開発

```bash
# 依存関係インストール
npm install

# 環境変数を設定
cp .env.example .env
# .env に実際のキーを記入

# ビルド
npm run build

# 実行
npm start

# テスト
npm test
```

---

## コスト

| サービス | 料金 |
|---|---|
| GitHub Actions | 無料枠（2,000分/月）内で運用可能 |
| Groq API | 無料枠（14,400リクエスト/日）内で運用可能 |
| Slack Incoming Webhook | 無料 |
