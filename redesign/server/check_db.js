import DbConnection from './config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONNECTIONS_FILE = path.join(__dirname, 'config', 'connections.json');

async function main() {
  const connections = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, 'utf8'));
  let connected = false;

  for (const conn of connections) {
    try {
      await DbConnection.connect(conn);
      connected = true;
      break;
    } catch (e) {
      // ignore
    }
  }

  if (!connected) {
    console.error('Semua koneksi database gagal.');
    process.exit(1);
  }

  const db = await DbConnection.getDb();
  
  // Find candidates specifically
  const candidates = ['AGP Siliwangi', 'AGP Artajati', 'AGP Ciskul', 'AGP Omega', 'AGP ONG'];
  const results = {};
  
  for (const name of candidates) {
    const cleanName = name.toLowerCase().trim().replace(/[._/\\-]+/g, ' ').replace(/\s+/g, ' ');
    // Try some regexes
    const matches = await db.collection('master_kantor').find({
      $or: [
        { nama_nopend: new RegExp(cleanName, 'i') },
        { nama_nopend: new RegExp(name.replace('AGP ', ''), 'i') }
      ]
    }).toArray();
    results[name] = matches.map(m => ({ nopend: m.nopend, nama_nopend: m.nama_nopend, status: m.status }));
  }

  // Get a sample transaction
  const sampleTx = await db.collection('transaksi').findOne({});

  // Get indexes for all
  const indexes = {};
  const collections = ['transaksi', 'master_kantor', 'master_kendaraan', 'detail_route', 'jadwal_transportasi'];
  for (const colName of collections) {
    try {
      const idxs = await db.collection(colName).listIndexes().toArray();
      indexes[colName] = idxs;
    } catch (e) {
      indexes[colName] = { error: e.message };
    }
  }

  // Write to output file
  const report = {
    count: await db.collection('transaksi').countDocuments({}),
    candidates: results,
    sampleTx,
    indexes
  };

  fs.writeFileSync(path.join(__dirname, 'check_db_output.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Report written to check_db_output.json successfully!');
  await DbConnection.disconnect();
}

main().catch(console.error);
