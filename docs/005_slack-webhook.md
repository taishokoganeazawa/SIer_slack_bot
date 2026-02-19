# 005 Slack Incoming Webhook 投稿モジュール

## 概要

Slack Incoming Webhook を通じて、記事タイトル・AI要約・URL・サムネイル画像を1メッセージずつ投稿する。
画像がある場合はBlock Kit（image accessory付きsection）、ない場合はシンプルテキストで投稿する。
レート制限（1秒1件）を考慮したウェイト処理を含む。

---

## 投稿フォーマット

### 画像あり（Block Kit）

```
[section block]
  *【記事タイトル】*
  要約テキスト（2〜3文）
  <記事URL|記事を読む>
  [image accessory: サムネイル]
```

### 画像なし（シンプルテキスト）

```
*【記事タイトル】*
要約テキスト（2〜3文）
<記事URL|記事を読む>
```

---

## TODO

- [×] `src/slack.ts` を作成する
- [×] `postMessage(article: Article, summary: string): Promise<void>` を実装する
- [×] Node.js 標準モジュール（`https`）で Webhook URL に POST リクエストを送信する
- [×] `SLACK_WEBHOOK_URL` を環境変数から取得し、未設定時は起動時エラーとする
- [×] 画像ありの場合はBlock Kit（section + image accessory）でpayloadを組み立てる
- [×] 画像なしの場合はシンプルテキストでpayloadを組み立てる
- [×] Webhook 送信失敗時はエラーをログ出力し、例外をスローせず次記事へ継続する
- [×] 記事間に1秒のウェイトを設ける（`setTimeout` を `Promise` でラップして `await`）

---

## 受け入れ条件

- Slack チャンネルにメッセージが投稿される
- 画像がある記事はサムネイル付きで投稿される
- 1件失敗しても残りの記事が投稿される
- 1秒間隔で順次投稿される
- `SLACK_WEBHOOK_URL` が未設定の場合、起動時に分かりやすいエラーメッセージが出る
