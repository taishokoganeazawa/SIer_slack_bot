import * as fs from 'fs';
import { loadPostedUrls, savePostedUrls, filterNewArticles } from '../urlStore';
import { Article } from '../rss';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;
const readFileSyncMock = mockFs.readFileSync as jest.Mock;

function makeArticle(url: string): Article {
  return { title: 'テスト記事', url, description: '' };
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('filterNewArticles', () => {
  it('未投稿の記事のみ返す', () => {
    const articles = [
      makeArticle('https://example.com/new'),
      makeArticle('https://example.com/posted'),
    ];
    const result = filterNewArticles(articles, ['https://example.com/posted']);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com/new');
  });

  it('全て投稿済みの場合は空配列を返す', () => {
    const articles = [makeArticle('https://example.com/a')];
    expect(filterNewArticles(articles, ['https://example.com/a'])).toHaveLength(0);
  });

  it('postedUrlsが空の場合は全件返す', () => {
    const articles = [
      makeArticle('https://example.com/a'),
      makeArticle('https://example.com/b'),
    ];
    expect(filterNewArticles(articles, [])).toHaveLength(2);
  });

  it('articlesが空の場合は空配列を返す', () => {
    expect(filterNewArticles([], ['https://example.com/a'])).toHaveLength(0);
  });
});

describe('loadPostedUrls', () => {
  it('フラット配列形式を読み込める', () => {
    readFileSyncMock.mockReturnValue(
      JSON.stringify(['https://example.com/a', 'https://example.com/b'])
    );
    expect(loadPostedUrls()).toEqual(['https://example.com/a', 'https://example.com/b']);
  });

  it('{ urls: [] } 形式を読み込める', () => {
    readFileSyncMock.mockReturnValue(
      JSON.stringify({ urls: ['https://example.com/a'] })
    );
    expect(loadPostedUrls()).toEqual(['https://example.com/a']);
  });

  it('ファイルが存在しない場合は空配列を返す', () => {
    readFileSyncMock.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });
    expect(loadPostedUrls()).toEqual([]);
  });

  it('不正なJSONの場合は空配列を返す', () => {
    readFileSyncMock.mockReturnValue('invalid-json');
    expect(loadPostedUrls()).toEqual([]);
  });

  it('空のファイルの場合は空配列を返す', () => {
    readFileSyncMock.mockReturnValue('');
    expect(loadPostedUrls()).toEqual([]);
  });
});

describe('savePostedUrls', () => {
  beforeEach(() => {
    mockFs.writeFileSync.mockImplementation(() => undefined);
  });

  it('URLを { urls: [...] } 形式で保存する', () => {
    savePostedUrls(['https://example.com/a']);
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    const writtenContent = (mockFs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenContent);
    expect(parsed.urls).toEqual(['https://example.com/a']);
  });

  it('1,000件以内はそのまま保存される', () => {
    const urls = Array.from({ length: 100 }, (_, i) => `https://example.com/${i}`);
    savePostedUrls(urls);
    const writtenContent = (mockFs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
    expect(JSON.parse(writtenContent).urls).toHaveLength(100);
  });

  it('1,001件の場合、最古の1件が削除されて1,000件になる', () => {
    const urls = Array.from({ length: 1001 }, (_, i) => `https://example.com/${i}`);
    savePostedUrls(urls);
    const writtenContent = (mockFs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
    const saved = JSON.parse(writtenContent).urls;
    expect(saved).toHaveLength(1000);
    expect(saved[0]).toBe('https://example.com/1');
    expect(saved[999]).toBe('https://example.com/1000');
  });

  it('空配列を保存できる', () => {
    savePostedUrls([]);
    const writtenContent = (mockFs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
    expect(JSON.parse(writtenContent).urls).toEqual([]);
  });
});
