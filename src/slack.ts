import * as https from 'https';
import { Article } from './rss';

function getWebhookUrl(): string {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    throw new Error(
      '[slack] 環境変数 SLACK_WEBHOOK_URL が設定されていません。' +
      'GitHub Secrets または .env ファイルを確認してください。'
    );
  }
  return url;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPayload(article: Article, summary: string): string {
  const text = `*【${article.title}】*\n${summary}\n<${article.url}>`;
  return JSON.stringify({ text });
}

function sendRequest(webhookUrl: string, payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      res.resume();
      if (res.statusCode !== 200) {
        reject(new Error(`Slack Webhook エラー: HTTPステータス ${res.statusCode}`));
      } else {
        resolve();
      }
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

export async function postMessage(article: Article, summary: string): Promise<void> {
  try {
    const webhookUrl = getWebhookUrl();
    const payload = buildPayload(article, summary);
    await sendRequest(webhookUrl, payload);
    console.info(`[slack] 投稿完了: ${article.title}`);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[slack] 投稿失敗（スキップ）: ${article.title}`);
    console.error(`  エラー: ${error.message}`);
  }
}

export { wait };
