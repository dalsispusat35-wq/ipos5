import DbConnection from './config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkTx() {
  const connFile = path.join(__dirname, 'config', 'connections.json');
  const connections = JSON.parse(fs.readFileSync(connFile, 'utf8'));
  await DbConnection.connect(connections[0]);
  const db = await DbConnection.getDb();

  const stops = ['40395C1', '40395U1', '40381U2', '40382U1', '40382B2', '40393U3', '40393S8', '40400'];

  console.log('--- TRANSACTIONS PER ORIGIN ---');
  for (const nopen of stops) {
    const count = await db.collection('transaksi').countDocuments({
      $or: [
        { 'location_data_created.custom_field.nopen': nopen },
        { 'location_data_created.custom_field.nopend': nopen },
        { 'custom_field.origin_nopen': nopen },
        { 'origin_nopen': nopen }
      ]
    });
    console.log(`Stop ${nopen}: ${count} transactions`);
  }

  // Get distinct connote_state in database
  const states = await db.collection('transaksi').distinct('connote.connote_state');
  console.log('Distinct connote.connote_state in transaksi:', states);

  const statesRoot = await db.collection('transaksi').distinct('connote_state');
  console.log('Distinct connote_state in root:', statesRoot);

  // Check a sample transaction with origin in stops
  const sampleStopTx = await db.collection('transaksi').findOne({
    $or: [
      { 'location_data_created.custom_field.nopen': { $in: stops } },
      { 'location_data_created.custom_field.nopend': { $in: stops } },
      { 'custom_field.origin_nopen': { $in: stops } },
      { 'origin_nopen': { $in: stops } }
    ]
  });
  console.log('Sample stop transaction:', JSON.stringify(sampleStopTx, null, 2));

  // Check all fields of master_kendaraan
  const allVehicles = await db.collection('master_kendaraan').find({}).toArray();
  console.log('All vehicles count:', allVehicles.length);
  console.log('Sample vehicles:', JSON.stringify(allVehicles, null, 2));

  await DbConnection.disconnect();
}

checkTx().catch(console.error);
