import DbConnection from '../config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONNECTIONS_FILE = path.join(__dirname, '..', 'config', 'connections.json');

async function main() {
  const connections = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, 'utf8'));
  let connected = false;

  for (const conn of connections) {
    console.log(`Menghubungkan ke ${conn.name}...`);
    try {
      await DbConnection.connect(conn);
      connected = true;
      break;
    } catch (e) {
      // ignore
    }
  }

  if (!connected) {
    console.error('Koneksi ke database gagal.');
    process.exit(1);
  }

  const db = await DbConnection.getDb();
  console.log('Database terhubung. Mulai membuat indeks...');

  // 1. Indeks Koleksi transaksi
  console.log('Membuat indeks untuk koleksi transaksi...');
  await db.collection('transaksi').createIndex({ "connote.connote_code": 1 });
  await db.collection('transaksi').createIndex({ "connote.connote_booking_code": 1 });
  await db.collection('transaksi').createIndex({ "connote.connote_state": 1 });
  await db.collection('transaksi').createIndex({ "connote.connote_service": 1 });
  await db.collection('transaksi').createIndex({ "connote.created_at": -1 });
  await db.collection('transaksi').createIndex({ "location_data_created.custom_field.destination_nopen": 1 });
  await db.collection('transaksi').createIndex({ "location_data_created.custom_field.destination_kprk": 1 });
  await db.collection('transaksi').createIndex({ "location_data_created.custom_field.destination_reg": 1 });
  await db.collection('transaksi').createIndex({ "custom_field.destination_nopen": 1 });
  await db.collection('transaksi').createIndex({ "custom_field.destination_kprk": 1 });
  await db.collection('transaksi').createIndex({ "custom_field.destination_reg": 1 });
  await db.collection('transaksi').createIndex({ "currentLocation.name": 1 });

  // 2. Indeks Koleksi master_kantor
  console.log('Membuat indeks untuk koleksi master_kantor...');
  await db.collection('master_kantor').createIndex({ "nopend": 1 });
  await db.collection('master_kantor').createIndex({ "nama_nopend": 1 });

  // 3. Indeks Koleksi master_kendaraan
  console.log('Membuat indeks untuk koleksi master_kendaraan...');
  await db.collection('master_kendaraan').createIndex({ "nopol": 1 });
  await db.collection('master_kendaraan').createIndex({ "kendaraan_id": 1 });

  // 4. Indeks Koleksi detail_route
  console.log('Membuat indeks untuk koleksi detail_route...');
  await db.collection('detail_route').createIndex({ "route_id": 1, "seq": 1 });

  // 5. Indeks Koleksi jadwal_transportasi
  console.log('Membuat indeks untuk koleksi jadwal_transportasi...');
  await db.collection('jadwal_transportasi').createIndex({ "nopol": 1 });
  await db.collection('jadwal_transportasi').createIndex({ "route_id": 1 });
  await db.collection('jadwal_transportasi').createIndex({ "tanggal": 1 });

  console.log('Semua indeks berhasil dibuat/diperbarui.');
  await DbConnection.disconnect();
}

main().catch(console.error);
