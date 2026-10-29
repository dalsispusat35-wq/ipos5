import 'dotenv/config';
import fs from 'node:fs/promises';
import { MongoClient } from 'mongodb';
import { fromSourceGeometry } from '../services/KantorWilayahGeometry.js';

const root = new URL('../data/kantor-wilayah/', import.meta.url);
const rows = JSON.parse(await fs.readFile(new URL('wilayah.json', root), 'utf8'));
const shapes = JSON.parse(await fs.readFile(new URL('geometry.json', root), 'utf8'));
const profiles = JSON.parse(await fs.readFile(new URL('../config/connections.json', import.meta.url), 'utf8'));
const profile = process.env.KANTOR_WILAYAH_CONNECTION_ID
  ? profiles.find(item => item.id === process.env.KANTOR_WILAYAH_CONNECTION_ID) : profiles[0];
if (!profile) throw new Error('Profil MongoDB tidak ditemukan');
const client = new MongoClient(profile.uri, { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
  const db = client.db(profile.database);
  const collection = db.collection('master_wilayah');
  const geometryCollection = db.collection('master_wilayah_geometry');
  const ids = new Set(rows.map(([kode]) => kode));
  const documents = rows.map(([kode, nama]) => {
    const parts = kode.split('.');
    const parent = parts.length > 1 ? parts.slice(0, -1).join('.') : null;
    if (parent && !ids.has(parent)) throw new Error(`Parent hilang: ${kode}`);
    return { _id: kode, kode, nama, level: parts.length, parent,
      ancestors: parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('.')),
      source: 'wilayah-master/db/wilayah.sql' };
  });
  if (ids.size !== documents.length) throw new Error('Kode duplikat');
  // Idempotent upserts; office collection and unrelated data are never rewritten.
  for (let offset = 0; offset < documents.length; offset += 1000) {
    await collection.bulkWrite(documents.slice(offset, offset + 1000).map(doc => ({ updateOne: {
      filter: { _id: doc._id }, update: { $set: doc }, upsert: true
    } })), { ordered: false });
  }
  let boundaries = 0;
  for (const [kode, entry] of Object.entries(shapes)) {
    const source = documents.find(doc => doc.kode === kode);
    if (!source) continue;
    const converted = fromSourceGeometry(entry);
    if (converted) boundaries++;
    const doc = { _id: kode, kode, nama: source.nama, level: source.level, parent: source.parent,
      center: entry.lat == null || entry.lng == null ? null : [entry.lat, entry.lng],
      geometry: converted?.geometry || null, bounds: converted?.bounds || null,
      source: 'wilayah-master/db/wilayah_level_1_2.sql' };
    await geometryCollection.updateOne({ _id: kode }, { $set: doc }, { upsert: true });
  }
  await collection.createIndex({ kode: 1 }, { unique: true });
  await collection.createIndex({ parent: 1, nama: 1 });
  await collection.createIndex({ level: 1 });
  await geometryCollection.createIndex({ parent: 1 });
  await geometryCollection.createIndex({ 'bounds.west': 1, 'bounds.east': 1, 'bounds.south': 1, 'bounds.north': 1 });
  const counts = await collection.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray();
  console.log(JSON.stringify({ database: db.databaseName, imported: documents.length, boundaries, counts }));
} finally { await client.close(); }
