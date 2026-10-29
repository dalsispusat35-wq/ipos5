import NewsScraperService from '../services/NewsScraperService.js';
import Parser from 'rss-parser';

async function testRss() {
  console.log('Testing RSS feed parser directly...');
  const parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent', { keepArray: true }],
        ['enclosure', 'enclosure'],
        ['source', 'source']
      ]
    }
  });

  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=PT+Pos+Indonesia&hl=id&gl=ID&ceid=ID:id');
    console.log(`Feed Title: ${feed.title}`);
    console.log(`Total items retrieved: ${feed.items?.length}`);
    if (feed.items?.length > 0) {
      console.log('Sample item 0:', {
        title: feed.items[0].title,
        link: feed.items[0].link,
        pubDate: feed.items[0].pubDate,
        source: feed.items[0].source,
        parsed: NewsScraperService.parseTitleAndSource(feed.items[0].title, feed.items[0].source),
        imageUrl: NewsScraperService.extractImageUrl(feed.items[0], 0)
      });
    }
  } catch (e) {
    console.error('RSS test error:', e);
  }
}

testRss();
