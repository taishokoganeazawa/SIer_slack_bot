import * as https from 'https';
import * as http from 'http';

export interface Article {
  title: string;
  url: string;
  description: string;
  imageUrl?: string;
}

const FEED_URLS = [
  'https://www.nhk.or.jp/rss/news/cat6.xml',                  // NHK ビジネスニュース
  'https://rss.itmedia.co.jp/rss/2.0/ait.xml',                // ITmedia AI＋IT
  'https://rss.itmedia.co.jp/rss/2.0/enterprise.xml',         // ITmedia エンタープライズ
];

const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;
const USER_AGENT = 'Mozilla/5.0 (compatible; SIerSlackBot/1.0)';

function resolveLocation(base: string, location: string): string {
  if (location.startsWith('http://') || location.startsWith('https://')) {
    return location;
  }
  const baseUrl = new URL(base);
  return new URL(location, baseUrl.origin).toString();
}

function fetchFeed(url: string, redirectCount = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error(`リダイレクト上限（${MAX_REDIRECTS}回）を超えました: ${url}`));
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: { 'User-Agent': USER_AGENT },
    };

    const req = client.get(options, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        res.resume();
        const nextUrl = resolveLocation(url, res.headers.location);
        fetchFeed(nextUrl, redirectCount + 1).then(resolve).catch(reject);
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

function extractImageUrl(item: string): string | undefined {
  // <media:thumbnail url="..."/>
  const mediaThumbnail = item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (mediaThumbnail) return mediaThumbnail[1];

  // <media:content url="..." type="image/..."/>
  const mediaContent = item.match(/<media:content[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/i);
  if (mediaContent) return mediaContent[1];

  // <enclosure url="..." type="image/..."/>
  const enclosure = item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/i);
  if (enclosure) return enclosure[1];

  return undefined;
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
    const imageUrl = extractImageUrl(item);

    if (title && url) {
      articles.push({ title, url, description, imageUrl });
    }
  }

  return articles;
}

async function fetchOgpImage(articleUrl: string): Promise<string | undefined> {
  try {
    const html = await fetchFeed(articleUrl);
    // <meta property="og:image" content="..."> の両パターンに対応
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

export async function enrichWithImages(articles: Article[]): Promise<Article[]> {
  const results = await Promise.allSettled(
    articles.map(async (article) => {
      if (article.imageUrl) return article; // RSSに画像があればそのまま使用
      const imageUrl = await fetchOgpImage(article.url);
      return { ...article, imageUrl };
    })
  );

  return results.map((result, i) =>
    result.status === 'fulfilled' ? result.value : articles[i]
  );
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
