/**
 * Seed Script — Insert dummy route_journeys data for Daily Routing feature.
 * 
 * Usage: node scripts/seed-daily-routing.js
 * 
 * This inserts sample journeys for today, yesterday, and 2 days ago
 * into the `route_journeys` collection, so the Routing Checker Daily Routing
 * feature has data to display.
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load connection config
const connectionsFile = path.join(__dirname, '..', 'config', 'connections.json');
let connections;
try {
  connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
} catch (e) {
  console.error('Cannot read connections.json:', e.message);
  process.exit(1);
}

// Use first connection (default)
const conn = connections[0];
console.log(`Using connection: ${conn.name} → ${conn.database}`);

// Helper: create a date at start of day
function dayStart(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateId(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// ─── Dummy Data ──────────────────────────────────────────────────────────────

function buildJourneys() {
  const today = formatDateId(0);
  const yesterday = formatDateId(1);
  const twoDaysAgo = formatDateId(2);

  return [
    // ── TODAY: 2 journeys ────────────────────────────────────────────────────
    {
      journey_id: `JRN-${today}-B9910PCX-001`,
      route_id: 'RT-MALAM-B9910-PCX',
      vehicle_nopol: 'B 9910 PCX',
      resolved_vehicle_nopol: 'B 9910 PCX',
      journey_date: dayStart(0),
      shift: 'MALAM',
      status: 'IN_PROGRESS',
      maximum_capacity_kg: 1500,
      current_load_kg: 850,
      version: 1,
      cargo: [
        { connote_code: `P${today}000001`, weight_kg: 2.5, origin_nopen: '40395C1', destination_nopen: '40400' },
        { connote_code: `P${today}000002`, weight_kg: 5.0, origin_nopen: '40395C1', destination_nopen: '40000' },
        { connote_code: `P${today}000003`, weight_kg: 1.2, origin_nopen: '40511', destination_nopen: '40400' },
        { connote_code: `P${today}000004`, weight_kg: 3.8, origin_nopen: '40511', destination_nopen: '40350' },
        { connote_code: `P${today}000005`, weight_kg: 10.0, origin_nopen: '40395C1', destination_nopen: '40400' },
      ],
      processed_stops: [
        {
          seq: 1,
          nopen: '40395C1',
          officeName: 'AGEN ARVINET (40395C1)',
          arrivedAt: new Date(),
          acceptedItems: [
            { connote_code: `P${today}000006`, weight_kg: 0.8, origin_nopen: '40395C1', destination_nopen: '40400' },
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      journey_id: `JRN-${today}-D1234AB-001`,
      route_id: 'RT-PAGI-40511-40000',
      vehicle_nopol: 'D 1234 AB',
      resolved_vehicle_nopol: 'D 1234 AB',
      journey_date: dayStart(0),
      shift: 'PAGI',
      status: 'COMPLETED',
      maximum_capacity_kg: 2000,
      current_load_kg: 0,
      version: 3,
      cargo: [],
      processed_stops: [
        {
          seq: 1,
          nopen: '40511',
          officeName: 'KPC CIMAHI (40511)',
          arrivedAt: new Date(),
          acceptedItems: [
            { connote_code: `P${today}000007`, weight_kg: 4.5, origin_nopen: '40511', destination_nopen: '40000' },
            { connote_code: `P${today}000008`, weight_kg: 2.1, origin_nopen: '40511', destination_nopen: '40000' },
            { connote_code: `P${today}000009`, weight_kg: 7.3, origin_nopen: '40511', destination_nopen: '40400' },
          ]
        },
        {
          seq: 2,
          nopen: '40000',
          officeName: 'KCU BANDUNG (40000)',
          arrivedAt: new Date(),
          acceptedItems: [
            { connote_code: `P${today}000010`, weight_kg: 1.0, origin_nopen: '40000', destination_nopen: '40350' },
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // ── YESTERDAY: 1 journey ────────────────────────────────────────────────
    {
      journey_id: `JRN-${yesterday}-B9910PCX-001`,
      route_id: 'RT-MALAM-B9910-PCX',
      vehicle_nopol: 'B 9910 PCX',
      resolved_vehicle_nopol: 'B 9910 PCX',
      journey_date: dayStart(1),
      shift: 'MALAM',
      status: 'COMPLETED',
      maximum_capacity_kg: 1500,
      current_load_kg: 0,
      version: 5,
      cargo: [],
      processed_stops: [
        {
          seq: 1,
          nopen: '40395C1',
          officeName: 'AGEN ARVINET (40395C1)',
          arrivedAt: dayStart(1),
          acceptedItems: [
            { connote_code: `P${yesterday}000001`, weight_kg: 3.2, origin_nopen: '40395C1', destination_nopen: '40400' },
            { connote_code: `P${yesterday}000002`, weight_kg: 1.5, origin_nopen: '40395C1', destination_nopen: '40400' },
            { connote_code: `P${yesterday}000003`, weight_kg: 6.0, origin_nopen: '40511', destination_nopen: '40000' },
          ]
        },
        {
          seq: 2,
          nopen: '40400',
          officeName: 'SPP BANDUNG (40400)',
          arrivedAt: dayStart(1),
          acceptedItems: [
            { connote_code: `P${yesterday}000004`, weight_kg: 2.2, origin_nopen: '40400', destination_nopen: '40350' },
          ]
        }
      ],
      createdAt: dayStart(1),
      updatedAt: dayStart(1)
    },

    // ── 2 DAYS AGO: 1 journey ───────────────────────────────────────────────
    {
      journey_id: `JRN-${twoDaysAgo}-D1234AB-001`,
      route_id: 'RT-PAGI-40511-40000',
      vehicle_nopol: 'D 1234 AB',
      resolved_vehicle_nopol: 'D 1234 AB',
      journey_date: dayStart(2),
      shift: 'PAGI',
      status: 'COMPLETED',
      maximum_capacity_kg: 2000,
      current_load_kg: 0,
      version: 4,
      cargo: [],
      processed_stops: [
        {
          seq: 1,
          nopen: '40511',
          officeName: 'KPC CIMAHI (40511)',
          arrivedAt: dayStart(2),
          acceptedItems: [
            { connote_code: `P${twoDaysAgo}000001`, weight_kg: 5.5, origin_nopen: '40511', destination_nopen: '40000' },
            { connote_code: `P${twoDaysAgo}000002`, weight_kg: 3.0, origin_nopen: '40511', destination_nopen: '40350' },
          ]
        }
      ],
      createdAt: dayStart(2),
      updatedAt: dayStart(2)
    }
  ];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(conn.uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db(conn.database);
    const col = db.collection('route_journeys');

    // Check existing count
    const existingCount = await col.countDocuments();
    console.log(`  Existing documents in route_journeys: ${existingCount}`);

    const journeys = buildJourneys();

    // Remove any previous seed data (by matching our journey_id patterns)
    const seedIds = journeys.map(j => j.journey_id);
    const deleteResult = await col.deleteMany({ journey_id: { $in: seedIds } });
    if (deleteResult.deletedCount > 0) {
      console.log(`  Cleaned ${deleteResult.deletedCount} previous seed documents.`);
    }

    // Insert new seed data
    const insertResult = await col.insertMany(journeys);
    console.log(`✓ Inserted ${insertResult.insertedCount} seed journey documents.`);

    // ─── Seed Detail Route Collection ─────────────────────────────────────────
    const drCol = db.collection('detail_route');
    const pagiSegments = [
      {
        detail_route_id: 'DR-PAGI-001',
        route_id: 'RT-PAGI-40511-40000',
        asal_nopen: '40511',
        asal_nama: 'KPC CIMAHI 40511',
        tujuan_nopen: '40000',
        tujuan_nama: 'KCU BANDUNG 40000',
        seq: 1,
        estimasi_jam: 1,
        moda: 'D',
        nama_moda: 'DARAT',
        role_asal: 'ORIGIN',
        role_tujuan: 'TRANSIT',
        status: 'AKTIF'
      },
      {
        detail_route_id: 'DR-PAGI-002',
        route_id: 'RT-PAGI-40511-40000',
        asal_nopen: '40000',
        asal_nama: 'KCU BANDUNG 40000',
        tujuan_nopen: '40400',
        tujuan_nama: 'SPP BANDUNG 40400',
        seq: 2,
        estimasi_jam: 1,
        moda: 'D',
        nama_moda: 'DARAT',
        role_asal: 'TRANSIT',
        role_tujuan: 'DESTINATION',
        status: 'AKTIF'
      }
    ];

    await drCol.deleteMany({ route_id: 'RT-PAGI-40511-40000' });
    await drCol.insertMany(pagiSegments);
    console.log(`✓ Inserted detail_route segments for RT-PAGI-40511-40000.`);

    // ─── Seed Transaksi Collection ──────────────────────────────────────────
    const txCol = db.collection('transaksi');
    const sampleResis = [
      { code: 'P2607150025574', origin: '40395C1', dest: '40400', service: 'Pos Sameday', state: 'IN TRANSIT', weight: 1.5 },
      { code: 'P2607150025588', origin: '40511', dest: '40000', service: 'Pos Nextday', state: 'MANIFEST', weight: 2.0 },
      { code: 'P2607150025598', origin: '40511', dest: '40350', service: 'Pos Reguler', state: 'DELIVERED', weight: 0.8 },
    ];

    // Add daily routing connotes
    journeys.forEach(j => {
      (j.cargo || []).forEach(c => {
        if (!sampleResis.some(s => s.code === c.connote_code)) {
          sampleResis.push({ code: c.connote_code, origin: c.origin_nopen, dest: c.destination_nopen, service: 'Pos Express', state: 'IN TRANSIT', weight: c.weight_kg });
        }
      });
      (j.processed_stops || []).forEach(s => {
        (s.acceptedItems || []).forEach(a => {
          if (!sampleResis.some(sr => sr.code === a.connote_code)) {
            sampleResis.push({ code: a.connote_code, origin: a.origin_nopen || '40395C1', dest: a.destination_nopen || '40400', service: 'Pos Express', state: 'IN TRANSIT', weight: a.weight_kg });
          }
        });
      });
    });

    const txDocs = sampleResis.map(r => ({
      connote_code: r.code,
      connote_booking_code: `BK-${r.code}`,
      connote_service: r.service,
      connote_state: r.state,
      connote: {
        connote_code: r.code,
        connote_booking_code: `BK-${r.code}`,
        connote_service: r.service,
        connote_sender_name: 'PT Mitra Utama',
        connote_sender_address: 'Jl. Raya Cimahi No. 123',
        connote_receiver_name: 'Bpk. Ahmad Sujipto',
        connote_receiver_address: 'Jl. Asia Afrika No. 45, Bandung',
        connote_amount: 25000,
        connote_chargeable_weight: r.weight,
        connote_actual_weight: r.weight,
        created_at: new Date().toISOString()
      },
      custom_field: {
        origin_nopen: r.origin,
        destination_nopen: r.dest,
        destination_kprk: r.dest,
        destination_reg: '3'
      },
      location_data_created: {
        location_name: `KANTOR ${r.origin}`,
        custom_field: { nopen: r.origin }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const sampleCodes = sampleResis.map(r => r.code);
    await txCol.deleteMany({
      $or: [
        { connote_code: { $in: sampleCodes } },
        { 'connote.connote_code': { $in: sampleCodes } }
      ]
    });

    const txInsertResult = await txCol.insertMany(txDocs);
    console.log(`✓ Inserted ${txInsertResult.insertedCount} sample transaction documents into 'transaksi'.`);

    // Print summary
    console.log('\n─── Seed Data Summary ───');
    for (const j of journeys) {
      const cargoCount = (j.cargo || []).length;
      const processedCount = (j.processed_stops || []).reduce((sum, s) => sum + (s.acceptedItems || []).length, 0);
      const dateStr = j.journey_date.toISOString().slice(0, 10);
      console.log(`  ${j.journey_id} | ${dateStr} | ${j.vehicle_nopol} | ${j.route_id} | cargo: ${cargoCount}, processed: ${processedCount} | status: ${j.status}`);
    }
    console.log('');

    console.log('✓ Done! Restart the server and refresh the Routing Checker page.');

  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
