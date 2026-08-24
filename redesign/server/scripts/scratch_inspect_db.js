import DbConnection from '../config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inspect() {
  const connections = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'connections.json'), 'utf8'));
  for (const conn of connections) {
    try { await DbConnection.connect(conn); break; } catch (e) {}
  }
  const db = await DbConnection.getDb();
  
  const gpsUpdates = [
    { nopend: '40500', lat: -6.8722, lng: 107.5422, nama: 'KC Cimahi (40500)', jenis: 'Kantor Cabang', tipe: 'KC', alamat: 'Jl. Gatot Subroto No. 1 Cimahi' },
    { nopend: '40141C3', lat: -6.8791, lng: 107.6048, nama: 'UNPAR Ciumbuleuit (Agenpos)', jenis: 'Agenpos Mitra', tipe: 'AGENPOS', alamat: 'Jl. Ciumbuleuit No. 94 Bandung' },
    { nopend: '40135', lat: -6.8835, lng: 107.6142, nama: 'Dago (KCP)', jenis: 'Kantor Cabang Pembantu', tipe: 'KCP', alamat: 'Jl. Ir. H. Juanda No. 183 Dago' },
    { nopend: '40512', lat: -6.8920, lng: 107.5580, nama: 'Cimindi (KCP)', jenis: 'Kantor Cabang Pembantu', tipe: 'KCP', alamat: 'Jl. Raya Cimindi No. 120 Cimahi' }
  ];

  for (const u of gpsUpdates) {
    await db.collection('master_kantor').updateOne(
      { nopend: u.nopend },
      { $set: { latitude: u.lat, longitude: u.lng, nama_nopend: u.nama, jenis_kantor: u.jenis, tipe: u.tipe, alamat: u.alamat, is_real_verified: true, priority: 1 } },
      { upsert: true }
    );
  }

  console.log('GPS updates applied successfully!');
  process.exit(0);
}

inspect();
