import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-1.5-flash';
const FALLBACK_TEXT = '（要約を取得できませんでした）';

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        '[summarizer] 環境変数 GEMINI_API_KEY が設定されていません。' +
        'GitHub Secrets または .env ファイルを確認してください。'
      );
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export async function summarize(title: string, description: string): Promise<string> {
  try {
    const prompt =
      `以下のニュース記事を日本語で2〜3文に要約してください。` +
      `要約のみを出力し、前置きや補足は不要です。\n\n` +
      `タイトル: ${title}\n` +
      `概要: ${description}`;

    const model = getClient().getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return text || FALLBACK_TEXT;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[summarizer] API呼び出し失敗: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return FALLBACK_TEXT;
  }
}
