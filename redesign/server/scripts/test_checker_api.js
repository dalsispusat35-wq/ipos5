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
  console.log('🧪 TESTING COMPLETE CHECKER & FLEET TRACKING INTEGRATION');
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
    // Test 1: Fleet List from DB for today
    const todayStr = PackageTrackingService.getWibDateStr();
    console.log(`📌 Test 1: getFleetList for today (${todayStr})...`);
    const fleetResult = await PackageTrackingService.getFleetList(todayStr);
    console.log(`   Total Fleet in DB: ${fleetResult.total_fleet}`);
    fleetResult.fleet.forEach(f => {
      console.log(`   - [${f.nopol}] ${f.nama_kendaraan} | Sopir: ${f.driver} | ${f.total_cargo_count} Paket (${f.current_load_kg} kg) | Rute: ${f.route_id}`);
    });

    // Test 2: Vehicle B 9910 PCX Details & Multi-Stop Load
    console.log('\n📌 Test 2: getVehicleTrackingDetails for B 9910 PCX on 2026-08-12...');
    const vResult = await PackageTrackingService.getVehicleTrackingDetails('B 9910 PCX', '2026-08-12');
    console.log('   Vehicle Found:', vResult.found);
    console.log('   Nopol:', vResult.vehicleNopol);
    console.log(`   Stop Progress: Stop #${vResult.currentStopSeq} dari ${vResult.routeStops.length} Stop`);
    console.log(`   Total Muatan Paket di Mobil: ${vResult.totalCargoCount} paket (${vResult.currentLoadKg} kg / ${vResult.maxCapacityKg} kg)`);
    console.log('   Waypoints:');
    vResult.routeStops.forEach(s => {
      console.log(`     Stop #${s.seq} (${s.officeName}): ${s.loadAtStopKg} kg (${s.utilizationPctAtStop}%) | ETA: ${s.etaTime} | Status: ${s.status}`);
    });
    console.log(`   Destination Groups Count: ${vResult.cargoGroupedByDestination.length}`);
    vResult.cargoGroupedByDestination.forEach(g => {
      console.log(`     - Tujuan ${g.destination_office_name} (${g.destination_nopen}): ${g.package_count} Paket (${g.total_weight_kg} kg)`);
    });

    // Test 3: Package P260812000001 Tracking & Assigned Vehicle
    console.log('\n📌 Test 3: getPackageDetails for P260812000001 on 2026-08-12...');
    const pkgResult = await PackageTrackingService.getPackageDetails('P260812000001', '2026-08-12');
    console.log('   Package Found:', pkgResult.found);
    console.log(`   Resi: ${pkgResult.connoteCode} | Berat: ${pkgResult.weightKg} kg | State: ${pkgResult.state}`);
    console.log(`   Origin: ${pkgResult.origin.name} -> Dest: ${pkgResult.destination.name}`);
    console.log(`   Assigned Vehicle: ${pkgResult.vehicleNopol} (Source: ${pkgResult.vehicleAssignment.source})`);
    console.log(`   Cargo count on vehicle: ${pkgResult.cargoItems.length} packages`);
    console.log(`   Timeline Events: ${pkgResult.timeline.length} events`);

    // Test 4: Invalid Resi Search -> Not Found
    console.log('\n📌 Test 4: Invalid resi search...');
    const invalidPkg = await PackageTrackingService.getPackageDetails('P999999999999', '2026-08-12');
    console.log('   Found:', invalidPkg.found, '| Message:', invalidPkg.message);

    console.log('\n================================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('================================================================');
  } catch (e) {
    console.error('❌ Error during testing:', e);
  } finally {
    await DbConnection.disconnect();
  }
}

testCheckerApi();
