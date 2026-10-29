import DbConnection from '../config/DbConnection.js';
import { createWilayahIndex } from './KantorWilayahIndex.js';
import { containsPoint, previewGeometry } from './KantorWilayahGeometry.js';

// Cache the immutable reference index per active MongoDB connection.
const indexes = new WeakMap();
async function getIndex() {
  const db = await DbConnection.getDb();
  if (!indexes.has(db)) {
    const loading = db.collection('master_wilayah').find({}, { projection: { kode: 1, nama: 1 } }).toArray().then(rows => {
      if (!rows.length) throw new Error('Master wilayah belum diimpor ke MongoDB. Jalankan importKantorWilayah.js.');
      return createWilayahIndex(rows);
    }).catch(error => { indexes.delete(db); throw error; });
    indexes.set(db, loading);
  }
  return indexes.get(db);
}

async function getOptions(parent = null) {
  const db = await DbConnection.getDb();
  const index = await getIndex();
  if (parent && !index.byCode.has(parent)) throw new Error('Kode wilayah tidak ditemukan');
  const data = await db.collection('master_wilayah').find({ parent }, { projection: { _id: 0, kode: 1, nama: 1, luas: 1, penduduk: 1 } }).sort({ nama: 1 }).toArray();
  return { data, counts: index.counts };
}

function pathToGeoJson(p) {
  if (!Array.isArray(p) || p.length === 0) return null;
  const isNested = Array.isArray(p[0]) && Array.isArray(p[0][0]);
  if (isNested) {
    return {
      type: 'Polygon',
      coordinates: p.map(ring => ring.map(([lat, lng]) => [lng, lat]))
    };
  }
  return {
    type: 'Polygon',
    coordinates: [p.map(([lat, lng]) => [lng, lat])]
  };
}

function computeBoundsFromPath(path) {
  if (!Array.isArray(path) || path.length === 0) return null;
  const flat = Array.isArray(path[0]) && Array.isArray(path[0][0]) ? path.flat(1) : path;
  if (!flat || flat.length === 0) return null;
  const lats = flat.map(pt => Number(pt[0])).filter(Number.isFinite);
  const lngs = flat.map(pt => Number(pt[1])).filter(Number.isFinite);
  if (!lats.length || !lngs.length) return null;
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];
}

async function resolveSpecificLocation(code, chain, db) {
  if (!code) return null;
  const parts = code.split('.');

  // 1. Check in MongoDB master_wilayah_geometry first (cached)
  try {
    const existing = await db.collection('master_wilayah_geometry').findOne({ kode: code });
    if (existing && existing.path && existing.center) {
      return existing;
    }
  } catch (e) {
    // collection query error ignored
  }

  // 2. Fetch specific boundary polygon from Cahya DSN live official service
  try {
    const url = `https://wilayah.cahyadsn.com/apps/inc/geo_ajax.php?id=${encodeURIComponent(code)}&geo=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    const json = await res.json();
    if (json && json.status && json.data && json.data.lat && json.data.lng) {
      const data = json.data;
      let path = data.path;
      if (typeof path === 'string') {
        try { path = JSON.parse(path); } catch (e) { path = null; }
      }
      const lat = Number(data.lat);
      const lng = Number(data.lng);
      const center = [lat, lng];
      const bounds = computeBoundsFromPath(path) || [
        [lat - 0.02, lng - 0.02],
        [lat + 0.02, lng + 0.02]
      ];
      const geometry = pathToGeoJson(path);
      const specificDoc = {
        kode: code,
        nama: data.nama || chain?.desaKelurahan?.nama || chain?.kecamatan?.nama || chain?.kabupatenKota?.nama || chain?.provinsi?.nama,
        level: parts.length,
        center,
        lat,
        lng,
        path,
        geometry,
        bounds,
        luas: data.luas ? Number(data.luas) : null,
        penduduk: data.penduduk ? (typeof data.penduduk === 'object' ? data.penduduk : { total: Number(data.penduduk) }) : null,
        source: 'cahyadsn'
      };

      await db.collection('master_wilayah_geometry').updateOne(
        { kode: code },
        { $set: specificDoc },
        { upsert: true }
      ).catch(() => {});

      if (specificDoc.luas || specificDoc.penduduk) {
        await db.collection('master_wilayah').updateOne(
          { kode: code },
          { $set: { luas: specificDoc.luas, penduduk: specificDoc.penduduk } }
        ).catch(() => {});
      }

      return specificDoc;
    }
  } catch (e) {
    // Network or parse issue, continue to fallback
  }

  // 3. Fallback: Check existing Level 1 or Level 2 geometry if code is level 1/2
  if (parts.length <= 2) {
    const doc = await db.collection('master_wilayah_geometry').findOne({ kode: code });
    if (doc) return doc;
  }

  return null;
}

async function getMapScene(code = '') {
  const db = await DbConnection.getDb();
  const index = await getIndex();
  if (code && !index.byCode.has(code)) throw new Error('Kode wilayah tidak ditemukan');

  const selectedChain = code ? index.chain(code) : null;
  const parts = code ? code.split('.') : [];

  let targetDoc = null;
  if (code) {
    targetDoc = await db.collection('master_wilayah_geometry').findOne({ kode: code });
    if (!targetDoc || !targetDoc.path) {
      targetDoc = await resolveSpecificLocation(code, selectedChain, db);
    }
  }

  const selectedDoc = code ? await db.collection('master_wilayah').findOne({ kode: code }) : null;

  const activeLat = targetDoc?.lat ?? targetDoc?.center?.[0] ?? (code ? null : -2.5);
  const activeLng = targetDoc?.lng ?? targetDoc?.center?.[1] ?? (code ? null : 118);
  const activePath = targetDoc?.path || null;
  const activeBounds = targetDoc?.bounds || computeBoundsFromPath(activePath);

  // Features: Only loaded when no specific code is chosen (initial Indonesia map)
  // so that when a specific region is chosen, there are NO competing background lines!
  let features = [];
  if (!code) {
    const provDocs = await db.collection('master_wilayah_geometry').find({ level: 1 }).sort({ kode: 1 }).toArray();
    features = provDocs.filter(doc => doc.geometry).map(doc => ({
      type: 'Feature',
      properties: {
        kode: doc.kode,
        nama: doc.nama,
        level: doc.level,
        selected: false,
        luas: doc.luas || null,
        penduduk: doc.penduduk || null
      },
      geometry: previewGeometry(doc.geometry)
    }));
  }

  // Retrieve post offices with GPS belonging to this region
  let officesInScene = [];
  try {
    const officesCursor = await db.collection('master_kantor').find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }, {
      projection: {
        nopend: 1, nama_nopend: 1, nama_kantor: 1, tipe: 1, jenis_kantor: 1,
        latitude: 1, longitude: 1, alamat: 1, provinsi: 1, kabupaten_kota: 1,
        kabupaten: 1, kota: 1, kecamatan: 1, kelurahan: 1, wilayah_kode: 1,
        kode_wilayah: 1, nama_kcu_kc: 1, nama_kcu: 1, nama_regional: 1
      }
    }).toArray();

    for (const o of officesCursor) {
      const lat = Number(o.latitude);
      const lng = Number(o.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
      const w = index.resolveOffice(o);
      if (!code || index.isInside(w.kode, code)) {
        officesInScene.push({
          nopend: o.nopend,
          nama_nopend: o.nama_nopend || o.nama_kantor || o.nopend,
          nama_kantor: o.nama_kantor || o.nama_nopend || o.nopend,
          tipe: o.tipe,
          jenis_kantor: o.jenis_kantor,
          alamat: o.alamat,
          latitude: lat,
          longitude: lng,
          wilayah: w
        });
      }
    }
  } catch (e) {
    // ignore office fetch error for map scene
  }

  return {
    selected: selectedChain,
    boundaryCode: code || null,
    center: targetDoc?.center || (activeLat && activeLng ? [activeLat, activeLng] : null),
    targetCenter: targetDoc?.center || (activeLat && activeLng ? [activeLat, activeLng] : null),
    targetBounds: activeBounds,
    path: activePath,
    targetLevel: parts.length,
    targetName: parts.length === 4 ? selectedChain?.desaKelurahan?.nama : parts.length === 3 ? selectedChain?.kecamatan?.nama : parts.length === 2 ? selectedChain?.kabupatenKota?.nama : selectedChain?.provinsi?.nama,
    luas: targetDoc?.luas ?? selectedDoc?.luas ?? null,
    penduduk: targetDoc?.penduduk ?? selectedDoc?.penduduk ?? null,
    lat: activeLat,
    lng: activeLng,
    boundaryAvailable: Boolean(activePath || features.some(f => f.properties.kode === code)),
    features,
    offices: officesInScene
  };
}

async function getWilayahNopens(code = '') {
  const db = await DbConnection.getDb();
  const index = await getIndex();
  const allOffices = await db.collection('master_kantor').find({}, {
    projection: {
      nopend: 1, nama_nopend: 1, nama_kantor: 1, tipe: 1, jenis_kantor: 1,
      latitude: 1, longitude: 1, alamat: 1, provinsi: 1, kabupaten_kota: 1,
      kabupaten: 1, kota: 1, kecamatan: 1, kelurahan: 1, wilayah_kode: 1,
      kode_wilayah: 1, nama_kcu_kc: 1, nama_kcu: 1, nama_regional: 1
    }
  }).toArray();

  let matches = [];
  for (const o of allOffices) {
    const w = index.resolveOffice(o);
    if (!code || index.isInside(w.kode, code)) {
      matches.push({
        nopend: o.nopend,
        nama_nopend: o.nama_nopend || o.nama_kantor || o.nopend,
        nama_kantor: o.nama_kantor || o.nama_nopend || o.nopend,
        tipe: o.tipe || 'KCP',
        jenis_kantor: o.jenis_kantor || 'Kantor Pos',
        alamat: o.alamat,
        latitude: o.latitude ? Number(o.latitude) : null,
        longitude: o.longitude ? Number(o.longitude) : null,
        has_gps: !!(o.latitude && o.longitude),
        wilayah: w
      });
    }
  }

  // If no office directly in this leaf level (e.g. newly created desa/kecamatan),
  // fallback to parent kabupaten/kota so user still sees the relevant kantor pos network!
  if (matches.length === 0 && code.includes('.')) {
    const parentKab = code.split('.').slice(0, 2).join('.');
    for (const o of allOffices) {
      const w = index.resolveOffice(o);
      if (index.isInside(w.kode, parentKab)) {
        matches.push({
          nopend: o.nopend,
          nama_nopend: o.nama_nopend || o.nama_kantor || o.nopend,
          nama_kantor: o.nama_kantor || o.nama_nopend || o.nopend,
          tipe: o.tipe || 'KCP',
          jenis_kantor: o.jenis_kantor || 'Kantor Pos',
          alamat: o.alamat,
          latitude: o.latitude ? Number(o.latitude) : null,
          longitude: o.longitude ? Number(o.longitude) : null,
          has_gps: !!(o.latitude && o.longitude),
          wilayah: w,
          is_parent_fallback: true
        });
      }
    }
  }

  // Sort: offices with GPS first, then by nopend numeric
  matches.sort((a, b) => {
    if (a.has_gps && !b.has_gps) return -1;
    if (!a.has_gps && b.has_gps) return 1;
    return String(a.nopend || '').localeCompare(String(b.nopend || ''), 'id', { numeric: true });
  });

  return { count: matches.length, data: matches };
}

async function reverseLookup(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Koordinat tidak valid');
  const db = await DbConnection.getDb();
  const candidates = await db.collection('master_wilayah_geometry').find({
    'bounds.west': { $lte: lng }, 'bounds.east': { $gte: lng },
    'bounds.south': { $lte: lat }, 'bounds.north': { $gte: lat }
  }).sort({ level: -1, kode: 1 }).toArray();
  const containing = candidates.filter(doc => doc.geometry && containsPoint(doc.geometry, lng, lat));
  if (!containing.length) return null;
  const deepest = Math.max(...containing.map(doc => doc.level));
  const matches = containing.filter(doc => doc.level === deepest);
  if (matches.length > 1) return { kode: null, matches: matches.map(({ kode, nama }) => ({ kode, nama })), latitude: lat, longitude: lng };
  const match = matches[0];
  const index = await getIndex();
  return { kode: match.kode, nama: match.nama, chain: index.chain(match.kode), latitude: lat, longitude: lng };
}

export default { getIndex, getOptions, getMapScene, getWilayahNopens, reverseLookup };
