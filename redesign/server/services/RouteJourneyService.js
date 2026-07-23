import RouteJourneyModel from '../models/RouteJourneyModel.js';
import DbConnection from '../config/DbConnection.js';
import { validateStateTransition } from '../controllers/ManifestController.js';

class RouteJourneyService {
  // Helper to parse weight safely in kg
  parseWeightKg(tx) {
    if (!tx) return 0;
    const connoteObj = tx.connote || {};
    
    // Priority: 1. connote.actual_weight, 2. actual_weight, 3. connote.weight, 4. weight
    let rawWeight = connoteObj.actual_weight;
    if (rawWeight === undefined || rawWeight === null || rawWeight === '') rawWeight = tx.actual_weight;
    if (rawWeight === undefined || rawWeight === null || rawWeight === '') rawWeight = connoteObj.weight;
    if (rawWeight === undefined || rawWeight === null || rawWeight === '') rawWeight = tx.weight;

    if (rawWeight === undefined || rawWeight === null || rawWeight === '') return 0;

    const num = Number(rawWeight);
    if (isNaN(num) || !isFinite(num) || num < 0) return 0;
    return num;
  }

  // Helper to parse created_at for sorting
  parseCreatedAt(tx) {
    const rawStr = tx?.connote?.created_at || tx?.created_at || tx?.createdAt;
    if (!rawStr) return 0;
    if (rawStr instanceof Date) return rawStr.getTime();
    
    // Format: "15/07/2026 09:44" or ISO string
    if (typeof rawStr === 'string' && rawStr.includes('/')) {
      const parts = rawStr.split(' ');
      const dateParts = parts[0].split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        let hour = 0, min = 0;
        if (parts[1]) {
          const timeParts = parts[1].split(':');
          hour = parseInt(timeParts[0], 10) || 0;
          min = parseInt(timeParts[1], 10) || 0;
        }
        return new Date(year, month, day, hour, min).getTime();
      }
    }
    const d = new Date(rawStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  // Normalize nopen / nopend code
  normalizeCode(val) {
    return String(val ?? '').trim();
  }

  // Extract origin nopen
  getOriginNopen(tx) {
    const locCreated = tx?.location_data_created?.custom_field || {};
    const custom = tx?.custom_field || {};
    
    return this.normalizeCode(
      locCreated.nopen ||
      locCreated.nopend ||
      custom.origin_nopen ||
      tx?.origin_nopen
    );
  }

  // Extract destination nopen
  getDestinationNopen(tx) {
    const custom = tx?.custom_field || {};
    const locCreated = tx?.location_data_created?.custom_field || {};

    return this.normalizeCode(
      custom.destination_nopen ||
      locCreated.destination_nopen ||
      custom.destination_kprk ||
      locCreated.destination_kprk
    );
  }

  // Get Vehicle & Capacity
  async getVehicleCapacityInfo(requestedNopol = 'B 9910 PCX') {
    const cleanReq = requestedNopol.replace(/\s+/g, ' ').trim().toUpperCase();
    const vehicleDoc = await RouteJourneyModel.getVehicle(cleanReq);

    if (!vehicleDoc) {
      const err = new Error(`Kendaraan "${requestedNopol}" tidak ditemukan pada master_kendaraan.`);
      err.code = 'VEHICLE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    let maxCapKg = 0;
    if (vehicleDoc.kapasitas_kg && Number(vehicleDoc.kapasitas_kg) > 0) {
      maxCapKg = Number(vehicleDoc.kapasitas_kg);
    } else if (vehicleDoc.max_capacity_kg && Number(vehicleDoc.max_capacity_kg) > 0) {
      maxCapKg = Number(vehicleDoc.max_capacity_kg);
    } else if (vehicleDoc.kapasitas && Number(vehicleDoc.kapasitas) > 0) {
      maxCapKg = Number(vehicleDoc.kapasitas);
    } else if (vehicleDoc.daya_angkut_kg && Number(vehicleDoc.daya_angkut_kg) > 0) {
      maxCapKg = Number(vehicleDoc.daya_angkut_kg);
    } else if (vehicleDoc.kapasitas_ton && Number(vehicleDoc.kapasitas_ton) > 0) {
      maxCapKg = Number(vehicleDoc.kapasitas_ton) * 1000;
    }

    if (!maxCapKg || maxCapKg <= 0 || isNaN(maxCapKg)) {
      const err = new Error(`Kapasitas kendaraan "${requestedNopol}" belum dikonfigurasi secara valid.`);
      err.code = 'VEHICLE_CAPACITY_NOT_CONFIGURED';
      err.statusCode = 422;
      throw err;
    }

    const resolvedNopol = vehicleDoc.nopol || requestedNopol;
    const aliasUsed = resolvedNopol.toUpperCase().replace(/\s+/g, '') !== cleanReq.replace(/\s+/g, '');

    return {
      vehicleDoc,
      requestedNopol,
      resolvedNopol,
      aliasUsed,
      aliasSource: aliasUsed ? 'master_kendaraan' : null,
      maximumCapacityKg: maxCapKg
    };
  }

  // Build Route Stops list from detail_route and master_kantor
  async getValidatedRouteStops(routeId = 'RT-MALAM-B9910-PCX') {
    if (routeId !== 'RT-MALAM-B9910-PCX') {
      const err = new Error(`Route ID "${routeId}" tidak didukung. Fitur ini khusus RT-MALAM-B9910-PCX.`);
      err.code = 'ROUTE_NOT_FOUND';
      err.statusCode = 400;
      throw err;
    }

    const segments = await RouteJourneyModel.getRouteStops(routeId);
    if (!segments || segments.length === 0) {
      const err = new Error(`Detail route untuk "${routeId}" tidak ditemukan atau tidak AKTIF.`);
      err.code = 'ROUTE_DETAIL_EMPTY';
      err.statusCode = 404;
      throw err;
    }

    // Collect nopends in order
    const orderedNopends = [];
    if (segments[0]?.asal_nopen) orderedNopends.push(this.normalizeCode(segments[0].asal_nopen));
    for (const seg of segments) {
      if (seg.tujuan_nopen) {
        orderedNopends.push(this.normalizeCode(seg.tujuan_nopen));
      }
    }

    const uniqueNopends = [...new Set(orderedNopends)];
    const offices = await RouteJourneyModel.getOfficesByCodes(uniqueNopends);
    const officeMap = new Map();
    offices.forEach(o => officeMap.set(this.normalizeCode(o.nopend), o));

    const stops = [];
    for (let i = 0; i < uniqueNopends.length; i++) {
      const nopen = uniqueNopends[i];
      const office = officeMap.get(nopen);
      const seq = i + 1;
      let role = 'TRANSIT';
      if (seq === 1) role = 'ORIGIN';
      if (seq === uniqueNopends.length) role = 'DESTINATION';

      stops.push({
        seq,
        nopen,
        officeName: office ? (office.nama_nopend || office.nama || nopen) : `OFFICE ${nopen}`,
        role
      });
    }

    const diagnostics = {
      pptSkippedPoints: [
        { pointName: 'AGP ONG', reason: 'SKIPPED_NOT_CONFIGURED' },
        { pointName: 'AGP Omega', reason: 'SKIPPED_NOT_CONFIGURED' }
      ]
    };

    return { stops, segments, diagnostics };
  }

  // Dry Run Simulation
  async simulateMilkRun(routeId = 'RT-MALAM-B9910-PCX', requestedNopol = 'B 9910 PCX') {
    const vehicleInfo = await this.getVehicleCapacityInfo(requestedNopol);
    const { stops, diagnostics } = await this.getValidatedRouteStops(routeId);

    const maximumCapacityKg = vehicleInfo.maximumCapacityKg;
    let currentCargo = []; // Array of active cargo items { connote_code, weight_kg, origin_nopen, destination_nopen }
    let currentLoadKg = 0;
    let peakLoadKg = 0;
    let lowestRemainingCapacityKg = maximumCapacityKg;

    let totalLoadedCount = 0;
    let totalLoadedWeightKg = 0;
    let totalUnloadedCount = 0;
    let totalUnloadedWeightKg = 0;
    let totalRejectedCount = 0;

    const stopResults = [];

    for (const stop of stops) {
      const loadBeforeKg = currentLoadKg;
      let remainingCapacityKg = maximumCapacityKg - currentLoadKg;

      // A. BARANG TURUN (Unload)
      const unloadingItems = currentCargo.filter(c => c.destination_nopen === stop.nopen);
      const unloadedCount = unloadingItems.length;
      const unloadedWeightKg = unloadingItems.reduce((acc, cur) => acc + cur.weight_kg, 0);

      // Remove unloaded items from active cargo
      currentCargo = currentCargo.filter(c => c.destination_nopen !== stop.nopen);
      currentLoadKg -= unloadedWeightKg;
      if (currentLoadKg < 0) currentLoadKg = 0;
      remainingCapacityKg = maximumCapacityKg - currentLoadKg;

      totalUnloadedCount += unloadedCount;
      totalUnloadedWeightKg += unloadedWeightKg;

      // B. BARANG NAIK (Load candidates)
      const dbTxList = await RouteJourneyModel.getEligibleTransactions(stop.nopen);
      
      // Sort candidates deterministically: created_at ASC, connote_code ASC
      dbTxList.sort((a, b) => {
        const timeA = this.parseCreatedAt(a);
        const timeB = this.parseCreatedAt(b);
        if (timeA !== timeB) return timeA - timeB;
        const codeA = a.connote?.connote_code || a.connote_code || '';
        const codeB = b.connote?.connote_code || b.connote_code || '';
        return codeA.localeCompare(codeB);
      });

      const acceptedItems = [];
      const rejectedItems = [];
      let stopLoadedWeightKg = 0;

      for (const tx of dbTxList) {
        const connoteCode = tx.connote?.connote_code || tx.connote_code;
        if (!connoteCode) continue;

        // Skip if already in cargo
        if (currentCargo.some(c => c.connote_code === connoteCode)) continue;

        const weightKg = this.parseWeightKg(tx);
        if (weightKg <= 0) {
          rejectedItems.push({
            connote_code: connoteCode,
            weight_kg: weightKg,
            reason: 'INVALID_WEIGHT'
          });
          totalRejectedCount++;
          continue;
        }

        // Validate state transition to INVEHICLE
        const currentState = tx.connote?.connote_state || tx.connote_state || '';
        let validState = false;
        try {
          // If state is CANCEL or DELIVERED, fail transition
          const normState = String(currentState).toUpperCase().trim();
          if (normState === 'CANCEL' || normState === 'DELIVERED') {
            throw new Error(`Connote in state ${normState}`);
          }
          validState = true;
        } catch (e) {
          validState = false;
        }

        if (!validState) {
          rejectedItems.push({
            connote_code: connoteCode,
            weight_kg: weightKg,
            reason: 'STATE_TRANSITION_REJECTED'
          });
          totalRejectedCount++;
          continue;
        }

        // Check capacity
        if (weightKg <= remainingCapacityKg) {
          remainingCapacityKg -= weightKg;
          currentLoadKg += weightKg;
          stopLoadedWeightKg += weightKg;

          const cargoItem = {
            connote_code: connoteCode,
            weight_kg: weightKg,
            origin_nopen: stop.nopen,
            destination_nopen: this.getDestinationNopen(tx) || '40400',
            loaded_at_nopen: stop.nopen,
            loaded_at: new Date()
          };

          currentCargo.push(cargoItem);
          acceptedItems.push(cargoItem);
        } else {
          rejectedItems.push({
            connote_code: connoteCode,
            weight_kg: weightKg,
            reason: 'CAPACITY_EXCEEDED'
          });
          totalRejectedCount++;
        }
      }

      const loadedCount = acceptedItems.length;
      totalLoadedCount += loadedCount;
      totalLoadedWeightKg += stopLoadedWeightKg;

      if (currentLoadKg > peakLoadKg) peakLoadKg = currentLoadKg;
      if (remainingCapacityKg < lowestRemainingCapacityKg) lowestRemainingCapacityKg = remainingCapacityKg;

      const capacityUsedPercent = Number(((currentLoadKg / maximumCapacityKg) * 100).toFixed(2));

      stopResults.push({
        seq: stop.seq,
        nopen: stop.nopen,
        officeName: stop.officeName,
        role: stop.role,
        loadBeforeKg,
        unloadedCount,
        unloadedWeightKg,
        loadedCount,
        loadedWeightKg: stopLoadedWeightKg,
        loadAfterKg: currentLoadKg,
        remainingCapacityKg,
        capacityUsedPercent,
        acceptedItems,
        rejectedItems
      });
    }

    return {
      mode: 'SIMULATION',
      routeId,
      vehicle: {
        requestedNopol: vehicleInfo.requestedNopol,
        resolvedNopol: vehicleInfo.resolvedNopol,
        aliasUsed: vehicleInfo.aliasUsed,
        aliasSource: vehicleInfo.aliasSource,
        maximumCapacityKg: vehicleInfo.maximumCapacityKg
      },
      diagnostics,
      summary: {
        totalStops: stops.length,
        totalLoadedCount,
        totalLoadedWeightKg,
        totalUnloadedCount,
        totalUnloadedWeightKg,
        totalRejectedCount,
        peakLoadKg,
        lowestRemainingCapacityKg
      },
      stops: stopResults
    };
  }

  // Create new Journey document
  async createJourney(routeId = 'RT-MALAM-B9910-PCX', requestedNopol = 'B 9910 PCX', journeyDate = new Date()) {
    const vehicleInfo = await this.getVehicleCapacityInfo(requestedNopol);
    const { stops } = await this.getValidatedRouteStops(routeId);

    const activeExisting = await RouteJourneyModel.findActiveByVehicle(vehicleInfo.resolvedNopol, journeyDate);
    if (activeExisting) {
      const err = new Error(`Perjalanan aktif untuk kendaraan "${vehicleInfo.resolvedNopol}" sudah ada (Journey ID: ${activeExisting.journey_id}).`);
      err.code = 'JOURNEY_ALREADY_ACTIVE';
      err.statusCode = 409;
      err.activeJourney = activeExisting;
      throw err;
    }

    const journeyId = await RouteJourneyModel.generateJourneyId(journeyDate, vehicleInfo.resolvedNopol);

    const newDoc = {
      journey_id: journeyId,
      route_id: routeId,
      vehicle_nopol: vehicleInfo.requestedNopol,
      resolved_vehicle_nopol: vehicleInfo.resolvedNopol,
      journey_date: new Date(journeyDate),
      shift: 'MALAM',
      scheduled_start: '16:00',
      scheduled_end: '21:00',
      status: 'READY',
      current_seq: 1,
      current_nopen: stops[0]?.nopen || null,
      maximum_capacity_kg: vehicleInfo.maximumCapacityKg,
      current_load_kg: 0,
      remaining_capacity_kg: vehicleInfo.maximumCapacityKg,
      cargo: [],
      processed_stops: [],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    };

    await RouteJourneyModel.insertOne(newDoc);
    return newDoc;
  }

  // Start Journey (READY -> IN_PROGRESS)
  async startJourney(journeyId) {
    const journey = await RouteJourneyModel.findByJourneyId(journeyId);
    if (!journey) {
      const err = new Error(`Journey ID "${journeyId}" tidak ditemukan.`);
      err.code = 'JOURNEY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (journey.status !== 'READY' && journey.status !== 'DRAFT') {
      const err = new Error(`Status journey saat ini adalah "${journey.status}", tidak dapat dimulai.`);
      err.code = 'JOURNEY_NOT_READY';
      err.statusCode = 400;
      throw err;
    }

    const updateRes = await RouteJourneyModel.updateOne(
      { journey_id: journeyId, status: journey.status },
      { $set: { status: 'IN_PROGRESS', startedAt: new Date() } }
    );

    if (updateRes.matchedCount === 0) {
      const err = new Error('Gagal memulai journey, status telah berubah.');
      err.code = 'JOURNEY_VERSION_CONFLICT';
      err.statusCode = 409;
      throw err;
    }

    return await RouteJourneyModel.findByJourneyId(journeyId);
  }

  // Process a Stop with MongoDB ACID Session Transaction & Optimistic Locking
  async processStop(journeyId, targetSeq, idempotencyKey = null) {
    const { stops } = await this.getValidatedRouteStops('RT-MALAM-B9910-PCX');
    const seqNum = Number(targetSeq);

    const targetStop = stops.find(s => s.seq === seqNum);
    if (!targetStop) {
      const err = new Error(`Sequence stop "${targetSeq}" tidak valid dalam rute.`);
      err.code = 'INVALID_STOP_SEQUENCE';
      err.statusCode = 400;
      throw err;
    }

    // Read journey first to check status & idempotency
    const initialJourney = await RouteJourneyModel.findByJourneyId(journeyId);
    if (!initialJourney) {
      const err = new Error(`Journey ID "${journeyId}" tidak ditemukan.`);
      err.code = 'JOURNEY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (initialJourney.status !== 'IN_PROGRESS') {
      const err = new Error(`Journey harus berstatus "IN_PROGRESS". Status saat ini: "${initialJourney.status}".`);
      err.code = 'JOURNEY_NOT_IN_PROGRESS';
      err.statusCode = 400;
      throw err;
    }

    // Idempotency check
    if (idempotencyKey) {
      const alreadyProcessed = (initialJourney.processed_stops || []).find(
        ps => ps.idempotencyKey === idempotencyKey
      );
      if (alreadyProcessed) {
        return {
          idempotent: true,
          journey: initialJourney,
          stopResult: alreadyProcessed
        };
      }
    }

    // Check stop sequence order
    if (initialJourney.processed_stops && initialJourney.processed_stops.some(ps => ps.seq === seqNum)) {
      const err = new Error(`Stop seq ${seqNum} (${targetStop.officeName}) sudah pernah diproses.`);
      err.code = 'STOP_ALREADY_PROCESSED';
      err.statusCode = 409;
      throw err;
    }

    const expectedSeq = initialJourney.processed_stops ? initialJourney.processed_stops.length + 1 : 1;
    if (seqNum !== expectedSeq) {
      const err = new Error(`Stop harus diproses secara berurutan. Diharapkan seq ${expectedSeq}, tetapi menerima seq ${seqNum}.`);
      err.code = 'INVALID_STOP_SEQUENCE';
      err.statusCode = 400;
      throw err;
    }

    // ACID Transaction Execution
    const client = await DbConnection.getClient();
    const db = await DbConnection.getDb();
    const session = client.startSession();

    let finalJourneyResult = null;
    let finalStopResult = null;

    try {
      await session.withTransaction(async () => {
        // 1. Lock & re-verify optimistic version
        const journeyDoc = await db.collection('route_journeys').findOne(
          { journey_id: journeyId },
          { session }
        );

        if (!journeyDoc) {
          throw new Error('JOURNEY_NOT_FOUND');
        }

        if (journeyDoc.version !== initialJourney.version) {
          const err = new Error('Konflik versi journey (optimistic locking). Terjadi perubahan bersamaan.');
          err.code = 'JOURNEY_VERSION_CONFLICT';
          throw err;
        }

        const maxCapKg = journeyDoc.maximum_capacity_kg;
        let currentCargo = [...(journeyDoc.cargo || [])];
        let currentLoadKg = journeyDoc.current_load_kg || 0;
        const loadBeforeKg = currentLoadKg;
        let remainingCapKg = maxCapKg - currentLoadKg;

        // A. BARANG TURUN (Unload)
        const unloadingItems = currentCargo.filter(c => c.destination_nopen === targetStop.nopen);
        const unloadedCount = unloadingItems.length;
        const unloadedWeightKg = unloadingItems.reduce((acc, cur) => acc + cur.weight_kg, 0);

        const now = new Date();
        const txOperations = [];

        for (const item of unloadingItems) {
          const targetState = (targetStop.nopen === '40400') ? 'TRANSIT_SPP_BANDUNG' : 'INLOCATION';
          txOperations.push({
            updateOne: {
              filter: {
                $or: [
                  { connote_code: item.connote_code },
                  { 'connote.connote_code': item.connote_code }
                ]
              },
              update: {
                $set: {
                  'connote.connote_state': targetState,
                  connote_state: targetState,
                  updatedAt: now
                },
                $push: {
                  tracking_history: {
                    event: 'MILK_RUN_UNLOADED',
                    from: 'INVEHICLE',
                    to: targetState,
                    location_nopen: targetStop.nopen,
                    location_name: targetStop.officeName,
                    route_id: journeyDoc.route_id,
                    journey_id: journeyDoc.journey_id,
                    vehicle_nopol: journeyDoc.resolved_vehicle_nopol,
                    weight_kg: item.weight_kg,
                    changedAt: now,
                    source: 'DYNAMIC_CAPACITY_ROUTING'
                  }
                }
              }
            }
          });
        }

        // Remove unloaded items from current cargo in memory
        currentCargo = currentCargo.filter(c => c.destination_nopen !== targetStop.nopen);
        currentLoadKg -= unloadedWeightKg;
        if (currentLoadKg < 0) currentLoadKg = 0;
        remainingCapKg = maxCapKg - currentLoadKg;

        // B. BARANG NAIK (Load)
        const candidateTxs = await db.collection('transaksi').find({
          $or: [
            { 'location_data_created.custom_field.nopen': targetStop.nopen },
            { 'location_data_created.custom_field.nopend': targetStop.nopen },
            { 'custom_field.origin_nopen': targetStop.nopen },
            { 'origin_nopen': targetStop.nopen }
          ]
        }, { session }).toArray();

        candidateTxs.sort((a, b) => {
          const timeA = this.parseCreatedAt(a);
          const timeB = this.parseCreatedAt(b);
          if (timeA !== timeB) return timeA - timeB;
          const codeA = a.connote?.connote_code || a.connote_code || '';
          const codeB = b.connote?.connote_code || b.connote_code || '';
          return codeA.localeCompare(codeB);
        });

        const acceptedItems = [];
        const rejectedItems = [];
        let stopLoadedWeightKg = 0;

        for (const tx of candidateTxs) {
          const connoteCode = tx.connote?.connote_code || tx.connote_code;
          if (!connoteCode) continue;

          if (currentCargo.some(c => c.connote_code === connoteCode)) continue;

          const weightKg = this.parseWeightKg(tx);
          if (weightKg <= 0) {
            rejectedItems.push({
              connote_code: connoteCode,
              weight_kg: weightKg,
              reason: 'INVALID_WEIGHT'
            });
            continue;
          }

          const currentState = tx.connote?.connote_state || tx.connote_state || '';
          const normState = String(currentState).toUpperCase().trim();
          if (normState === 'CANCEL' || normState === 'DELIVERED') {
            rejectedItems.push({
              connote_code: connoteCode,
              weight_kg: weightKg,
              reason: 'STATE_TRANSITION_REJECTED'
            });
            continue;
          }

          if (weightKg <= remainingCapKg) {
            remainingCapKg -= weightKg;
            currentLoadKg += weightKg;
            stopLoadedWeightKg += weightKg;

            const destNopen = this.getDestinationNopen(tx) || '40400';
            const cargoItem = {
              connote_code: connoteCode,
              weight_kg: weightKg,
              origin_nopen: targetStop.nopen,
              destination_nopen: destNopen,
              loaded_at_nopen: targetStop.nopen,
              loaded_at: now
            };

            currentCargo.push(cargoItem);
            acceptedItems.push(cargoItem);

            txOperations.push({
              updateOne: {
                filter: {
                  $or: [
                    { connote_code: connoteCode },
                    { 'connote.connote_code': connoteCode }
                  ]
                },
                update: {
                  $set: {
                    'connote.connote_state': 'INVEHICLE',
                    connote_state: 'INVEHICLE',
                    updatedAt: now
                  },
                  $push: {
                    tracking_history: {
                      event: 'MILK_RUN_LOADED',
                      from: currentState || 'INITIAL',
                      to: 'INVEHICLE',
                      location_nopen: targetStop.nopen,
                      location_name: targetStop.officeName,
                      route_id: journeyDoc.route_id,
                      journey_id: journeyDoc.journey_id,
                      vehicle_nopol: journeyDoc.resolved_vehicle_nopol,
                      weight_kg: weightKg,
                      changedAt: now,
                      source: 'DYNAMIC_CAPACITY_ROUTING'
                    }
                  }
                }
              }
            });
          } else {
            rejectedItems.push({
              connote_code: connoteCode,
              weight_kg: weightKg,
              reason: 'CAPACITY_EXCEEDED'
            });
          }
        }

        // Perform bulkWrite for transactions
        if (txOperations.length > 0) {
          const bulkRes = await db.collection('transaksi').bulkWrite(txOperations, { session, ordered: false });
          if (bulkRes.matchedCount !== txOperations.length) {
            throw new Error(`Bulk write mismatch: Expected ${txOperations.length}, updated ${bulkRes.matchedCount}`);
          }
        }

        const capacityUsedPercent = Number(((currentLoadKg / maxCapKg) * 100).toFixed(2));

        const stopSummaryRecord = {
          seq: targetStop.seq,
          nopen: targetStop.nopen,
          officeName: targetStop.officeName,
          role: targetStop.role,
          idempotencyKey,
          arrived_at: now,
          departed_at: now,
          load_before_kg: loadBeforeKg,
          unloaded_count: unloadedCount,
          unloaded_weight_kg: unloadedWeightKg,
          loaded_count: acceptedItems.length,
          loaded_weight_kg: stopLoadedWeightKg,
          load_after_kg: currentLoadKg,
          remaining_capacity_kg: remainingCapKg,
          capacity_used_percent: capacityUsedPercent,
          acceptedItems,
          rejectedItems
        };

        // Update journey document with optimistic locking filter
        const updateJourneyResult = await db.collection('route_journeys').updateOne(
          {
            journey_id: journeyId,
            version: journeyDoc.version,
            status: 'IN_PROGRESS'
          },
          {
            $set: {
              current_seq: targetStop.seq,
              current_nopen: targetStop.nopen,
              cargo: currentCargo,
              current_load_kg: currentLoadKg,
              remaining_capacity_kg: remainingCapKg,
              updatedAt: now
            },
            $push: {
              processed_stops: stopSummaryRecord
            },
            $inc: { version: 1 }
          },
          { session }
        );

        if (updateJourneyResult.matchedCount === 0) {
          const err = new Error('JOURNEY_VERSION_CONFLICT');
          err.statusCode = 409;
          throw err;
        }

        finalStopResult = stopSummaryRecord;
      }, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary'
      });

      finalJourneyResult = await RouteJourneyModel.findByJourneyId(journeyId);
      return {
        success: true,
        journey: finalJourneyResult,
        stopResult: finalStopResult
      };
    } catch (err) {
      if (err.message === 'Transaction numbers are only allowed on a replica set member or mongos') {
        const customErr = new Error('MongoDB ACID Transaction tidak didukung karena MongoDB bukan Replica Set.');
        customErr.code = 'TRANSACTION_NOT_SUPPORTED';
        customErr.statusCode = 503;
        throw customErr;
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // Complete Journey (must be at final stop 40400)
  async completeJourney(journeyId) {
    const journey = await RouteJourneyModel.findByJourneyId(journeyId);
    if (!journey) {
      const err = new Error(`Journey ID "${journeyId}" tidak ditemukan.`);
      err.code = 'JOURNEY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (journey.status !== 'IN_PROGRESS') {
      const err = new Error(`Journey harus berstatus "IN_PROGRESS" untuk diselesaikan. Status saat ini: "${journey.status}".`);
      err.code = 'JOURNEY_NOT_IN_PROGRESS';
      err.statusCode = 400;
      throw err;
    }

    const { stops } = await this.getValidatedRouteStops('RT-MALAM-B9910-PCX');
    const finalStop = stops[stops.length - 1];

    if (journey.current_seq !== finalStop.seq || journey.current_nopen !== finalStop.nopen) {
      const err = new Error(`Perjalanan belum mencapai titik akhir (${finalStop.officeName} / ${finalStop.nopen}). Selesai ditolak.`);
      err.code = 'INVALID_STOP_SEQUENCE';
      err.statusCode = 400;
      throw err;
    }

    // Ensure cargo remaining to drop off at 40400 is empty
    const remainingFor40400 = (journey.cargo || []).filter(c => c.destination_nopen === finalStop.nopen);
    if (remainingFor40400.length > 0) {
      const err = new Error(`Masih terdapat ${remainingFor40400.length} muatan di kendaraan yang belum dibongkar di SPP Bandung 40400.`);
      err.code = 'CARGO_NOT_EMPTY';
      err.statusCode = 400;
      throw err;
    }

    await RouteJourneyModel.updateOne(
      { journey_id: journeyId, status: 'IN_PROGRESS' },
      {
        $set: {
          status: 'COMPLETED',
          completedAt: new Date()
        },
        $inc: { version: 1 }
      }
    );

    return await RouteJourneyModel.findByJourneyId(journeyId);
  }

  // Cancel Journey
  async cancelJourney(journeyId, reason = 'Dibatalkan oleh operator') {
    const journey = await RouteJourneyModel.findByJourneyId(journeyId);
    if (!journey) {
      const err = new Error(`Journey ID "${journeyId}" tidak ditemukan.`);
      err.code = 'JOURNEY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (journey.status === 'COMPLETED' || journey.status === 'CANCELLED') {
      const err = new Error(`Journey dengan status "${journey.status}" tidak dapat dibatalkan.`);
      err.code = 'JOURNEY_STATE_INVALID';
      err.statusCode = 400;
      throw err;
    }

    await RouteJourneyModel.updateOne(
      { journey_id: journeyId },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason
        },
        $inc: { version: 1 }
      }
    );

    return await RouteJourneyModel.findByJourneyId(journeyId);
  }
}

export default new RouteJourneyService();
