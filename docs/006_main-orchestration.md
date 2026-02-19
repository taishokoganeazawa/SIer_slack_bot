# 006 メイン処理（オーケストレーション）

## 概要

`src/index.ts` として、各モジュールを組み合わせて一連の処理フローを実装する。
各ステップのログ出力により、GitHub Actions 上で処理状況を把握できるようにする。

---

## 処理フロー

```
起動
 ↓
環境変数の検証（SLACK_WEBHOOK_URL, GROQ_API_KEY）
 ↓
RSSフィード取得・パース（3フィード並列）
 ↓
posted_urls.json を読み込み、未投稿記事を抽出
 ↓
キーワードスコアで関連度順にソートし、上位5件を選出
 ↓
0件なら投稿スキップ・正常終了
 ↓
OGP画像を並列取得してArticleに付与
 ↓
各記事に対してGroq APIで要約生成
 ↓
Slack Webhookへ1件ずつ投稿（1秒間隔）
 ↓
投稿済みURLをposted_urls.jsonに追記・保存
 ↓
正常終了
```

---

## TODO

- [×] `src/index.ts` を作成する
- [×] 起動時に `SLACK_WEBHOOK_URL` と `GROQ_API_KEY` の存在を検証し、未設定なら即時終了する
- [×] 各ステップの開始・完了をログ出力する（`console.info`）
- [×] RSSフィードを並列取得し、全記事をマージする
- [×] `filterNewArticles` で未投稿記事を抽出し、`sortByRelevance` で関連度順にソートして先頭5件に絞る
- [×] 未投稿記事が0件の場合、「投稿対象なし」をログ出力して正常終了する
- [×] `enrichWithImages` でOGP画像を並列取得してArticleに付与する
- [×] 各記事を `summarize` → `postMessage` の順で処理する（1秒ウェイト込み）
- [×] 投稿が完了した記事のURLを `savePostedUrls` で保存する
- [×] `process.on('uncaughtException')` と `process.on('unhandledRejection')` でグローバルエラーハンドリングを実装する

---

## 受け入れ条件

- フロー全体が正常に動作し、Slackに記事が投稿される
- 金融・SIer関連の記事が優先的に選出される
- 記事にサムネイル画像が付与される（取得できた場合）
- 各ステップのログが GitHub Actions のログで確認できる
- エラーが発生してもプロセスが予期せずクラッシュしない
