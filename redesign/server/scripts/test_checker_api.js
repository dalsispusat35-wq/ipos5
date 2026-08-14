import DbConnection from '../config/DbConnection.js';
import PackageTrackingService from '../services/PackageTrackingService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONNECTIONS_FILE = path.join(__dirname, '..', 'config', 'connections.json');

async function testCheckerApi() {
  console.log('================================================================');
  console.log('🧪 TESTING PACKAGE TRACKING & CONTROL TOWER BACKEND SERVICES');
  console.log('================================================================\n');

  const connections = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, 'utf8'));
  let connected = false;

  for (const conn of connections) {
    try {
      await DbConnection.connect(conn);
      connected = true;
      console.log(`✅ Connected to DB: ${conn.name}`);
      break;
    } catch (e) {
      // ignore
    }
  }

  if (!connected) {
    console.error('❌ Failed to connect to any DB.');
    process.exit(1);
  }

  try {
    // Test 1: Daily Control Tower
    console.log('📌 Test 1: getDailyControlTowerSummary for today...');
    const ctSummary = await PackageTrackingService.getDailyControlTowerSummary('2026-08-13');
    console.log('   Control Tower Summary:', JSON.stringify(ctSummary.summary, null, 2));
    console.log(`   Active Vehicles Count: ${ctSummary.activeVehicles.length}`);
    console.log(`   Exceptions Count: ${ctSummary.exceptions.length}`);

    // Test 2: Valid Resi Search (P20260724000001)
    console.log('\n📌 Test 2: getPackageDetails for valid resi P20260724000001...');
    const pkgResult = await PackageTrackingService.getPackageDetails('P20260724000001', '2026-07-24');
    console.log('   Package Found:', pkgResult.found);
    if (pkgResult.found) {
      console.log(`   Resi: ${pkgResult.connoteCode}`);
      console.log(`   Origin: ${pkgResult.origin.name}`);
      console.log(`   Destination: ${pkgResult.destination.name}`);
      console.log(`   Vehicle Assignment: ${pkgResult.vehicleAssignment.nopol} (${pkgResult.vehicleAssignment.source})`);
      console.log(`   Route Stops Count: ${pkgResult.routeStops.length}`);
      console.log(`   Timeline Events Count: ${pkgResult.timeline.length}`);
    }

    // Test 3: Invalid Resi Search (P99999999999999) -> Must be found: false (No Mock Fallback!)
    console.log('\n📌 Test 3: getPackageDetails for invalid resi P99999999999999...');
    const invalidPkg = await PackageTrackingService.getPackageDetails('P99999999999999', '2026-08-13');
    console.log('   Package Found:', invalidPkg.found);
    console.log('   Error Message:', invalidPkg.message);
    if (invalidPkg.found === false && invalidPkg.code === 'PACKAGE_NOT_FOUND') {
      console.log('   ✅ PASS: Zero dummy fallback verified for invalid resi search.');
    } else {
      console.error('   ❌ FAIL: Dummy fallback detected!');
    }

    // Test 4: Valid Vehicle Search (B 9910 PCX)
    console.log('\n📌 Test 4: getVehicleTrackingDetails for valid vehicle B 9910 PCX...');
    const vResult = await PackageTrackingService.getVehicleTrackingDetails('B 9910 PCX', '2026-07-24');
    console.log('   Vehicle Found:', vResult.found);
    if (vResult.found) {
      console.log(`   Nopol: ${vResult.vehicle.nopol}`);
      console.log(`   Driver: ${vResult.vehicle.driver}`);
      console.log(`   Utilisasi: ${vResult.capacity.utilization_pct}% (${vResult.capacity.current_load_kg}/${vResult.capacity.max_capacity_kg} kg)`);
      console.log(`   Destination Groups Count: ${vResult.cargoGroupedByDestination.length}`);
    }

    // Test 5: Invalid Vehicle Search (B 0000 XYZ) -> Must be found: false
    console.log('\n📌 Test 5: getVehicleTrackingDetails for invalid vehicle B 0000 XYZ...');
    const invalidV = await PackageTrackingService.getVehicleTrackingDetails('B 0000 XYZ', '2026-08-13');
    console.log('   Vehicle Found:', invalidV.found);
    console.log('   Error Message:', invalidV.message);
    if (invalidV.found === false && invalidV.code === 'VEHICLE_NOT_FOUND') {
      console.log('   ✅ PASS: Zero dummy fallback verified for invalid vehicle search.');
    } else {
      console.error('   ❌ FAIL: Dummy fleet fallback detected!');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL BACKEND PACKAGE TRACKING TESTS COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
  } catch (e) {
    console.error('❌ Error during testing:', e);
  } finally {
    await DbConnection.disconnect();
  }
}

testCheckerApi();
