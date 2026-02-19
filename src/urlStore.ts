import * as fs from 'fs';
import * as path from 'path';
import { Article } from './rss';

const STORE_PATH = path.resolve(__dirname, '../posted_urls.json');
const MAX_URLS = 1_000;

export function loadPostedUrls(): string[] {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.urls)) return parsed.urls;
    return [];
  } catch {
    // ファイルが存在しない・パース失敗時は空配列として扱う
    return [];
  }
}

export function savePostedUrls(urls: string[]): void {
  // 上限を超えた分は古いものから削除
  const trimmed = urls.length > MAX_URLS ? urls.slice(urls.length - MAX_URLS) : urls;
  fs.writeFileSync(STORE_PATH, JSON.stringify({ urls: trimmed }, null, 2), 'utf8');
}

export function filterNewArticles(articles: Article[], postedUrls: string[]): Article[] {
  const postedSet = new Set(postedUrls);
  return articles.filter((article) => !postedSet.has(article.url));
}
