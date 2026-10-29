import Parser from 'rss-parser';
import cron from 'node-cron';
import NewsModel from '../models/NewsModel.js';
import DbConnection from '../config/DbConnection.js';

const RSS_FEED_URL = 'https://news.google.com/rss/search?q=PT+Pos+Indonesia&hl=id&gl=ID&ceid=ID:id';

// Curated high quality POSIND & logistics stock images for news without thumbnail
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80'
];

class NewsScraperService {
  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: true }],
          ['enclosure', 'enclosure'],
          ['source', 'source']
        ]
      }
    });
    this.cronTask = null;
    this.isScraping = false;
  }

  // Clean HTML tags and entities from string
  cleanText(text) {
    if (!text) return '';
    return String(text)
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // Extract source name and clean title
  parseTitleAndSource(rawTitle, rawSource) {
    let title = rawTitle ? this.cleanText(rawTitle) : 'Berita PT Pos Indonesia';
    let sourceName = 'PT Pos Indonesia';

    if (rawSource) {
      if (typeof rawSource === 'string') {
        sourceName = rawSource.trim();
      } else if (rawSource._ || rawSource.content) {
        sourceName = (rawSource._ || rawSource.content).trim();
      }
    }

    // Google News RSS titles usually end with " - Source Name"
    const match = title.match(/^(.*?)\s*-\s*([^-\n]+)$/);
    if (match) {
      title = match[1].trim();
      if (!rawSource) {
        sourceName = match[2].trim();
      }
    }

    return { title, sourceName };
  }

  // Extract thumbnail image from RSS item or pick consistent fallback
  extractImageUrl(item, index) {
    // 1. Check enclosure tag
    if (item.enclosure && item.enclosure.url && item.enclosure.url.startsWith('http')) {
      return item.enclosure.url;
    }

    // 2. Check media:content
    if (Array.isArray(item.mediaContent) && item.mediaContent.length > 0) {
      const media = item.mediaContent[0];
      if (media && media.$ && media.$.url) {
        return media.$.url;
      }
      if (typeof media === 'string' && media.startsWith('http')) {
        return media;
      }
    }

    // 3. Check <img> tags inside content or description
    const content = item['content:encoded'] || item.content || item.description || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1] && imgMatch[1].startsWith('http')) {
      return imgMatch[1];
    }

    // 4. Return rotating fallback image based on index/title hash
    const hash = (item.title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const chosenIndex = (hash + index) % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[chosenIndex];
  }

  // Execute scrape operation
  async scrapeNews() {
    if (this.isScraping) {
      console.log('⏳ [NewsScraper] Scraping already in progress. Skipping...');
      return { success: false, message: 'Scraping is already in progress' };
    }

    if (!DbConnection.isConnected()) {
      console.log('⚠️ [NewsScraper] Database is not connected. Aborting RSS scraping.');
      return { success: false, message: 'DATABASE_NOT_CONNECTED' };
    }

    this.isScraping = true;
    console.log(`🌐 [NewsScraper] Fetching Google News RSS from: ${RSS_FEED_URL}`);

    try {
      const feed = await this.parser.parseURL(RSS_FEED_URL);
      const items = feed.items || [];
      console.log(`📰 [NewsScraper] Found ${items.length} items from Google News feed.`);

      let insertedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const sourceUrl = (item.link || item.guid || '').trim();
        if (!sourceUrl) continue;

        // Check duplicate based on source URL
        const existing = await NewsModel.findBySourceUrl(sourceUrl);
        if (existing) {
          skippedCount++;
          continue;
        }

        const { title, sourceName } = this.parseTitleAndSource(item.title, item.source);
        const summary = this.cleanText(item.contentSnippet || item.summary || item.content || title);
        const imageUrl = this.extractImageUrl(item, i);
        
        let publishedAt = new Date();
        if (item.isoDate) {
          publishedAt = new Date(item.isoDate);
        } else if (item.pubDate) {
          publishedAt = new Date(item.pubDate);
        }

        await NewsModel.create({
          title,
          imageUrl,
          summary: summary.slice(0, 300),
          sourceUrl,
          sourceName,
          publishedAt,
          isManual: false
        });

        insertedCount++;
      }

      const totalInDb = await NewsModel.count();
      console.log(`✅ [NewsScraper] Scrape finished: ${insertedCount} inserted, ${skippedCount} skipped (already exists). Total news in DB: ${totalInDb}`);

      return {
        success: true,
        message: `Scrape selesai: ${insertedCount} berita baru ditambahkan, ${skippedCount} berita sudah ada.`,
        data: {
          insertedCount,
          skippedCount,
          totalInDb
        }
      };
    } catch (error) {
      console.error('❌ [NewsScraper] Error scraping Google News RSS:', error.message);
      return {
        success: false,
        message: `Gagal mengambil berita RSS: ${error.message}`
      };
    } finally {
      this.isScraping = false;
    }
  }

  // Initialize background cron scheduler (every 3 hours)
  initScheduler() {
    if (this.cronTask) {
      console.log('⏰ [NewsScraper] Scheduler is already active.');
      return;
    }

    console.log('⏰ [NewsScraper] Initializing cron schedule (Every 3 hours: 0 */3 * * *)');
    
    // Schedule every 3 hours
    this.cronTask = cron.schedule('0 */3 * * *', async () => {
      console.log('⏰ [NewsScraper] Triggering scheduled 3-hour news scrape...');
      await this.scrapeNews();
    });

    // Run once on startup after a short delay (e.g., 3 seconds) to allow DB connection to stabilize
    setTimeout(async () => {
      if (DbConnection.isConnected()) {
        console.log('🚀 [NewsScraper] Running initial news scrape on server start...');
        await this.scrapeNews();
      }
    }, 3000);
  }
}

export default new NewsScraperService();
