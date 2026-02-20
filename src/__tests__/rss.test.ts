import { parseFeed } from '../rss';

function makeItem(title: string, link: string, description = '', extra = ''): string {
  return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      ${extra}
    </item>`;
}

function wrapFeed(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${items}</channel></rss>`;
}

describe('parseFeed', () => {
  describe('基本的な記事抽出', () => {
    it('正常なXMLから記事を抽出できる', () => {
      const xml = wrapFeed(makeItem('テスト記事', 'https://example.com/1', '概要テキスト'));
      const articles = parseFeed(xml);
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('テスト記事');
      expect(articles[0].url).toBe('https://example.com/1');
      expect(articles[0].description).toBe('概要テキスト');
    });

    it('複数のアイテムを正しく処理する', () => {
      const xml = wrapFeed(
        makeItem('記事1', 'https://example.com/1') +
        makeItem('記事2', 'https://example.com/2') +
        makeItem('記事3', 'https://example.com/3')
      );
      const articles = parseFeed(xml);
      expect(articles).toHaveLength(3);
      expect(articles.map((a) => a.title)).toEqual(['記事1', '記事2', '記事3']);
    });

    it('titleがない<item>はスキップされる', () => {
      const xml = wrapFeed(`<item><link>https://example.com/1</link></item>`);
      expect(parseFeed(xml)).toHaveLength(0);
    });

    it('linkがない<item>はスキップされる', () => {
      const xml = wrapFeed(`<item><title>タイトルのみ</title></item>`);
      expect(parseFeed(xml)).toHaveLength(0);
    });

    it('空のXMLは空配列を返す', () => {
      expect(parseFeed('')).toEqual([]);
    });

    it('<item>が存在しないXMLは空配列を返す', () => {
      expect(parseFeed('<rss><channel></channel></rss>')).toEqual([]);
    });
  });

  describe('HTMLエンティティのデコード', () => {
    it('&amp; を & にデコードする', () => {
      const xml = wrapFeed(makeItem('A &amp; B', 'https://example.com/1'));
      expect(parseFeed(xml)[0].title).toBe('A & B');
    });

    it('&lt; &gt; をデコードする', () => {
      const xml = wrapFeed(makeItem('&lt;テスト&gt;', 'https://example.com/1'));
      expect(parseFeed(xml)[0].title).toBe('<テスト>');
    });

    it('&quot; をデコードする', () => {
      const xml = wrapFeed(makeItem('&quot;引用&quot;', 'https://example.com/1'));
      expect(parseFeed(xml)[0].title).toBe('"引用"');
    });

    it('&#39; と &apos; をデコードする', () => {
      const xml = wrapFeed(makeItem("it&#39;s &apos;ok&apos;", 'https://example.com/1'));
      expect(parseFeed(xml)[0].title).toBe("it's 'ok'");
    });
  });

  describe('CDATAセクションの処理', () => {
    it('タイトルのCDATAを処理できる', () => {
      const xml = wrapFeed(`
        <item>
          <title><![CDATA[CDATAタイトル & 特殊文字]]></title>
          <link>https://example.com/1</link>
        </item>`);
      expect(parseFeed(xml)[0].title).toBe('CDATAタイトル & 特殊文字');
    });

    it('descriptionのCDATAを処理できる', () => {
      const xml = wrapFeed(`
        <item>
          <title>記事</title>
          <link>https://example.com/1</link>
          <description><![CDATA[<p>HTML概要</p>]]></description>
        </item>`);
      expect(parseFeed(xml)[0].description).toBe('<p>HTML概要</p>');
    });
  });

  describe('画像URL抽出', () => {
    it('media:thumbnail から画像URLを抽出する', () => {
      const extra = '<media:thumbnail url="https://img.example.com/thumb.jpg"/>';
      const xml = wrapFeed(makeItem('記事', 'https://example.com/1', '', extra));
      expect(parseFeed(xml)[0].imageUrl).toBe('https://img.example.com/thumb.jpg');
    });

    it('media:content（imageタイプ）から画像URLを抽出する', () => {
      const extra = '<media:content url="https://img.example.com/img.jpg" type="image/jpeg"/>';
      const xml = wrapFeed(makeItem('記事', 'https://example.com/1', '', extra));
      expect(parseFeed(xml)[0].imageUrl).toBe('https://img.example.com/img.jpg');
    });

    it('enclosure（imageタイプ）から画像URLを抽出する', () => {
      const extra = '<enclosure url="https://img.example.com/img.png" type="image/png"/>';
      const xml = wrapFeed(makeItem('記事', 'https://example.com/1', '', extra));
      expect(parseFeed(xml)[0].imageUrl).toBe('https://img.example.com/img.png');
    });

    it('画像タグがない場合は imageUrl が undefined', () => {
      const xml = wrapFeed(makeItem('記事', 'https://example.com/1'));
      expect(parseFeed(xml)[0].imageUrl).toBeUndefined();
    });
  });
});
