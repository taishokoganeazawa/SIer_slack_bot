import * as https from 'https';
import * as http from 'http';

export interface Article {
  title: string;
  url: string;
  description: string;
}

const FEED_URLS = [
  'https://feeds.reuters.com/reuters/JPBusinessNews',
  'https://rss.itmedia.co.jp/rss/2.0/itmediabiz.xml',
  'https://japan.zdnet.com/rss/news/index.rdf',
];

const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;

function fetchFeed(url: string, redirectCount = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error(`リダイレクト上限（${MAX_REDIRECTS}回）を超えました: ${url}`));
      return;
    }

    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      // リダイレクト追従
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        res.resume();
        fetchFeed(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTPステータスエラー: ${res.statusCode} (${url})`));
        return;
      }

      res.setEncoding('utf8');
      let body = '';
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => resolve(body));
      res.on('error', reject);
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error(`タイムアウト（${TIMEOUT_MS / 1000}秒）: ${url}`));
    });

    req.on('error', reject);
  });
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function extractTagContent(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return decodeHtmlEntities(match[1].trim());
}

export function parseFeed(xml: string): Article[] {
  const articles: Article[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTagContent(item, 'title');
    const url = extractTagContent(item, 'link') || extractTagContent(item, 'guid');
    const description = extractTagContent(item, 'description');

    if (title && url) {
      articles.push({ title, url, description });
    }
  }

  return articles;
}

export async function fetchAllFeeds(): Promise<Article[]> {
  const results = await Promise.allSettled(
    FEED_URLS.map(async (url) => {
      const xml = await fetchFeed(url);
      const articles = parseFeed(xml);
      console.info(`[RSS] 取得完了: ${url} (${articles.length}件)`);
      return articles;
    })
  );

  const allArticles: Article[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      console.error(`[RSS] フィード取得失敗（スキップ）: ${FEED_URLS[i]}`);
      console.error(`  エラー: ${result.reason instanceof Error ? result.reason.message : result.reason}`);
    }
  }

  return allArticles;
}
