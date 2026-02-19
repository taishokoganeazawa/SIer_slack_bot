# 003 重複チェック・URL管理モジュール

## 概要

`posted_urls.json` を読み書きし、投稿済み記事の再投稿を防止する。
上限1,000件を超えた分は古いものから破棄する。

---

## データ形式

```json
{
  "urls": [
    "https://example.com/article-1",
    "https://example.com/article-2"
  ]
}
```

---

## TODO

- [×] `src/urlStore.ts` を作成する
- [×] `loadPostedUrls(): string[]` を実装する（`posted_urls.json` を読み込んで URL 配列を返す）
- [×] `savePostedUrls(urls: string[]): void` を実装する（URL 配列を `posted_urls.json` に書き込む）
- [×] 保存時に最大1,000件を超えた場合、古いものから削除するトリミング処理を実装する
- [×] `filterNewArticles(articles: Article[], postedUrls: string[]): Article[]` を実装する（未投稿記事のみ返す）
- [×] `posted_urls.json` が存在しない場合は空配列として扱い、エラーにしない

---

## 受け入れ条件

- 投稿済みURLを持つ記事が除外される
- 1,000件超の場合、古い順に削除されて1,000件以内に収まる
- ファイルが存在しない初回実行でもエラーなく動作する
