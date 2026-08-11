import DbConnection from '../config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createIndexes() {
  const connFile = path.join(__dirname, '..', 'config', 'connections.json');
  const connections = JSON.parse(fs.readFileSync(connFile, 'utf8'));

  let connected = false;
  for (const conn of connections) {
    try {
      await DbConnection.connect(conn);
      connected = true;
      break;
    } catch (e) {
      console.error(`Gagal menghubungkan ke ${conn.name || conn.uri}:`, e.message);
    }
  }

  if (!connected) {
    console.error('Koneksi ke database MongoDB gagal.');
    process.exit(1);
  }

  const db = await DbConnection.getDb();

  console.log('Membuat indeks database untuk Package Tracking & Daily Operation...');

  // Helper to create index safely
  const safeCreateIndex = async (col, spec, options) => {
    try {
      await col.createIndex(spec, options);
    } catch (e) {
      if (e.code === 85 || e.codeName === 'IndexOptionsConflict') {
        console.log(`ℹ️ Indeks pada ${col.collectionName} sudah ada (${JSON.stringify(spec)}).`);
      } else {
        console.warn(`⚠️ Warning saat buat indeks pada ${col.collectionName}:`, e.message);
      }
    }
  };

  // 1. tracking_events
  const colTracking = db.collection('tracking_events');
  await safeCreateIndex(colTracking, { event_id: 1 }, { unique: true, name: 'event_id_unique', sparse: true });
  await safeCreateIndex(colTracking, { import_batch_id: 1 }, { name: 'import_batch_id_idx' });
  await safeCreateIndex(colTracking, { connote_code: 1, event_datetime: -1 }, { name: 'connote_datetime_idx' });
  await safeCreateIndex(colTracking, { route_code: 1, event_datetime: -1 }, { name: 'route_datetime_idx' });
  console.log('✅ Indeks tracking_events selesai diproses.');

  // 2. transaksi
  const colTx = db.collection('transaksi');
  await safeCreateIndex(colTx, { connote_code: 1 }, { name: 'connote_code_idx' });
  await safeCreateIndex(colTx, { 'connote.connote_code': 1 }, { name: 'nested_connote_code_idx' });
  await safeCreateIndex(colTx, { import_batch_id: 1 }, { name: 'tx_import_batch_id_idx' });
  console.log('✅ Indeks transaksi selesai diproses.');

  // 3. route_journeys
  const colJourneys = db.collection('route_journeys');
  await safeCreateIndex(colJourneys, { journey_id: 1 }, { unique: true, name: 'journey_id_unique' });
  await safeCreateIndex(colJourneys, { journey_date: 1, vehicle_nopol: 1 }, { name: 'journey_date_vehicle_idx' });
  await safeCreateIndex(colJourneys, { vehicle_nopol: 1, status: 1 }, { name: 'vehicle_status_idx' });
  console.log('✅ Indeks route_journeys selesai diproses.');

  // 4. detail_route
  const colDetailRoute = db.collection('detail_route');
  await safeCreateIndex(colDetailRoute, { route_id: 1, seq: 1 }, { name: 'route_id_seq_idx' });
  console.log('✅ Indeks detail_route selesai diproses.');

  console.log('🚀 Seluruh indeks database berhasil dibuat!');
  await DbConnection.disconnect();
}

createIndexes().catch(err => {
  console.error('Error saat membuat indeks:', err);
  process.exit(1);
});
