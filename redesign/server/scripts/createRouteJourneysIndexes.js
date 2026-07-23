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
  const collection = db.collection('route_journeys');

  console.log('Membuat indeks untuk koleksi route_journeys...');

  // 1. Unique index on journey_id
  await collection.createIndex({ journey_id: 1 }, { unique: true, name: 'journey_id_unique' });

  // 2. Index on vehicle_nopol and status
  await collection.createIndex({ vehicle_nopol: 1, status: 1 }, { name: 'vehicle_nopol_status' });

  // 3. Index on route_id and journey_date
  await collection.createIndex({ route_id: 1, journey_date: 1 }, { name: 'route_id_journey_date' });

  console.log('Indeks route_journeys berhasil dibuat!');
  await DbConnection.disconnect();
}

createIndexes().catch(err => {
  console.error('Error saat membuat indeks:', err);
  process.exit(1);
});
