# 007 GitHub Actions ワークフロー設定

## 概要

`.github/workflows/news-bot.yml` を作成し、毎朝7:00 JST（UTC 22:00）の
Cron スケジュール実行と、手動トリガー（`workflow_dispatch`）を設定する。
GitHub Secrets から環境変数を渡し、TypeScript をビルドして実行する。

スケジュール実行は GitHub Variables の `BOT_ENABLED=true` が設定されている場合のみ動作する。
手動実行（`workflow_dispatch`）は常に動作する。

---

## スケジュール

| 項目 | 設定値 |
|---|---|
| 実行頻度 | 毎日1回 |
| 実行時刻（JST） | 毎朝7:00 |
| Cron式（UTC） | `0 22 * * *` |
| 手動実行 | `workflow_dispatch` で可能 |
| 自動実行の有効化 | GitHub Variables に `BOT_ENABLED=true` を設定 |

---

## TODO

- [×] `.github/workflows/` ディレクトリを作成する
- [×] `news-bot.yml` を作成する
- [×] トリガーを `schedule`（`cron: '0 22 * * *'`）と `workflow_dispatch` で設定する
- [×] ジョブの実行環境を `ubuntu-latest` に設定する
- [×] `permissions: contents: write` を設定する（posted_urls.json のコミット・プッシュに必要）
- [×] `actions/checkout@v4` でリポジトリをチェックアウトするステップを追加する
- [×] `actions/setup-node@v4` で Node.js をセットアップするステップを追加する
- [×] `npm ci` で依存関係をインストールするステップを追加する
- [×] `npm run build`（tsc）でTypeScriptをビルドするステップを追加する
- [×] `node dist/index.js` でBotを実行するステップを追加する
- [×] `SLACK_WEBHOOK_URL` と `GROQ_API_KEY` を `secrets` から環境変数として渡す
- [×] 実行後、`posted_urls.json` の変更をリポジトリにコミット・プッシュするステップを追加する
  - `git config user.name` / `git config user.email` を設定する
  - 変更がある場合のみコミットする（差分チェック）
  - `git pull --rebase origin master` で競合を防ぐ
  - `GITHUB_TOKEN` を使ってプッシュする
- [×] スケジュール実行を `BOT_ENABLED` 変数で制御する
  - `if: github.event_name == 'workflow_dispatch' || vars.BOT_ENABLED == 'true'` をジョブに設定する
  - 手動実行は常に動作、スケジュール実行は `BOT_ENABLED=true` のときのみ動作する

---

## 受け入れ条件

- Cron スケジュールで毎朝自動実行される（`BOT_ENABLED=true` のとき）
- `workflow_dispatch` で手動実行できる（`BOT_ENABLED` の値に関わらず）
- 実行後に `posted_urls.json` が自動でコミット・プッシュされる
- GitHub Actions のログで各ステップの成否が確認できる
