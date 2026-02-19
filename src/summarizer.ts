import Groq from 'groq-sdk';

const MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_TEXT = '（要約を取得できませんでした）';

let client: Groq | null = null;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[summarizer] 環境変数 GROQ_API_KEY が設定されていません。' +
      'GitHub Secrets または .env ファイルを確認してください。'
    );
  }
  if (!client) {
    client = new Groq({ apiKey });
  }
  return client;
}

export async function summarize(title: string, description: string): Promise<string> {
  try {
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content:
            `以下のニュース記事を日本語で2〜3文に要約してください。` +
            `要約のみを出力し、前置きや補足は不要です。\n\n` +
            `タイトル: ${title}\n` +
            `概要: ${description}`,
        },
      ],
      max_tokens: 300,
    });

    const text = completion.choices[0]?.message?.content?.trim();
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
