/**
 * Idempotent Database Seeder Script — Package Tracking Demo
 * Usage: node scripts/seed-package-tracking-demo.js
 * 
 * Inserts 6 offices, 2 vehicles with capacities, 1 multi-stop route with 6 stops,
 * 40+ packages across operational dates (2026-07-24 & 2026-07-25),
 * tracking events, and route_journeys instances.
 */

import DbConnection from '../config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedData() {
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
  console.log('🌱 Starting idempotent Package Tracking database seeder...');

  const BATCH_ID = 'SEED-PT-DEMO';

  // 1. Offices (master_kantor)
  const offices = [
    { nopend: '40511', nama_nopend: 'KCU Cimahi', tipe: 'KCU', status: 'AKTIF', is_seed_data: true },
    { nopend: '40521', nama_nopend: 'KCP Cimahi Selatan', tipe: 'KCP', status: 'AKTIF', is_seed_data: true },
    { nopend: '40395C1', nama_nopend: 'AGEN ARVINET', tipe: 'AGEN', status: 'AKTIF', is_seed_data: true },
    { nopend: '40553', nama_nopend: 'KCP Padalarang', tipe: 'KCP', status: 'AKTIF', is_seed_data: true },
    { nopend: '40000', nama_nopend: 'KCU Bandung', tipe: 'KCU', status: 'AKTIF', is_seed_data: true },
    { nopend: '40400', nama_nopend: 'SPP Bandung', tipe: 'SPP', status: 'AKTIF', is_seed_data: true },
  ];

  for (const off of offices) {
    await db.collection('master_kantor').updateOne(
      { nopend: off.nopend },
      { $set: off },
      { upsert: true }
    );
  }
  console.log('✅ Master Kantor seeded (6 offices)');

  // 2. Vehicles (master_kendaraan)
  const vehicles = [
    { nopol: 'B 9910 PCX', jenis: 'Grand Max Blind Van', kapasitas_kg: 1500, max_capacity_kg: 1500, status: 'AKTIF', is_seed_data: true },
    { nopol: 'B 9945 PCY', jenis: 'Isuzu Elf Box', kapasitas_kg: 2000, max_capacity_kg: 2000, status: 'AKTIF', is_seed_data: true },
  ];

  for (const v of vehicles) {
    await db.collection('master_kendaraan').updateOne(
      { nopol: v.nopol },
      { $set: v },
      { upsert: true }
    );
  }
  console.log('✅ Master Kendaraan seeded (2 vehicles with capacities)');

  // 3. Route Master (master_route)
  const routeMaster = {
    route_id: 'RT-MALAM-B9910-PCX',
    nama_route: 'Lintas Malam Cimahi - SPP Bandung (Multi-Stop)',
    asal_nopen: '40511',
    tujuan_nopen: '40400',
    jarak_km: 42.5,
    aktif: 'Y',
    is_seed_data: true
  };
  await db.collection('master_route').updateOne(
    { route_id: routeMaster.route_id },
    { $set: routeMaster },
    { upsert: true }
  );

  // 4. Detail Route Stops (detail_route - 5 unique waypoints)
  const detailRouteStops = [
    { route_id: 'RT-MALAM-B9910-PCX', seq: 1, asal_nopen: '40511', asal_nama: 'KCU Cimahi',         tujuan_nopen: '40521',   tujuan_nama: 'KCP Cimahi Selatan', jarak_km: 5.2,  estimasi_menit: 15, status: 'AKTIF', is_seed_data: true },
    { route_id: 'RT-MALAM-B9910-PCX', seq: 2, asal_nopen: '40521', asal_nama: 'KCP Cimahi Selatan', tujuan_nopen: '40395C1', tujuan_nama: 'AGEN ARVINET',      jarak_km: 4.8,  estimasi_menit: 12, status: 'AKTIF', is_seed_data: true },
    { route_id: 'RT-MALAM-B9910-PCX', seq: 3, asal_nopen: '40395C1', asal_nama: 'AGEN ARVINET',     tujuan_nopen: '40553',   tujuan_nama: 'KCP Padalarang',     jarak_km: 8.5,  estimasi_menit: 20, status: 'AKTIF', is_seed_data: true },
    { route_id: 'RT-MALAM-B9910-PCX', seq: 4, asal_nopen: '40553', asal_nama: 'KCP Padalarang',     tujuan_nopen: '40000',   tujuan_nama: 'KCU Bandung',        jarak_km: 12.0, estimasi_menit: 25, status: 'AKTIF', is_seed_data: true },
    { route_id: 'RT-MALAM-B9910-PCX', seq: 5, asal_nopen: '40000', asal_nama: 'KCU Bandung',        tujuan_nopen: '40400',   tujuan_nama: 'SPP Bandung',        jarak_km: 7.0,  estimasi_menit: 18, status: 'AKTIF', is_seed_data: true },
  ];

  // Remove stale seq 6 self-loop segment if it exists
  await db.collection('detail_route').deleteOne({ route_id: 'RT-MALAM-B9910-PCX', seq: 6 });

  for (const st of detailRouteStops) {
    await db.collection('detail_route').updateOne(
      { route_id: st.route_id, seq: st.seq },
      { $set: st },
      { upsert: true }
    );
  }
  console.log('✅ Detail Route Multi-Stop seeded (6 waypoints)');

  // Helper date creators
  const dateTodayStr = '2026-08-11';
  const date24Str = '2026-07-24';
  const date25Str = '2026-07-25';

  // 5. Packages (transaksi) & Tracking Events (tracking_events)
  const packagesConfig = [
    // =======================================================
    // 2026-08-11 Packages — carefully calculated so load
    // NEVER exceeds 1500 kg at any stop (max capacity = 1500 kg).
    //
    // Verified capacity per stop:
    //  Stop 1 (KCU Cimahi):     +P001(45)+P002(80)+P003(250)+P004(280)+P005(440) = 1095 kg  73% NEAR CAPACITY
    //  Stop 2 (KCP Cimahi Sel): -P001(45 unloaded) +P006(180 new)                = 1230 kg  82% NEAR CAPACITY ✓
    //  Stop 3 (AGEN ARVINET):   (no unload)         +P007(80 new)                = 1310 kg  87% NEAR CAPACITY ✓
    //  Stop 4 (KCP Padalarang): -P002(80 unloaded)  +P008(85 new)                = 1315 kg  88% NEAR CAPACITY ✓
    //  Stop 5 (KCU Bandung):   -P004(280 unloaded)  (no new load)                = 1035 kg  69% NORMAL ✓
    //  Stop 6 (SPP Bandung):    all remaining P003+P005+P006+P007+P008 delivered  = 0 kg ✓
    //  MAX at any point = 1315 kg — safely within 1500 kg limit
    // =======================================================
    { connote: 'P20260811000001', date: dateTodayStr, origin: '40511',   dest: '40521', weight: 45.0,  service: 'Pos Express', state: 'IN_TRANSIT', seq: 1, vehicle: 'B 9910 PCX' },
    { connote: 'P20260811000002', date: dateTodayStr, origin: '40511',   dest: '40553', weight: 80.0,  service: 'Pos Nextday', state: 'IN_TRANSIT', seq: 1, vehicle: 'B 9910 PCX' },
    { connote: 'P20260811000003', date: dateTodayStr, origin: '40511',   dest: '40400', weight: 250.0, service: 'Pos Reguler', state: 'IN_TRANSIT', seq: 1, vehicle: 'B 9910 PCX' },
    { connote: 'P20260811000004', date: dateTodayStr, origin: '40511',   dest: '40000', weight: 280.0, service: 'Pos Cargo',   state: 'IN_TRANSIT', seq: 1, vehicle: 'B 9910 PCX' },
    { connote: 'P20260811000005', date: dateTodayStr, origin: '40511',   dest: '40400', weight: 440.0, service: 'Pos Cargo',   state: 'IN_TRANSIT', seq: 1, vehicle: 'B 9910 PCX' },
    { connote: 'P20260811000006', date: dateTodayStr, origin: '40521',   dest: '40400', weight: 180.0, service: 'Pos Reguler', state: 'IN_TRANSIT', seq: 2, vehicle: 'B 9910 PCX' },
    { connote: 'P20260811000007', date: dateTodayStr, origin: '40395C1', dest: '40400', weight: 80.0,  service: 'Pos Reguler', state: 'IN_TRANSIT', seq: 3, vehicle: 'B 9910 PCX' },
    { connote: 'P20260811000008', date: dateTodayStr, origin: '40553',   dest: '40400', weight: 85.0,  service: 'Pos Express', state: 'IN_TRANSIT', seq: 4, vehicle: 'B 9910 PCX' },

    // 2026-07-24 Packages
    { connote: 'P20260724000001', date: date24Str, origin: '40511', dest: '40400', weight: 4.5, service: 'Pos Reguler', state: 'IN_TRANSIT', seq: 3, vehicle: 'B 9910 PCX' },
    { connote: 'P20260724000002', date: date24Str, origin: '40511', dest: '40000', weight: 12.0, service: 'Pos Nextday', state: 'IN_TRANSIT', seq: 3, vehicle: 'B 9910 PCX' },
    { connote: 'P20260724000003', date: date24Str, origin: '40521', dest: '40400', weight: 8.5, service: 'Pos Reguler', state: 'LOADED', seq: 2, vehicle: 'B 9910 PCX' },
    { connote: 'P20260724000004', date: date24Str, origin: '40395C1', dest: '40553', weight: 2.1, service: 'Pos Express', state: 'LOADED', seq: 3, vehicle: 'B 9910 PCX' },
    { connote: 'P20260724000005', date: date24Str, origin: '40511', dest: '40400', weight: 15.0, service: 'Pos Cargo', state: 'DELIVERED', seq: 6, vehicle: 'B 9910 PCX' },
    { connote: 'P20260724000006', date: date24Str, origin: '40553', dest: '40400', weight: 6.8, service: 'Pos Reguler', state: 'ASSIGNED_TO_ROUTE', seq: 4, vehicle: 'B 9910 PCX' },
    
    // Additional Date 24 Packages to build realistic weight (e.g. ~850 kg load)
    ...Array.from({ length: 20 }, (_, idx) => ({
      connote: `P202607240000${String(idx + 10).padStart(2, '0')}`,
      date: date24Str,
      origin: idx % 2 === 0 ? '40511' : '40395C1',
      dest: idx % 3 === 0 ? '40000' : '40400',
      weight: 35.0 + (idx * 2.5),
      service: 'Pos Reguler',
      state: 'IN_TRANSIT',
      seq: 3,
      vehicle: 'B 9910 PCX'
    })),

    // 2026-07-25 Packages
    { connote: 'P20260725000001', date: date25Str, origin: '40511', dest: '40400', weight: 1.5, service: 'Pos Express', state: 'LOADED', seq: 1, vehicle: 'B 9910 PCX' },
    { connote: 'P20260725000002', date: date25Str, origin: '40511', dest: '40000', weight: 3.2, service: 'Pos Reguler', state: 'MANIFESTED', seq: 1, vehicle: 'B 9910 PCX' },
    ...Array.from({ length: 15 }, (_, idx) => ({
      connote: `P202607250000${String(idx + 10).padStart(2, '0')}`,
      date: date25Str,
      origin: '40511',
      dest: '40400',
      weight: 50.0,
      service: 'Pos Cargo',
      state: 'LOADED',
      seq: 1,
      vehicle: 'B 9910 PCX'
    }))
  ];

  let eventCount = 0;
  for (const pkg of packagesConfig) {
    const createdDate = `${pkg.date}T08:00:00.000Z`;
    const scanDate = `${pkg.date}T08:30:00.000Z`;
    const manifestDate = `${pkg.date}T09:00:00.000Z`;
    const loadDate = `${pkg.date}T10:00:00.000Z`;

    const trackingHistory = [
      { stage: 'RECEIVED', note: 'Resi diterima dan divalidasi di counter asal', time: createdDate, location: pkg.origin },
      { stage: 'SCANNED', note: 'Resi di-scan oleh petugas sorting counter', time: scanDate, location: pkg.origin },
      { stage: 'MANIFESTED', note: 'Paket dimasukkan ke dalam Kantong Manifest Rute', time: manifestDate, location: pkg.origin },
    ];

    if (pkg.state === 'LOADED' || pkg.state === 'IN_TRANSIT' || pkg.state === 'DELIVERED') {
      trackingHistory.push({
        stage: 'LOADED',
        note: `Paket dimuat ke kendaraan ${pkg.vehicle} di stop seq ${pkg.seq}`,
        time: loadDate,
        location: pkg.origin
      });
    }

    if (pkg.state === 'IN_TRANSIT' || pkg.state === 'DELIVERED') {
      trackingHistory.push({
        stage: 'IN_TRANSIT',
        note: `Kendaraan ${pkg.vehicle} membawa paket melintasi rute RT-MALAM-B9910-PCX`,
        time: `${pkg.date}T11:00:00.000Z`,
        location: 'EN_ROUTE'
      });
    }

    if (pkg.state === 'DELIVERED') {
      trackingHistory.push({
        stage: 'DELIVERED',
        note: 'Paket telah diterima di lokasi tujuan akhir SPP Bandung',
        time: `${pkg.date}T14:00:00.000Z`,
        location: pkg.dest
      });
    }

    // Insert or update Transaksi
    const txDoc = {
      connote_code: pkg.connote,
      connote_booking_code: `BK-${pkg.connote.slice(-6)}`,
      connote_service: pkg.service,
      actual_weight: pkg.weight,
      connote_state: pkg.state,
      connote_sender_name: 'PT Pos Logistics Store',
      connote_receiver_name: 'Penerima Pos Indonesia',
      connote_receiver_address_detail: `Tujuan Nopen ${pkg.dest}`,
      location_name: `KANTOR POS ${pkg.origin}`,
      createdAt: new Date(createdDate),
      tracking_history: trackingHistory,
      import_batch_id: BATCH_ID,
      is_seed_data: true,
      location_data_created: {
        custom_field: {
          destination_nopen: pkg.dest,
          destination_kprk: pkg.dest,
          origin_nopen: pkg.origin
        }
      }
    };

    await db.collection('transaksi').updateOne(
      { connote_code: pkg.connote },
      { $set: txDoc },
      { upsert: true }
    );

    // Insert Tracking Events
    for (const event of trackingHistory) {
      const eventId = `${pkg.connote}_${event.stage}_${event.time}_${event.location}`;
      const eventDoc = {
        event_id: eventId,
        connote_code: pkg.connote,
        event_type: event.stage,
        event_datetime: new Date(event.time),
        office_code: event.location,
        office_name: `KANTOR ${event.location}`,
        route_code: 'RT-MALAM-B9910-PCX',
        vehicle_code: pkg.vehicle,
        stop_sequence: pkg.seq,
        weight_kg: pkg.weight,
        origin_office: pkg.origin,
        destination_office: pkg.dest,
        import_batch_id: BATCH_ID,
        is_seed_data: true
      };

      await db.collection('tracking_events').updateOne(
        { event_id: eventId },
        { $set: eventDoc },
        { upsert: true }
      );
      eventCount++;
    }
  }

  console.log(`✅ Transaksi (${packagesConfig.length} packages) & Tracking Events (${eventCount} events) seeded`);

  // 6. Seed Operational Journeys (route_journeys) for Date Today, 24 & 25
  const journeysToSeed = [
    {
      dateStr: dateTodayStr,
      journeyId: `JRN-20260811-B9910PCX-001`,
      currentStopSeq: 3,
      status: 'IN_PROGRESS',
      vehicle: 'B 9910 PCX'
    },
    {
      dateStr: date24Str,
      journeyId: `JRN-20260724-B9910PCX-001`,
      currentStopSeq: 3,
      status: 'IN_PROGRESS',
      vehicle: 'B 9910 PCX'
    },
    {
      dateStr: date25Str,
      journeyId: `JRN-20260725-B9910PCX-001`,
      currentStopSeq: 1,
      status: 'IN_PROGRESS',
      vehicle: 'B 9910 PCX'
    }
  ];

  for (const jItem of journeysToSeed) {
    const activePkgs = packagesConfig.filter(p => p.date === jItem.dateStr && (p.state === 'LOADED' || p.state === 'IN_TRANSIT'));
    const totalLoad = activePkgs.reduce((acc, p) => acc + p.weight, 0);

    const cargo = activePkgs.map(p => ({
      connote_code: p.connote,
      weight_kg: p.weight,
      origin_nopen: p.origin,
      destination_nopen: p.dest,
      loaded_at_seq: p.seq
    }));

    const journeyDoc = {
      journey_id: jItem.journeyId,
      route_id: 'RT-MALAM-B9910-PCX',
      vehicle_nopol: jItem.vehicle,
      resolved_vehicle_nopol: jItem.vehicle,
      journey_date: new Date(`${jItem.dateStr}T00:00:00.000Z`),
      shift: 'MALAM',
      status: jItem.status,
      current_stop_seq: jItem.currentStopSeq,
      maximum_capacity_kg: 1500,
      current_load_kg: totalLoad,
      cargo,
      processed_stops: [
        { seq: 1, nopen: '40511', officeName: 'KCU Cimahi', arrivedAt: new Date(`${jItem.dateStr}T09:00:00Z`) },
        { seq: 2, nopen: '40521', officeName: 'KCP Cimahi Selatan', arrivedAt: new Date(`${jItem.dateStr}T09:45:00Z`) }
      ],
      import_batch_id: BATCH_ID,
      is_seed_data: true,
      updatedAt: new Date()
    };

    await db.collection('route_journeys').updateOne(
      { journey_id: jItem.journeyId },
      { $set: journeyDoc },
      { upsert: true }
    );
  }

  console.log('✅ Route Journeys seeded for dates 2026-07-24 & 2026-07-25');
  console.log('🚀 Seed data complete successfully!');
  await DbConnection.disconnect();
}

seedData().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
