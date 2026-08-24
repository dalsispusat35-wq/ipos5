import DbConnection from '../config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const connections = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'connections.json'), 'utf8'));
  for (const conn of connections) {
    try { await DbConnection.connect(conn); break; } catch (e) {}
  }
  const db = await DbConnection.getDb();

  const realCodes = [
    '40000', '40500', '40400', '40100', '40511A', '40511CB', '40511U3', 
    '40511CA', '40511U1', '40511U4', '40512', '40114A', '40115A', '40115B', 
    '40116A', '40122B', '40123A', '40135', '40141C3'
  ];

  // 1. Tag 19 real verified offices with priority 1
  const updateRealRes = await db.collection('master_kantor').updateMany(
    { nopend: { $in: realCodes } },
    { $set: { is_real_verified: true, is_operational_hub: true, priority: 1, provinsi: 'JAWA BARAT' } }
  );
  console.log(`Tagged ${updateRealRes.modifiedCount} real verified offices.`);

  // 2. Clean up scientific notation strings in nopend
  const sciDocs = await db.collection('master_kantor').find({ nopend: { $regex: /E\+|e\+/i } }).toArray();
  console.log(`Found ${sciDocs.length} scientific notation records to clean up.`);

  for (const doc of sciDocs) {
    const match = doc.nama_nopend?.match(/\b(\d{5}[A-Za-z0-9]*)\b/);
    const cleaned = match ? match[1] : `99${String(doc._id).slice(-4)}`;
    await db.collection('master_kantor').updateOne(
      { _id: doc._id },
      { $set: { nopend: cleaned, is_legacy_sci: true, original_nopend: doc.nopend } }
    );
  }

  // 3. Ensure every document has status
  await db.collection('master_kantor').updateMany(
    { status: { $exists: false } },
    { $set: { status: 'AKTIF' } }
  );

  // 4. Update tipe / branch type for non-typed records based on office name
  const allDocs = await db.collection('master_kantor').find({
    $or: [{ jenis_kantor: { $exists: false } }, { jenis_kantor: '' }, { jenis_kantor: null }]
  }).limit(5000).toArray();

  for (const d of allDocs) {
    const nameUpper = String(d.nama_nopend || '').toUpperCase();
    let tipe = 'KCP';
    let jenis = 'Kantor Cabang Pembantu';
    if (nameUpper.includes('KCU') || nameUpper.includes('REGIONAL')) {
      tipe = 'KCU';
      jenis = 'Kantor Cabang Utama';
    } else if (nameUpper.includes('KC ') || nameUpper.startsWith('KC')) {
      tipe = 'KC';
      jenis = 'Kantor Cabang';
    } else if (nameUpper.includes('AGEN') || nameUpper.includes('AGP')) {
      tipe = 'AGENPOS';
      jenis = 'Agenpos Mitra';
    } else if (nameUpper.includes('SPP') || nameUpper.includes('SENTRAL') || nameUpper.includes('DC')) {
      tipe = 'SPP_DC';
      jenis = 'Sentral Pengolahan Pos / DC';
    } else if (nameUpper.includes('KPRK')) {
      tipe = 'KPRK';
      jenis = 'Kantor Pos Pemeriksa (KPRK)';
    }

    await db.collection('master_kantor').updateOne(
      { _id: d._id },
      { $set: { tipe_kantor: jenis, jenis_kantor: jenis, tipe: tipe } }
    );
  }

  console.log('Sanitization and tagging finished successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
