# 005 Slack Incoming Webhook 投稿モジュール

## 概要

Slack Incoming Webhook を通じて、記事タイトル・AI要約・URLを1メッセージずつ投稿する。
レート制限（1秒1件）を考慮したウェイト処理を含む。

---

## 投稿フォーマット（例）

```
*【記事タイトル】*
要約テキスト（2〜3文）
<記事URL>
```

---

## TODO

- [×] `src/slack.ts` を作成する
- [×] `postMessage(article: Article, summary: string): Promise<void>` を実装する
- [×] Node.js 標準モジュール（`https`）で Webhook URL に POST リクエストを送信する
- [×] `SLACK_WEBHOOK_URL` を環境変数から取得し、未設定時は起動時エラーとする
- [×] 投稿フォーマット（タイトル・要約・URL）を整形して payload を組み立てる
- [×] Webhook 送信失敗時はエラーをログ出力し、例外をスローせず次記事へ継続する
- [×] 記事間に1秒のウェイトを設ける（`setTimeout` を `Promise` でラップして `await`）

---

## 受け入れ条件

- Slack チャンネルにメッセージが投稿される
- 1件失敗しても残りの記事が投稿される
- 1秒間隔で順次投稿される
- `SLACK_WEBHOOK_URL` が未設定の場合、起動時に分かりやすいエラーメッセージが出る
