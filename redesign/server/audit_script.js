import DbConnection from './config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function audit() {
  const connFile = path.join(__dirname, 'config', 'connections.json');
  const connections = JSON.parse(fs.readFileSync(connFile, 'utf8'));
  let connected = false;
  for (const conn of connections) {
    try {
      await DbConnection.connect(conn);
      connected = true;
      console.log('Connected to:', conn.name || conn.uri);
      break;
    } catch (e) {
      console.error('Failed to connect:', e.message);
    }
  }

  if (!connected) {
    console.error('Connection failed');
    return;
  }

  const db = await DbConnection.getDb();

  console.log('--- 1. ROUTE DETAILS FOR RT-MALAM-B9910-PCX ---');
  const detailRoute = await db.collection('detail_route').find({ route_id: 'RT-MALAM-B9910-PCX', status: 'AKTIF' }).sort({ seq: 1 }).toArray();
  console.log('detail_route count:', detailRoute.length);
  console.log(JSON.stringify(detailRoute, null, 2));

  console.log('--- 2. VEHICLE SEARCH ---');
  const vehicles = await db.collection('master_kendaraan').find({ nopol: /9910/i }).toArray();
  console.log('master_kendaraan matching 9910:', JSON.stringify(vehicles, null, 2));

  const allVehiclesSample = await db.collection('master_kendaraan').find({}).limit(5).toArray();
  console.log('master_kendaraan sample:', JSON.stringify(allVehiclesSample, null, 2));

  console.log('--- 3. MASTER KANTOR FOR ROUTE STOPS ---');
  const nopends = [];
  detailRoute.forEach(dr => {
    if (dr.asal_nopen) nopends.push(dr.asal_nopen);
    if (dr.tujuan_nopen) nopends.push(dr.tujuan_nopen);
  });
  const uniqueNopends = [...new Set(nopends)];
  const offices = await db.collection('master_kantor').find({ nopend: { $in: uniqueNopends } }).toArray();
  console.log('Offices found:', offices.map(o => ({ nopend: o.nopend, nama: o.nama_nopend, status: o.status })));

  console.log('--- 4. TRANSAKSI SAMPLE & FIELDS ---');
  const txSample = await db.collection('transaksi').findOne({});
  console.log('txSample detail:', JSON.stringify(txSample, null, 2));

  console.log('--- 5. CHECK REPLICA SET / TRANSACTION SUPPORT ---');
  try {
    const isMaster = await db.admin().command({ isMaster: 1 });
    console.log('isMaster info:', { setName: isMaster.setName, ismaster: isMaster.ismaster, secondary: isMaster.secondary });
  } catch (e) {
    console.log('ReplicaSet check error:', e.message);
  }

  console.log('--- 6. CHECK ALL COLLECTIONS ---');
  const cols = await db.listCollections().toArray();
  console.log('Collections:', cols.map(c => c.name));

  await DbConnection.disconnect();
}

audit().catch(err => console.error(err));
