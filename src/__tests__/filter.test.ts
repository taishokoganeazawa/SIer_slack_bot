import { sortByRelevance } from '../filter';
import { Article } from '../rss';

function makeArticle(title: string, description = ''): Article {
  return { title, url: `https://example.com/${encodeURIComponent(title)}`, description };
}

describe('sortByRelevance', () => {
  describe('スコアリング', () => {
    it('大手SIer名（富士通）を含む記事が高スコアになる', () => {
      const articles = [makeArticle('一般ニュース'), makeArticle('富士通がDX推進')];
      const sorted = sortByRelevance(articles);
      expect(sorted[0].title).toBe('富士通がDX推進');
    });

    it('大手SIer名（NTTデータ）を含む記事が高スコアになる', () => {
      const articles = [makeArticle('スポーツ速報'), makeArticle('NTTデータが新サービス発表')];
      const sorted = sortByRelevance(articles);
      expect(sorted[0].title).toBe('NTTデータが新サービス発表');
    });

    it('金融キーワード（銀行）を含む記事が高スコアになる', () => {
      const articles = [makeArticle('芸能ニュース'), makeArticle('メガバンクがシステム刷新')];
      const sorted = sortByRelevance(articles);
      expect(sorted[0].title).toBe('メガバンクがシステム刷新');
    });

    it('descriptionのキーワードもスコアに加算される', () => {
      const articles = [
        makeArticle('一般記事', '銀行のIT投資が拡大'),
        makeArticle('その他記事', '特になし'),
      ];
      const sorted = sortByRelevance(articles);
      expect(sorted[0].title).toBe('一般記事');
    });

    it('複数キーワードでスコアが加算される（銀行+DX > SIer単体）', () => {
      const articles = [
        makeArticle('NTTデータが発表'),          // SIer(3)
        makeArticle('銀行のDXデジタル変革推進'), // 金融(3) + DX(2) = 5
      ];
      const sorted = sortByRelevance(articles);
      expect(sorted[0].title).toBe('銀行のDXデジタル変革推進');
    });

    it('キーワードなしの記事はスコア0で末尾になる', () => {
      const articles = [
        makeArticle('天気予報'),
        makeArticle('富士通が新技術発表'),
        makeArticle('スポーツニュース'),
      ];
      const sorted = sortByRelevance(articles);
      expect(sorted[0].title).toBe('富士通が新技術発表');
    });

    it('英語キーワード（fujitsu）も大文字小文字を問わずマッチする', () => {
      const articles = [makeArticle('一般記事'), makeArticle('fujitsu announces new product')];
      const sorted = sortByRelevance(articles);
      expect(sorted[0].title).toBe('fujitsu announces new product');
    });
  });

  describe('ソート挙動', () => {
    it('元の配列を変更しない（イミュータブル）', () => {
      const articles = [makeArticle('一般ニュース'), makeArticle('富士通が新発表')];
      const original = [...articles];
      sortByRelevance(articles);
      expect(articles[0].title).toBe(original[0].title);
      expect(articles[1].title).toBe(original[1].title);
    });

    it('空配列を渡すと空配列が返る', () => {
      expect(sortByRelevance([])).toEqual([]);
    });

    it('1件のみの配列はそのまま返る', () => {
      const articles = [makeArticle('記事1')];
      expect(sortByRelevance(articles)).toHaveLength(1);
    });
  });
});
