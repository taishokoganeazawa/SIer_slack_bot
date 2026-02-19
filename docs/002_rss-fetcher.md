# 002 RSSフィード取得モジュール

## 概要

3つのメディアのRSSフィードをNode.js標準モジュール（`https`/`http`）で取得し、
記事一覧（タイトル・URL・description・imageUrl）にパースする。
外部ライブラリは使用せず、正規表現による自前パースで実装する。
記事ページからOGP画像（og:image）を取得してサムネイルとして付与する機能も含む。

---

## 対象フィード

| # | メディア | URL |
|---|---|---|
| 1 | NHK ビジネスニュース | `https://www.nhk.or.jp/rss/news/cat6.xml` |
| 2 | ITmedia AI＋IT | `https://rss.itmedia.co.jp/rss/2.0/ait.xml` |
| 3 | ITmedia エンタープライズ | `https://rss.itmedia.co.jp/rss/2.0/enterprise.xml` |

---

## TODO

- [×] `src/rss.ts` を作成する
- [×] `fetchFeed(url: string): Promise<string>` を実装する（Node.js `https`/`http` モジュール使用）
- [×] タイムアウト15秒を設定する
- [×] HTTPリダイレクト（301/302）を自動追従する（相対URLも正しく解決する）
- [×] `User-Agent` ヘッダーを付与する（一部サイトのブロック回避）
- [×] `parseFeed(xml: string): Article[]` を正規表現で実装する（`<item>` タグから `title`, `link`, `description` を抽出）
- [×] `Article` 型（`title: string`, `url: string`, `description: string`, `imageUrl?: string`）を定義する
- [×] RSSから画像URLを抽出する（`<media:thumbnail>`, `<media:content type="image/...">`, `<enclosure type="image/...">`）
- [×] `fetchOgpImage(articleUrl: string): Promise<string | undefined>` を実装する（記事HTMLから `og:image` を抽出）
- [×] `enrichWithImages(articles: Article[]): Promise<Article[]>` を実装する（並列でOGP画像を付与）
- [×] フィード取得失敗時はそのフィードをスキップし、エラーをログ出力して処理を継続する
- [×] 3フィードを並列取得する（`Promise.allSettled`）

---

## 受け入れ条件

- 3フィードすべてから記事一覧が取得できる
- 1フィードが失敗しても残り2フィードの結果が返る
- タイムアウト15秒が機能している
- 記事にOGP画像URLが付与される（取得失敗時はundefined）
