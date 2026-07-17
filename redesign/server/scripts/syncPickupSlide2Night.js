import DbConnection from '../config/DbConnection.js';
import { PickupOfficeResolver } from '../services/PickupOfficeResolver.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONNECTIONS_FILE = path.join(__dirname, '..', 'config', 'connections.json');

const SLIDE_2_NIGHT_ROUTES = [
  { 
    vehicle: 'B 9910 PCX', 
    category: 'MALAM', 
    groups: [
      { 
        id: 'PICK_UP_AGP', 
        name: 'PICK UP AGP', 
        startTime: '16.00', 
        endTime: '21.00', 
        route_id: 'RT-MALAM-B9910-PCX',
        candidates: ['AGP ONG', 'AGP Arvinet', 'AGP Cicalengka', 'AGP Ciparay', 'AGP Majalaya', 'KCP Majalaya', 'AGP Omega', 'AGP Cileunyi', 'AGP Cinunuk Permata Biru'] 
      }
    ] 
  },
  { 
    vehicle: 'B 9945 PCY', 
    category: 'MALAM', 
    groups: [
      { 
        id: 'PICK_UP_1', 
        name: 'PICK UP 1', 
        startTime: '18.00', 
        endTime: '21.30', 
        route_id: 'RT-MALAM-B9945-PCY-PU1',
        candidates: ['KCU BD 40000', 'UNPAR', 'AGP Siliwangi', 'AGP Dago', 'KCP Cihapit', 'AGP Gatsu'] 
      },
      { 
        id: 'PICK_UP_2', 
        name: 'PICK UP 2', 
        startTime: '22.00', 
        endTime: '24.00', 
        route_id: 'RT-MALAM-B9945-PCY-PU2',
        candidates: ['KC Ujung Berung 40100', 'AGP Artajati', 'AGP Ciskul'] 
      }
    ] 
  }
];

const OFFICE_ALIAS_CODES = {
  'AGP Arvinet': '40395C1', 'AGP Cicalengka': '40395U1', 'AGP Ciparay': '40381U2',
  'AGP Majalaya': '40382U1', 'KCP Majalaya': '40382B2', 'AGP Cileunyi': '40393U3',
  'AGP Cinunuk Permata Biru': '40393S8', 'KCU BD 40000': '40000', UNPAR: '40141C3',
  'AGP Dago': '40135U1', 'KCP Cihapit': '40114A', 'AGP Gatsu': '40263C2',
  'KC Ujung Berung 40100': '40100'
};

async function getNextDetailRouteId(db, offset) {
  const cursor = await db.collection('detail_route').find({}, {
    projection: { detail_route_id: 1 },
    sort: { detail_route_id: -1 },
    limit: 1
  }).toArray();
  let lastNum = 0;
  if (cursor.length > 0 && cursor[0].detail_route_id) {
    const match = cursor[0].detail_route_id.match(/(\d+)$/);
    if (match) {
      lastNum = parseInt(match[1], 10);
    }
  }
  return 'DR' + String(lastNum + 1 + offset).padStart(6, '0');
}

async function main() {
  const connections = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, 'utf8'));
  let connected = false;

  for (const conn of connections) {
    console.log(`Connecting to ${conn.name}...`);
    try {
      await DbConnection.connect(conn);
      connected = true;
      break;
    } catch (e) {
      // ignore
    }
  }

  if (!connected) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  const db = await DbConnection.getDb();
  console.log('Connected to database ipos5_reporting.');

  const resolver = new PickupOfficeResolver(OFFICE_ALIAS_CODES);
  await resolver.loadOffices();

  const report = [];
  let totalRouteUpdated = 0;
  let totalStopUpdated = 0;
  let totalStopSkipped = 0;

  let drOffset = 0;

  for (const vehicleConfig of SLIDE_2_NIGHT_ROUTES) {
    const vehicle = vehicleConfig.vehicle;
    
    for (const group of vehicleConfig.groups) {
      const routeId = group.route_id;
      const stops = [];
      const skipped = [];
      const ambiguous = [];

      console.log(`\nResolving stops for ${vehicle} - ${group.name}...`);

      for (const candidate of group.candidates) {
        const res = resolver.resolveOfficeFromMaster(candidate);
        if (!res.found) {
          skipped.push({ candidate, reason: 'Tidak ditemukan di database master_kantor' });
          totalStopSkipped++;
          console.log(`  - ${candidate} -> SKIPPED`);
        } else {
          stops.push(res.office);
          totalStopUpdated++;
          console.log(`  + ${candidate} -> FOUND (${res.office.nopend} - ${res.office.nama_nopend})`);
        }
      }

      report.push({
        vehicle,
        groupName: group.name,
        successCount: stops.length,
        skippedCount: skipped.length,
        ambiguousCount: ambiguous.length,
        stops,
        skipped
      });

      if (stops.length === 0) {
        console.warn(`Warning: No valid stops resolved for route ${routeId}. Skipping DB update.`);
        continue;
      }

      // 1. Upsert Route Header in master_route_nopen
      const firstStop = stops[0];
      const lastStop = stops[stops.length - 1];

      const routeHeader = {
        route_id: routeId,
        nopen_asal: firstStop.nopend,
        nama_asal: firstStop.nama_nopend,
        nopen_tujuan: lastStop.nopend,
        nama_tujuan: lastStop.nama_nopend,
        kodeMile: 'NIGHT',
        deskripsi_produk: `PICK UP ${group.name} MALAM - ${vehicle}`,
        prioritas: 1,
        aktif: 'Y',
        source_file: "Jadwal Pick up SPP Bd(1).pptx",
        source_slide: 2,
        source_section: "MALAM",
        source_synced_at: new Date(),
        updatedAt: new Date()
      };

      await db.collection('master_route_nopen').updateOne(
        { route_id: routeId },
        { 
          $set: routeHeader,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      totalRouteUpdated++;

      // 2. Upsert Detail Route segments (idempotent: delete old segments first, then insert new ones)
      await db.collection('detail_route').deleteMany({ route_id: routeId });

      const segments = [];
      if (stops.length === 1) {
        // Single stop route segment placeholder (self-loop)
        const singleId = await getNextDetailRouteId(db, drOffset++);
        segments.push({
          detail_route_id: singleId,
          route_id: routeId,
          asal_nopen: firstStop.nopend,
          asal_nama: firstStop.nama_nopend,
          tujuan_nopen: firstStop.nopend,
          tujuan_nama: firstStop.nama_nopend,
          seq: 1,
          estimasi_jam: 0.5,
          moda: 'D',
          nama_moda: 'DARAT',
          role_asal: 'ORIGIN',
          role_tujuan: 'DESTINATION',
          status: 'AKTIF',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Create actual segments
        for (let i = 0; i < stops.length - 1; i++) {
          const uId = await getNextDetailRouteId(db, drOffset++);
          const asal = stops[i];
          const tujuan = stops[i + 1];
          segments.push({
            detail_route_id: uId,
            route_id: routeId,
            asal_nopen: asal.nopend,
            asal_nama: asal.nama_nopend,
            tujuan_nopen: tujuan.nopend,
            tujuan_nama: tujuan.nama_nopend,
            seq: i + 1,
            estimasi_jam: 1, // default estimate 1 hour
            moda: 'D',
            nama_moda: 'DARAT',
            role_asal: i === 0 ? 'ORIGIN' : 'TRANSIT',
            role_tujuan: i === stops.length - 2 ? 'DESTINATION' : 'TRANSIT',
            status: 'AKTIF',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      if (segments.length > 0) {
        await db.collection('detail_route').insertMany(segments);
      }
    }
  }

  // Render Console Report
  console.log(`\n==================================================`);
  console.log(`SYNC PICKUP PPT SLIDE 2 — MALAM`);
  console.log(`==================================================`);
  
  for (const r of report) {
    console.log(`${r.vehicle} ${r.groupName}`);
    console.log(`Berhasil: ${r.successCount}`);
    console.log(`Dilewati: ${r.skippedCount}`);
    console.log(`Ambigu: ${r.ambiguousCount}`);
    if (r.skipped.length > 0) {
      console.log(`Detail Dilewati:`);
      r.skipped.forEach(s => console.log(`  - ${s.candidate}: ${s.reason}`));
    }
    console.log(``);
  }

  console.log(`Total route diperbarui: ${totalRouteUpdated}`);
  console.log(`Total stop diperbarui: ${totalStopUpdated}`);
  console.log(`Total stop dilewati: ${totalStopSkipped}`);
  console.log(`==================================================`);

  await DbConnection.disconnect();
}

main().catch(console.error);
