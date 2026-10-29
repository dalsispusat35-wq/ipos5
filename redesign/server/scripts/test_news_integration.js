import DbConnection from '../config/DbConnection.js';
import NewsModel from '../models/NewsModel.js';
import NewsScraperService from '../services/NewsScraperService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runNewsIntegrationTest() {
  console.log('🧪 [Test] Starting News Feed Backend Integration Test...');

  // 1. Connect to DB
  const connFile = path.join(__dirname, '../config/connections.json');
  const conns = JSON.parse(fs.readFileSync(connFile, 'utf8'));
  console.log(`🔌 [Test] Connecting to DB: ${conns[0].name}...`);
  await DbConnection.connect(conns[0]);

  // 2. Test Scraping
  console.log('📰 [Test] Scraping RSS Feed from Google News...');
  const scrapeResult = await NewsScraperService.scrapeNews();
  console.log('✅ [Test] Scrape Result:', scrapeResult);

  // 3. Test NewsModel.getAll
  const allNews = await NewsModel.getAll({ limit: 5 });
  console.log(`📋 [Test] NewsModel.getAll (top 5): Retrieved ${allNews.length} items.`);
  if (allNews.length > 0) {
    console.log('Sample news item:', {
      _id: allNews[0]._id,
      title: allNews[0].title,
      sourceName: allNews[0].sourceName,
      imageUrl: allNews[0].imageUrl,
      isManual: allNews[0].isManual,
      publishedAt: allNews[0].publishedAt
    });
  }

  // 4. Test NewsModel.create (Manual)
  console.log('✍️ [Test] Creating a manual test news item...');
  const createRes = await NewsModel.create({
    title: '[TEST] PT Pos Indonesia Perluas Jangkauan Layanan Logistik Nasional',
    summary: 'Uji coba penambahan berita manual oleh admin sistem IPOS5.',
    sourceUrl: 'https://posindonesia.co.id',
    sourceName: 'Humas POSIND (Test)',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    publishedAt: new Date(),
    isManual: true
  });
  const testId = createRes.insertedId;
  console.log('✅ [Test] Manual News Created with ID:', testId);

  // 5. Test NewsModel.getById
  const fetchedTest = await NewsModel.getById(testId);
  console.log('🔍 [Test] NewsModel.getById:', fetchedTest ? fetchedTest.title : 'NOT FOUND');

  // 6. Test NewsModel.update
  console.log('✏️ [Test] Updating test news item...');
  await NewsModel.update(testId, {
    title: '[TEST UPDATED] PT Pos Indonesia Perluas Jangkauan Layanan Logistik Terpadu'
  });
  const updatedTest = await NewsModel.getById(testId);
  console.log('🔍 [Test] After Update Title:', updatedTest ? updatedTest.title : 'NOT FOUND');

  // 7. Test NewsModel.delete
  console.log('🗑️ [Test] Deleting test news item...');
  await NewsModel.delete(testId);
  const afterDelete = await NewsModel.getById(testId);
  console.log('🔍 [Test] After Delete Check:', afterDelete === null ? 'SUCCESS (Deleted)' : 'FAILED');

  const finalTotal = await NewsModel.count();
  console.log(`📊 [Test] Final Total News in DB: ${finalTotal}`);

  await DbConnection.disconnect();
  console.log('🎉 [Test] All News Integration Tests Passed Successfully!');
}

runNewsIntegrationTest().catch((err) => {
  console.error('❌ [Test Error]:', err);
  process.exit(1);
});
