import { fetchAllFeeds } from './rss';
import { loadPostedUrls, savePostedUrls, filterNewArticles } from './urlStore';
import { summarize } from './summarizer';
import { postMessage, wait } from './slack';

const MAX_ARTICLES = 5;
const POST_INTERVAL_MS = 1_000;

process.on('uncaughtException', (err) => {
  console.error('[main] 予期しない例外が発生しました:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[main] 未処理のPromise拒否が発生しました:', reason);
  process.exit(1);
});

function validateEnv(): void {
  const missing: string[] = [];
  if (!process.env.SLACK_WEBHOOK_URL) missing.push('SLACK_WEBHOOK_URL');
  if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  if (missing.length > 0) {
    throw new Error(
      `[main] 必須の環境変数が設定されていません: ${missing.join(', ')}\n` +
      '  GitHub Secrets または .env ファイルを確認してください。'
    );
  }
}

async function main(): Promise<void> {
  console.info('[main] ニュースBot 起動');

  // 環境変数の検証
  validateEnv();
  console.info('[main] 環境変数: OK');

  // RSSフィード取得
  console.info('[main] RSSフィード取得を開始します...');
  const allArticles = await fetchAllFeeds();
  console.info(`[main] 取得記事数（全フィード合計）: ${allArticles.length}件`);

  // 未投稿記事の抽出
  const postedUrls = loadPostedUrls();
  const newArticles = filterNewArticles(allArticles, postedUrls).slice(0, MAX_ARTICLES);
  console.info(`[main] 未投稿記事（最大${MAX_ARTICLES}件）: ${newArticles.length}件`);

  if (newArticles.length === 0) {
    console.info('[main] 投稿対象なし。処理を終了します。');
    return;
  }

  // 要約生成 → Slack投稿
  const postedThisRun: string[] = [];

  for (let i = 0; i < newArticles.length; i++) {
    const article = newArticles[i];
    console.info(`[main] 処理中 (${i + 1}/${newArticles.length}): ${article.title}`);

    const summary = await summarize(article.title, article.description);
    await postMessage(article, summary);
    postedThisRun.push(article.url);

    // 最後の記事以外はウェイトを挟む
    if (i < newArticles.length - 1) {
      await wait(POST_INTERVAL_MS);
    }
  }

  // 投稿済みURLを保存
  savePostedUrls([...postedUrls, ...postedThisRun]);
  console.info(`[main] posted_urls.json を更新しました（+${postedThisRun.length}件）`);

  console.info('[main] 全処理完了');
}

main().catch((err) => {
  console.error('[main] 致命的なエラーが発生しました:', err instanceof Error ? err.message : err);
  process.exit(1);
});
