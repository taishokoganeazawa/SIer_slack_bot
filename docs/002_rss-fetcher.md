# 002 RSSフィード取得モジュール

## 概要

3つのメディアのRSSフィードをNode.js標準モジュール（`https`/`http`）で取得し、
記事一覧（タイトル・URL・description）にパースする。
外部ライブラリは使用せず、正規表現による自前パースで実装する。

---

## 対象フィード

| # | メディア | URL |
|---|---|---|
| 1 | ロイター日本語 | `https://feeds.reuters.com/reuters/JPBusinessNews` |
| 2 | ITmedia ビジネス | `https://rss.itmedia.co.jp/rss/2.0/itmediabiz.xml` |
| 3 | ZDNet Japan | `https://japan.zdnet.com/rss/news/index.rdf` |

---

## TODO

- [×] `src/rss.ts` を作成する
- [×] `fetchFeed(url: string): Promise<string>` を実装する（Node.js `https`/`http` モジュール使用）
- [×] タイムアウト15秒を設定する
- [×] HTTPリダイレクト（301/302）を自動追従する
- [×] `parseFeed(xml: string): Article[]` を正規表現で実装する（`<item>` タグから `title`, `link`, `description` を抽出）
- [×] `Article` 型（`title: string`, `url: string`, `description: string`）を定義する
- [×] フィード取得失敗時はそのフィードをスキップし、エラーをログ出力して処理を継続する
- [×] 3フィードを並列取得する（`Promise.all` または `Promise.allSettled`）

---

## 受け入れ条件

- 3フィードすべてから記事一覧が取得できる
- 1フィードが失敗しても残り2フィードの結果が返る
- タイムアウト15秒が機能している
