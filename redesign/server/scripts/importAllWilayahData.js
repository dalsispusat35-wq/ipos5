import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import DbConnection from '../config/DbConnection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = 'C:/Users/Asus/Documents/POSIND/wilayah-master/db';

async function main() {
  console.log('Reading data from wilayah-master/db...');

  // 1. Luas
  const luasFile = path.join(SOURCE_DIR, 'wilayah_luas.sql');
  const luasMap = new Map();
  if (fs.existsSync(luasFile)) {
    const luasText = fs.readFileSync(luasFile, 'utf-8');
    const regex = /\('([^']+)',\s*'([^']*)',\s*([0-9.]+)\)/g;
    let match;
    while ((match = regex.exec(luasText)) !== null) {
      luasMap.set(match[1].trim(), parseFloat(match[3]));
    }
  }
  console.log(`Loaded ${luasMap.size} luas records.`);

  // 2. Penduduk
  const pendFile = path.join(SOURCE_DIR, 'wilayah_penduduk.sql');
  const pendMap = new Map();
  if (fs.existsSync(pendFile)) {
    const pendText = fs.readFileSync(pendFile, 'utf-8');
    const regex = /\('([^']+)',\s*'([^']*)',\s*'([0-9]+)',\s*'([0-9]+)',\s*'([0-9]+)'\)/g;
    let match;
    while ((match = regex.exec(pendText)) !== null) {
      pendMap.set(match[1].trim(), {
        pria: parseInt(match[3], 10),
        wanita: parseInt(match[4], 10),
        total: parseInt(match[5], 10)
      });
    }
  }
  console.log(`Loaded ${pendMap.size} penduduk records.`);

  // 3. Pulau
  const pulauFile = path.join(SOURCE_DIR, 'wilayah_pulau.sql');
  const pulauList = [];
  if (fs.existsSync(pulauFile)) {
    const pulauText = fs.readFileSync(pulauFile, 'utf-8');
    const regex = /\('([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*([0-9.]+|NULL),\s*'([^']*)'\)/g;
    let match;
    while ((match = regex.exec(pulauText)) !== null) {
      const lat = match[3] ? parseFloat(match[3]) : null;
      const lng = match[4] ? parseFloat(match[4]) : null;
      const luas = match[6] !== 'NULL' ? parseFloat(match[6]) : null;
      pulauList.push({
        kode: match[1].trim(),
        nama: match[2].trim(),
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        status: match[5].trim(),
        luas
      });
    }
  }
  console.log(`Loaded ${pulauList.length} pulau records.`);

  // Connect to DB
  const profile = DbConnection.loadConnections()[0];
  await DbConnection.connect(profile);
  const db = await DbConnection.getDb();

  // Update master_wilayah with luas & penduduk
  const allCodes = new Set([...luasMap.keys(), ...pendMap.keys()]);
  const bulkOps = [];
  for (const kode of allCodes) {
    const setObj = {};
    if (luasMap.has(kode)) setObj.luas = luasMap.get(kode);
    if (pendMap.has(kode)) setObj.penduduk = pendMap.get(kode);
    if (Object.keys(setObj).length > 0) {
      bulkOps.push({
        updateOne: {
          filter: { kode },
          update: { $set: setObj }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    console.log(`Updating ${bulkOps.length} documents in master_wilayah...`);
    const res = await db.collection('master_wilayah').bulkWrite(bulkOps, { ordered: false });
    console.log(`Updated master_wilayah: matched=${res.matchedCount}, modified=${res.modifiedCount}`);
  }

  // Also update master_wilayah_geometry
  if (bulkOps.length > 0) {
    console.log(`Updating ${bulkOps.length} documents in master_wilayah_geometry...`);
    const resGeom = await db.collection('master_wilayah_geometry').bulkWrite(bulkOps, { ordered: false });
    console.log(`Updated master_wilayah_geometry: matched=${resGeom.matchedCount}, modified=${resGeom.modifiedCount}`);
  }

  // Upsert master_wilayah_pulau
  if (pulauList.length > 0) {
    console.log(`Writing ${pulauList.length} pulau records to master_wilayah_pulau...`);
    const pulauOps = pulauList.map(p => ({
      updateOne: {
        filter: { kode: p.kode },
        update: { $set: p },
        upsert: true
      }
    }));
    const resPulau = await db.collection('master_wilayah_pulau').bulkWrite(pulauOps, { ordered: false });
    console.log(`Upserted pulau: matched=${resPulau.matchedCount}, upserted=${resPulau.upsertedCount}`);
    await db.collection('master_wilayah_pulau').createIndex({ kode: 1 }, { unique: true });
    await db.collection('master_wilayah_pulau').createIndex({ nama: 1 });
  }

  await DbConnection.disconnect();
  console.log('ALL DATA FROM WILAYAH-MASTER SUCCESSFULLY IMPORTED TO MONGODB!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
