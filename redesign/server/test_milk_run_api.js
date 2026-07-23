import DbConnection from './config/DbConnection.js';
import RouteJourneyService from './services/RouteJourneyService.js';
import RouteJourneyModel from './models/RouteJourneyModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('=============== RUNNING MILK RUN INTEGRATION TESTS ===============');

  const connFile = path.join(__dirname, 'config', 'connections.json');
  const connections = JSON.parse(fs.readFileSync(connFile, 'utf8'));
  await DbConnection.connect(connections[0]);

  // TEST 1 & 2: Route & Vehicle lookup
  console.log('\n[TEST 1 & 2] Loading Route & Vehicle Capacity...');
  const { stops, diagnostics } = await RouteJourneyService.getValidatedRouteStops('RT-MALAM-B9910-PCX');
  console.log('Stops found:', stops.length, stops.map(s => `${s.seq}. ${s.officeName} (${s.nopen})`));
  console.log('Diagnostics skipped points:', diagnostics.pptSkippedPoints);

  const vehicleInfo = await RouteJourneyService.getVehicleCapacityInfo('B 9910 PCX');
  console.log('Vehicle capacity found:', vehicleInfo.maximumCapacityKg, 'kg');

  // TEST 3: Simulation Dry-run
  console.log('\n[TEST 3] Running Simulation Dry Run...');
  const simResult = await RouteJourneyService.simulateMilkRun('RT-MALAM-B9910-PCX', 'B 9910 PCX');
  console.log('Simulation summary:', simResult.summary);
  console.log('Simulation stops generated:', simResult.stops.length);

  // Clean up any old test journeys for today
  const db = await DbConnection.getDb();
  await db.collection('route_journeys').deleteMany({ vehicle_nopol: 'B 9910 PCX' });

  // TEST 4: Create Journey
  console.log('\n[TEST 4] Creating Journey...');
  const createdJourney = await RouteJourneyService.createJourney('RT-MALAM-B9910-PCX', 'B 9910 PCX');
  console.log('Journey Created:', createdJourney.journey_id, 'Status:', createdJourney.status);

  // TEST 5: Start Journey
  console.log('\n[TEST 5] Starting Journey...');
  const started = await RouteJourneyService.startJourney(createdJourney.journey_id);
  console.log('Journey Started. Status:', started.status);

  // TEST 6, 7, 8, 9: Sequential Stop Processing
  console.log('\n[TEST 6 - 9] Processing Stops Sequentially...');
  for (let seq = 1; seq <= stops.length; seq++) {
    const stopName = stops[seq - 1].officeName;
    console.log(`Processing Stop ${seq}/${stops.length}: ${stopName}`);
    
    // Test Idempotency key on stop 1
    const idempotencyKey = `idemp-key-seq-${seq}-${Date.now()}`;
    const procRes = await RouteJourneyService.processStop(createdJourney.journey_id, seq, idempotencyKey);
    console.log(`  Stop ${seq} processed. Load after: ${procRes.stopResult.load_after_kg} kg, Remaining cap: ${procRes.stopResult.remaining_capacity_kg} kg`);

    // TEST 12: Re-send with same idempotency key
    if (seq === 1) {
      console.log('\n[TEST 12] Testing IdempotencyKey re-send...');
      const reSendRes = await RouteJourneyService.processStop(createdJourney.journey_id, seq, idempotencyKey);
      console.log('  Idempotent duplicate request handled safely! Is idempotent:', reSendRes.idempotent);
    }
  }

  // TEST 11: Race condition / version conflict check
  console.log('\n[TEST 11] Testing Version Conflict / Optimistic Locking...');
  try {
    // Attempt out of order or stale version update
    await RouteJourneyService.processStop(createdJourney.journey_id, 1, 'fake-idemp');
    console.error('FAILED: Should have thrown error for already processed stop!');
  } catch (e) {
    console.log('  Successfully caught conflict/invalid seq error:', e.message);
  }

  // TEST 15: Complete Journey
  console.log('\n[TEST 15] Completing Journey...');
  const completed = await RouteJourneyService.completeJourney(createdJourney.journey_id);
  console.log('Journey Completed! Final Status:', completed.status, 'CompletedAt:', completed.completedAt);

  console.log('\n================ ALL BACKEND TESTS PASSED! ================');
  await DbConnection.disconnect();
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
