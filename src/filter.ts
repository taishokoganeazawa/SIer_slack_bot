import { Article } from './rss';

// 金融・SIer関連のキーワードとスコア
const KEYWORDS: { pattern: RegExp; score: number }[] = [
  // 大手SIer
  { pattern: /富士通|Fujitsu/i, score: 3 },
  { pattern: /NEC|日本電気/i, score: 3 },
  { pattern: /NTTデータ|NTT Data/i, score: 3 },
  { pattern: /日立|Hitachi/i, score: 3 },
  { pattern: /野村総合研究所|野村総研|NRI/i, score: 3 },
  { pattern: /TIS|SCSK|伊藤忠テクノ|CTCシステム/i, score: 3 },
  { pattern: /アクセンチュア|Accenture|IBM|デロイト/i, score: 2 },

  // 金融
  { pattern: /銀行|証券|保険|金融|FinTech|フィンテック/i, score: 3 },
  { pattern: /日銀|日本銀行|メガバンク|地銀/i, score: 3 },
  { pattern: /資産運用|投資|株式|為替|債券/i, score: 2 },

  // IT・DX
  { pattern: /DX|デジタルトランスフォーメーション|デジタル変革/i, score: 2 },
  { pattern: /生成AI|GenerativeAI|LLM|ChatGPT|Copilot/i, score: 2 },
  { pattern: /クラウド|AWS|Azure|GCP|Google Cloud/i, score: 2 },
  { pattern: /サイバーセキュリティ|セキュリティ|情報漏洩|ランサム/i, score: 2 },
  { pattern: /ERP|SAP|基幹システム|SaaS|PaaS/i, score: 2 },
  { pattern: /システム開発|SI|システムインテグレ/i, score: 2 },
  { pattern: /IT投資|デジタル投資|IT予算/i, score: 2 },

  // 一般ビジネス・経済
  { pattern: /経済|景気|GDP|物価|インフレ/i, score: 1 },
  { pattern: /企業|ビジネス|経営|M&A|買収|合併/i, score: 1 },
];

function scoreArticle(article: Article): number {
  const text = `${article.title} ${article.description}`;
  return KEYWORDS.reduce((total, { pattern, score }) => {
    return total + (pattern.test(text) ? score : 0);
  }, 0);
}

export function sortByRelevance(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => scoreArticle(b) - scoreArticle(a));
}
