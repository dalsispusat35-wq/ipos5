import DbConnection from '../config/DbConnection.js';

class PackageTrackingService {
  /**
   * Helper to format Date to YYYY-MM-DD in Asia/Jakarta timezone.
   */
  getWibDateStr(dateInput = new Date()) {
    try {
      const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (isNaN(d.getTime())) {
        const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
        return todayStr;
      }
      return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  /**
   * Safe weight parser in kg.
   */
  parseWeightKg(tx) {
    if (!tx) return 1.0;
    const connoteObj = tx.connote || {};
    let rawWeight = connoteObj.actual_weight ?? tx.actual_weight ?? connoteObj.weight ?? tx.weight;
    if (rawWeight === undefined || rawWeight === null || rawWeight === '') return 1.0;
    const num = Number(rawWeight);
    return isNaN(num) || !isFinite(num) || num <= 0 ? 1.0 : Number(num.toFixed(2));
  }

  /**
   * Normalize office codes (nopend, 5-7 digits).
   */
  normalizeCode(val) {
    return String(val ?? '').trim();
  }

  /**
   * Map database state string to standardized tracking state.
   */
  normalizeState(stateStr) {
    if (!stateStr) return 'ENTRY';
    const s = String(stateStr).toUpperCase().trim();
    if (s.includes('DELIVERED') || s.includes('SELESAI') || s.includes('SUKSES')) return 'DELIVERED';
    if (s.includes('RETURN') || s.includes('RETUR') || s.includes('GAGAL') || s.includes('CANCEL')) return 'RETURNED';
    if (s.includes('HOLD') || s.includes('PENDING')) return 'ON_HOLD';
    if (s.includes('UNLOADED') || s.includes('BONGKAR')) return 'UNLOADED';
    if (s.includes('ARRIVED') || s.includes('TIBA') || s.includes('GATE_IN')) return 'ARRIVED';
    if (s.includes('DEPARTED') || s.includes('IN_TRANSIT') || s.includes('TRANSIT') || s.includes('GATE_OUT')) return 'IN_TRANSIT';
    if (s.includes('LOADED') || s.includes('MUAT')) return 'LOADED';
    if (s.includes('MANIFEST')) return 'MANIFESTED';
    if (s.includes('SCANNED') || s.includes('SCAN')) return 'SCANNED';
    return 'ENTRY';
  }

  /**
   * Extract origin nopen from multiple possible nested schema fields.
   */
  getOriginNopen(tx) {
    if (!tx) return '40511';
    const connoteObj = tx.connote || {};
    const locCreated = tx.location_data_created?.custom_field || {};
    const custom = tx.custom_field || {};
    const code = connoteObj.origin_nopen || 
                 connoteObj.connote_origin_nopend || 
                 connoteObj.origin_kprk ||
                 locCreated.nopen || 
                 locCreated.nopend || 
                 locCreated.origin_nopen || 
                 custom.origin_nopen || 
                 custom.origin_kprk || 
                 tx.origin_nopen;
    return this.normalizeCode(code) || '40511';
  }

  /**
   * Extract destination nopen from multiple possible nested schema fields.
   */
  getDestinationNopen(tx) {
    if (!tx) return '40400';
    const connoteObj = tx.connote || {};
    const locCreated = tx.location_data_created?.custom_field || {};
    const custom = tx.custom_field || {};
    const code = connoteObj.destination_nopen || 
                 connoteObj.connote_destination_nopend || 
                 connoteObj.destination_kprk ||
                 custom.destination_nopen || 
                 locCreated.destination_nopen || 
                 custom.destination_kprk || 
                 tx.destination_nopen;
    return this.normalizeCode(code) || '40400';
  }

  /**
   * Batch lookup office names & GPS coordinates from master_kantor collection.
   */
  async lookupOfficeNames(db, nopendList = []) {
    const cleanCodes = [...new Set(nopendList.map(c => this.normalizeCode(c)).filter(Boolean))];
    if (cleanCodes.length === 0) return new Map();

    const offices = await db.collection('master_kantor')
      .find({ nopend: { $in: cleanCodes } })
      .toArray();

    const officeMap = new Map();
    for (const off of offices) {
      const codeKey = String(off.nopend).trim();
      officeMap.set(codeKey, {
        nopend: codeKey,
        name: off.nama_nopend || off.nama_kantor || `Kantor ${off.nopend}`,
        type: off.tipe || off.tipe_kantor || 'KCP',
        regional: off.kdregional || '-',
        latitude: off.latitude || null,
        longitude: off.longitude || null,
        alamat: off.alamat || off.address || ''
      });
    }
    return officeMap;
  }

  /**
   * Intelligent helper to determine feeder vehicle & route based on Origin Nopend.
   */
  getCorridorVehicleFallback(originNopen) {
    const code = String(originNopen || '').trim();
    // Koridor Barat & Utara
    if (['40184U5', '40215C6', '40351U2', '40116A', '40115B', '40114A'].includes(code)) {
      return {
        vehicle_nopol: 'D 8812 AB',
        route_id: 'RT-MALAM-D8812-AB',
        nama_route: 'Rute Malam Feeder Barat & Utara (D 8812 AB) -> SPP Bandung'
      };
    }
    // Koridor Pusat & Timur
    if (['40000', '40115A', '40122B', '40122D1', '40123A', '40100'].includes(code)) {
      return {
        vehicle_nopol: 'B 9945 PCY',
        route_id: 'RT-MALAM-B9945-PCY',
        nama_route: 'Rute Malam Feeder Timur & Pusat (B 9945 PCY) -> SPP Bandung'
      };
    }
    // Koridor Cimahi Raya (Default)
    return {
      vehicle_nopol: 'B 9910 PCX',
      route_id: 'RT-MALAM-B9910-PCX',
      nama_route: 'Rute Malam Feeder Cimahi Raya (B 9910 PCX) -> SPP Bandung'
    };
  }

  /**
   * MODE 0: Get Fleet List of Vehicles from Database with live journey and cargo info.
   */
  async getFleetList(dateStrInput) {
    const dateStr = dateStrInput || this.getWibDateStr();
    const db = await DbConnection.getDb();

    const startDate = new Date(`${dateStr}T00:00:00.000+07:00`);
    const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);

    // 1. Fetch all vehicles from master_kendaraan
    const vehicles = await db.collection('master_kendaraan').find({}).sort({ nopol: 1 }).toArray();

    // 2. Fetch all journeys STRICTLY for that operational date
    const journeys = await db.collection('route_journeys').find({
      $or: [
        { tanggal_operasional: dateStr },
        { journey_date: { $gte: startDate, $lte: endDate } },
        { journey_id: { $regex: dateStr.replace(/-/g, '') } }
      ]
    }).toArray();

    // Index journeys by vehicle_nopol for this exact date
    const journeyByNopol = new Map();
    for (const j of journeys) {
      const key = (j.vehicle_nopol || '').replace(/\s+/g, '').toUpperCase();
      if (!journeyByNopol.has(key)) {
        journeyByNopol.set(key, j);
      } else {
        const existing = journeyByNopol.get(key);
        if (j.cargo && j.cargo.length > (existing.cargo?.length || 0)) {
          journeyByNopol.set(key, j);
        }
      }
    }

    // 3. Enrich vehicles with live DB state
    const fleet = vehicles.map(v => {
      const cleanKey = (v.nopol || '').replace(/\s+/g, '').toUpperCase();
      const jDoc = journeyByNopol.get(cleanKey);

      const maxCap = jCap(v, jDoc);
      const cargoItems = jDoc?.cargo || [];
      const currentLoadKg = Number(cargoItems.reduce((sum, c) => sum + (c.weight_kg || 1), 0).toFixed(1));
      const utilPct = maxCap > 0 ? Number(((currentLoadKg / maxCap) * 100).toFixed(1)) : 0;

      let capStatus = 'NORMAL';
      if (utilPct > 100) capStatus = 'OVER CAPACITY';
      else if (utilPct >= 90) capStatus = 'FULL';
      else if (utilPct >= 70) capStatus = 'NEAR CAPACITY';

      const routeId = jDoc?.route_id || v.assigned_route_id || v.rute_utama || 'RT-MALAM-B9910-PCX';
      const status = jDoc ? (jDoc.status || 'IN_PROGRESS') : 'READY';

      return {
        nopol: v.nopol,
        nama_kendaraan: v.nama_kendaraan || `Armada ${v.nopol}`,
        jenis_kendaraan: v.jenis_kendaraan || 'MOBIL BOX / TRUK FEEDER',
        driver: v.driver || v.driver_utama?.nama || 'Driver Shift',
        driver_phone: v.driver_phone || '-',
        home_base: v.home_base || 'KCU Cimahi',
        max_capacity_kg: maxCap,
        current_load_kg: currentLoadKg,
        available_capacity_kg: Math.max(0, maxCap - currentLoadKg),
        utilization_pct: utilPct,
        capacity_status: capStatus,
        route_id: routeId,
        journey_id: jDoc?.journey_id || null,
        journey_status: status,
        current_stop_seq: jDoc?.current_stop_seq || 1,
        total_cargo_count: cargoItems.length,
        has_active_journey: Boolean(jDoc && jDoc.status === 'IN_PROGRESS' && cargoItems.length > 0)
      };
    });

    return {
      operational_date: dateStr,
      total_fleet: fleet.length,
      fleet
    };
  }

  /**
   * MODE A: Get Daily Control Tower Summary for Operational Date (WIB).
   */
  async getDailyControlTowerSummary(dateStrInput) {
    const dateStr = dateStrInput || this.getWibDateStr();
    const db = await DbConnection.getDb();

    const startDate = new Date(`${dateStr}T00:00:00.000+07:00`);
    const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);

    // 1. Fetch transactions for dateStr
    const transactions = await db.collection('transaksi').find({
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { 'connote.created_at': { $regex: dateStr } },
        { created_at: { $regex: dateStr } }
      ]
    }).toArray();

    const allTx = transactions;

    let totalPackages = allTx.length;
    let totalWeightKg = 0;
    let receivedCount = 0;
    let loadedCount = 0;
    let inTransitCount = 0;
    let arrivedCount = 0;
    let deliveredCount = 0;
    let returnedCount = 0;

    for (const tx of allTx) {
      const w = this.parseWeightKg(tx);
      totalWeightKg += w;
      const st = this.normalizeState(tx.connote_state || tx.connote?.connote_state);

      if (st === 'DELIVERED') deliveredCount++;
      else if (st === 'RETURNED') returnedCount++;
      else if (st === 'ARRIVED' || st === 'UNLOADED') arrivedCount++;
      else if (st === 'IN_TRANSIT') inTransitCount++;
      else if (st === 'LOADED' || st === 'MANIFESTED') loadedCount++;
      else receivedCount++;
    }

    totalWeightKg = Number(totalWeightKg.toFixed(2));

    // 2. Fetch Active Route Journeys for dateStr
    const activeJourneys = await db.collection('route_journeys').find({
      $or: [
        { journey_date: { $gte: startDate, $lte: endDate } },
        { tanggal_operasional: dateStr },
        { status: { $in: ['DRAFT', 'READY', 'IN_PROGRESS'] } }
      ]
    }).toArray();

    let totalFleetMaxCapKg = 0;
    let totalFleetCurrentLoadKg = 0;
    const activeVehicleList = [];
    const exceptions = [];

    const vehiclesMaster = await db.collection('master_kendaraan').find({}).toArray();
    const vehicleMap = new Map();
    vehiclesMaster.forEach(v => {
      if (v.nopol) vehicleMap.set(v.nopol.replace(/\s+/g, '').toUpperCase(), v);
    });

    for (const j of activeJourneys) {
      const cleanNopol = (j.vehicle_nopol || '').replace(/\s+/g, '').toUpperCase();
      const vMaster = vehicleMap.get(cleanNopol);

      const maxCap = jCap(vMaster, j);
      const currLoad = j.current_load_kg || (Array.isArray(j.cargo) ? j.cargo.reduce((sum, c) => sum + (c.weight_kg || 1), 0) : 0);
      const utilPct = maxCap > 0 ? Number(((currLoad / maxCap) * 100).toFixed(1)) : 0;

      totalFleetMaxCapKg += maxCap;
      totalFleetCurrentLoadKg += currLoad;

      let capStatus = 'NORMAL';
      if (utilPct > 100) capStatus = 'OVER CAPACITY';
      else if (utilPct >= 90) capStatus = 'FULL';
      else if (utilPct >= 70) capStatus = 'NEAR CAPACITY';

      if (utilPct > 100) {
        exceptions.push({
          type: 'CAPACITY_EXCEEDED',
          severity: 'HIGH',
          title: `Armada ${j.vehicle_nopol} Over Capacity`,
          message: `Muatan ${currLoad} kg melebihi batas maksimum ${maxCap} kg (${utilPct}%).`,
          vehicle_nopol: j.vehicle_nopol,
          journey_id: j.journey_id
        });
      }

      activeVehicleList.push({
        journey_id: j.journey_id,
        vehicle_nopol: j.vehicle_nopol,
        nama_kendaraan: vMaster?.nama_kendaraan || `Armada ${j.vehicle_nopol}`,
        driver: vMaster?.driver || 'Driver Shift',
        route_id: j.route_id,
        status: j.status || 'IN_PROGRESS',
        current_stop_seq: j.current_stop_seq || 1,
        max_capacity_kg: maxCap,
        current_load_kg: currLoad,
        available_capacity_kg: Math.max(0, maxCap - currLoad),
        utilization_pct: utilPct,
        capacity_status: capStatus,
        cargo_count: Array.isArray(j.cargo) ? j.cargo.length : 0
      });
    }

    const overallSystemUtilPct = totalFleetMaxCapKg > 0 
      ? Number(((totalFleetCurrentLoadKg / totalFleetMaxCapKg) * 100).toFixed(1)) 
      : 0;

    return {
      operational_date: dateStr,
      timezone: 'Asia/Jakarta (WIB)',
      summary: {
        totalPackages,
        totalWeightKg,
        receivedCount,
        loadedCount,
        inTransitCount,
        arrivedCount,
        deliveredCount,
        returnedCount,
        activeVehiclesCount: activeVehicleList.length,
        totalFleetMaxCapKg,
        totalFleetCurrentLoadKg,
        overallSystemUtilPct
      },
      activeVehicles: activeVehicleList,
      exceptions
    };
  }

  /**
   * MODE B: Package Search Details (Exact & Smart Insensitive Match).
   */
  async getPackageDetails(connoteCodeInput, dateStrInput) {
    const cleanCode = String(connoteCodeInput || '').trim();
    if (!cleanCode) {
      return { found: false, code: 'INVALID_QUERY', message: 'Nomor resi tidak boleh kosong.' };
    }

    const dateStr = dateStrInput || this.getWibDateStr();
    const db = await DbConnection.getDb();

    // 1. Build smart match variants (case-insensitive & prefix variants)
    const upperCode = cleanCode.toUpperCase();
    const codeVariants = [cleanCode, upperCode];
    if (upperCode.startsWith('P26') && !upperCode.startsWith('P2026')) {
      codeVariants.push('P20' + upperCode.slice(1));
    } else if (upperCode.startsWith('P2026')) {
      codeVariants.push('P2' + upperCode.slice(3));
    }

    const exactRegex = new RegExp(`^${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const txDoc = await db.collection('transaksi').findOne({
      $or: [
        { 'connote.connote_code': { $in: codeVariants } },
        { connote_code: { $in: codeVariants } },
        { connoteCode: { $in: codeVariants } },
        { 'connote.connote_booking_code': { $in: codeVariants } },
        { connote_code: { $regex: exactRegex } },
        { 'connote.connote_code': { $regex: exactRegex } }
      ]
    });

    if (!txDoc) {
      return {
        found: false,
        code: 'PACKAGE_NOT_FOUND',
        message: `Nomor resi / connote "${cleanCode}" tidak ditemukan di database.`
      };
    }

    const resiCode = txDoc.connote_code || txDoc.connote?.connote_code || cleanCode;
    const bookingCode = txDoc.connote?.connote_booking_code || txDoc.connote_booking_code || `BK-${resiCode}`;
    const weightKg = this.parseWeightKg(txDoc);
    const service = txDoc.connote?.connote_service || txDoc.connote_service || 'Pos Nextday';
    const state = this.normalizeState(txDoc.connote_state || txDoc.connote?.connote_state);

    // 2. Resolve Origin & Destination Nopend from all fields
    let originNopen = this.getOriginNopen(txDoc) || '40511';
    let destinationNopen = this.getDestinationNopen(txDoc) || '40400';

    const officeMap = await this.lookupOfficeNames(db, [originNopen, destinationNopen]);
    const originOffice = officeMap.get(originNopen) || { nopend: originNopen, name: `KCU Cimahi (${originNopen})`, type: 'KCU' };
    const destinationOffice = officeMap.get(destinationNopen) || { nopend: destinationNopen, name: `SPP Bandung (${destinationNopen})`, type: 'SPP' };

    // 3. Hierarchical Vehicle Assignment Priority
    let assignedVehicleNopol = null;
    let assignedJourneyId = null;
    let assignedRouteId = null;
    let vehicleAssignmentSource = 'UNASSIGNED';

    // Priority 1: Tracking Event Scan
    const eventScan = await db.collection('tracking_events').findOne({
      connote_code: resiCode,
      vehicle_code: { $exists: true, $ne: null, $ne: '' }
    }, { sort: { event_datetime: -1 } });

    if (eventScan && eventScan.vehicle_code) {
      assignedVehicleNopol = eventScan.vehicle_code;
      assignedRouteId = eventScan.route_code || null;
      vehicleAssignmentSource = 'TRACKING_EVENT';
    }

    // Priority 2: Check active route_journeys cargo list
    if (!assignedVehicleNopol) {
      const journeyDoc = await db.collection('route_journeys').findOne({
        $or: [
          { 'cargo.connote_code': resiCode },
          { 'processed_stops.acceptedItems.connote_code': resiCode }
        ]
      });

      if (journeyDoc) {
        assignedVehicleNopol = journeyDoc.vehicle_nopol;
        assignedJourneyId = journeyDoc.journey_id;
        assignedRouteId = journeyDoc.route_id;
        vehicleAssignmentSource = 'LIVE_JOURNEY_CARGO';
      }
    }

    // Priority 3: Check Manifests
    if (!assignedVehicleNopol) {
      const manifestDetail = await db.collection('manifest_detail').findOne({ connote_code: resiCode });
      if (manifestDetail) {
        const manifestMaster = await db.collection('manifest_master').findOne({ master_manifest_code: manifestDetail.master_manifest_code });
        if (manifestMaster && manifestMaster.vehicle_nopol) {
          assignedVehicleNopol = manifestMaster.vehicle_nopol;
          assignedRouteId = manifestMaster.route_id;
          vehicleAssignmentSource = 'MANIFEST_ASSIGNMENT';
        }
      }
    }

    // Priority 4: Intelligent Corridor Mapping Fallback based on Origin Office
    if (!assignedVehicleNopol) {
      const fallback = this.getCorridorVehicleFallback(originNopen);
      assignedVehicleNopol = fallback.vehicle_nopol;
      assignedRouteId = fallback.route_id;
      vehicleAssignmentSource = 'CORRIDOR_AUTO_MAPPING';
    }

    // 4. Fetch Vehicle Info and Journey for dateStr
    const vehicleDetails = await this.getVehicleTrackingDetails(assignedVehicleNopol, dateStr);

    // 5. Fetch Tracking Events Timeline
    const rawEvents = await db.collection('tracking_events')
      .find({ connote_code: resiCode })
      .sort({ event_datetime: 1 })
      .toArray();

    const timeline = rawEvents.map(evt => ({
      event_id: evt.event_id,
      stage: evt.event_type || 'SCANNED',
      note: evt.note || `Status paket: ${evt.event_type}`,
      time: evt.event_datetime ? new Date(evt.event_datetime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-',
      location: evt.office_name || evt.location_name || `Kantor ${evt.office_code || ''}`,
      vehicle_code: evt.vehicle_code || assignedVehicleNopol
    }));

    // Comprehensive Timeline Synthesis if raw events are empty
    if (timeline.length === 0) {
      timeline.push({
        event_id: `INIT_${resiCode}`,
        stage: 'ENTRY',
        note: `Paket ${resiCode} dicatat & diterima di loket ${originOffice.name}.`,
        time: txDoc.createdAt ? new Date(txDoc.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Hari ini',
        location: originOffice.name,
        vehicle_code: assignedVehicleNopol
      });

      if (['LOADED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'RETURNED'].includes(state)) {
        timeline.push({
          event_id: `LOAD_${resiCode}`,
          stage: 'LOADED',
          note: `Paket dimuat ke armada truk ${assignedVehicleNopol} (${assignedRouteId || 'Feeder Route'}).`,
          time: 'Hari ini',
          location: originOffice.name,
          vehicle_code: assignedVehicleNopol
        });
      }

      if (['IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'RETURNED'].includes(state)) {
        timeline.push({
          event_id: `TRANSIT_${resiCode}`,
          stage: 'IN_TRANSIT',
          note: `Armada ${assignedVehicleNopol} dalam perjalanan menuju ${destinationOffice.name}.`,
          time: 'Hari ini',
          location: `Lintas Rute ${assignedRouteId || ''}`,
          vehicle_code: assignedVehicleNopol
        });
      }

      if (['ARRIVED', 'DELIVERED'].includes(state)) {
        timeline.push({
          event_id: `ARRIVE_${resiCode}`,
          stage: 'ARRIVED',
          note: `Paket tiba & selesai pembongkaran di gate entry ${destinationOffice.name}.`,
          time: 'Hari ini',
          location: destinationOffice.name,
          vehicle_code: assignedVehicleNopol
        });
      }

      if (state === 'DELIVERED') {
        timeline.push({
          event_id: `DELIV_${resiCode}`,
          stage: 'DELIVERED',
          note: `Paket sukses diserahkan kepada penerima (${txDoc.connote?.connote_receiver_name || txDoc.receiver_name || 'Pelanggan'}).`,
          time: 'Hari ini',
          location: txDoc.connote?.connote_receiver_address || destinationOffice.name,
          vehicle_code: assignedVehicleNopol
        });
      }

      if (state === 'RETURNED') {
        timeline.push({
          event_id: `RET_${resiCode}`,
          stage: 'RETURNED',
          note: `Paket gagal antar atau diretur ke loket asal ${originOffice.name}.`,
          time: 'Hari ini',
          location: originOffice.name,
          vehicle_code: assignedVehicleNopol
        });
      }
    }

    return {
      found: true,
      connoteCode: resiCode,
      bookingCode,
      service,
      weightKg,
      state,
      origin: originOffice,
      destination: destinationOffice,
      senderName: txDoc.connote?.connote_sender_name || txDoc.sender_name || 'PT Pos Logistics Store',
      receiverName: txDoc.connote?.connote_receiver_name || txDoc.receiver_name || 'SPP Bandung Hub',
      receiverAddress: txDoc.connote?.connote_receiver_address || '-',
      createdAt: txDoc.createdAt || txDoc.connote?.created_at || '-',
      vehicleAssignment: {
        source: vehicleAssignmentSource,
        nopol: assignedVehicleNopol,
        journey_id: vehicleDetails.found ? vehicleDetails.journey?.journey_id : assignedJourneyId,
        route_id: assignedRouteId || vehicleDetails.journey?.route_id || 'RT-MALAM-B9910-PCX',
        vehicle_info: vehicleDetails.found ? vehicleDetails.vehicle : null
      },
      routeInfo: {
        route_id: assignedRouteId || vehicleDetails.journey?.route_id || 'RT-MALAM-B9910-PCX',
        nama_route: vehicleDetails.journey?.nama_route || 'Rute Malam Feeder Cimahi -> SPP Bandung',
        currentStopSeq: vehicleDetails.journey?.current_stop_seq || 1
      },
      vehicleNopol: assignedVehicleNopol,
      routeId: assignedRouteId || vehicleDetails.journey?.route_id || 'RT-MALAM-B9910-PCX',
      currentStopSeq: vehicleDetails.journey?.current_stop_seq || 1,
      maxCapacityKg: vehicleDetails.capacity?.max_capacity_kg || 1500,
      currentLoadKg: vehicleDetails.capacity?.current_load_kg || 0,
      utilizationPct: vehicleDetails.capacity?.utilization_pct || 0,
      capacityStatus: vehicleDetails.capacity?.status || 'NORMAL',
      routeStops: vehicleDetails.routeStops || [],
      timeline,
      cargoItems: vehicleDetails.cargoItems || [],
      cargoGroupedByDestination: vehicleDetails.cargoGroupedByDestination || [],
      vehicleInfo: vehicleDetails.vehicle || null
    };
  }

  /**
   * MODE C: Vehicle Tracking Details (Accurate Multi-Stop Load, GPS Coordinates & Full Cargo).
   */
  async getVehicleTrackingDetails(nopolInput, dateStrInput) {
    const cleanNopol = String(nopolInput || '').trim();
    if (!cleanNopol) {
      return { found: false, code: 'INVALID_QUERY', message: 'Plat nomor kendaraan harus diisi.' };
    }

    const dateStr = dateStrInput || this.getWibDateStr();
    const db = await DbConnection.getDb();

    // 1. Search master_kendaraan
    const vehiclesMaster = await db.collection('master_kendaraan').find({}).toArray();
    const cleanNopolKey = cleanNopol.replace(/\s+/g, '').toUpperCase();
    const vDoc = vehiclesMaster.find(v => (v.nopol || '').replace(/\s+/g, '').toUpperCase() === cleanNopolKey);

    if (!vDoc) {
      return {
        found: false,
        code: 'VEHICLE_NOT_FOUND',
        message: `Kendaraan dengan plat nomor "${nopolInput}" tidak ditemukan pada database master_kendaraan.`
      };
    }

    const routeId = vDoc.assigned_route_id || vDoc.rute_utama || 'RT-MALAM-B9910-PCX';

    // 2. Fetch Journey for dateStr
    const startDate = new Date(`${dateStr}T00:00:00.000+07:00`);
    const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);
    const nopolRegex = new RegExp(`^${cleanNopol.replace(/\s+/g, '\\s*')}$`, 'i');

    let journeyDoc = await db.collection('route_journeys').findOne({
      $and: [
        { vehicle_nopol: { $regex: nopolRegex } },
        {
          $or: [
            { tanggal_operasional: dateStr },
            { journey_date: { $gte: startDate, $lte: endDate } },
            { journey_id: { $regex: dateStr.replace(/-/g, '') } }
          ]
        }
      ]
    });

    const maxCapacityKg = jCap(vDoc, journeyDoc);
    const cargoItems = journeyDoc?.cargo || [];
    const currentLoadKg = Number(cargoItems.reduce((sum, c) => sum + (c.weight_kg || 1), 0).toFixed(1));
    const availableCapacityKg = Math.max(0, Number((maxCapacityKg - currentLoadKg).toFixed(1)));
    const utilizationPct = maxCapacityKg > 0 ? Number(((currentLoadKg / maxCapacityKg) * 100).toFixed(1)) : 0;

    let capacityStatus = 'NORMAL';
    if (utilizationPct > 100) capacityStatus = 'OVER CAPACITY';
    else if (utilizationPct >= 90) capacityStatus = 'FULL';
    else if (utilizationPct >= 70) capacityStatus = 'NEAR CAPACITY';

    // 3. Fetch Route Header & Detail Route Waypoints from DB
    const routeHeader = await db.collection('master_route_nopen').findOne({ route_id: routeId });
    const detailWaypoints = await db.collection('detail_route')
      .find({ route_id: routeId, status: 'AKTIF' })
      .sort({ seq: 1 })
      .toArray();

    // Collect all nopens to resolve names and GPS coordinates
    const nopendList = [
      ...detailWaypoints.map(w => w.tujuan_nopen || w.asal_nopen),
      ...cargoItems.map(c => c.destination_nopen),
      ...cargoItems.map(c => c.origin_nopen)
    ];
    const officeMap = await this.lookupOfficeNames(db, nopendList);

    const totalStopsCount = detailWaypoints.length > 0 ? detailWaypoints.length : 5;
    const rawStopSeq = journeyDoc?.current_stop_seq || 1;
    // Ensure currentStopSeq does not exceed total stops
    const currentStopSeq = Math.min(Math.max(1, rawStopSeq), totalStopsCount);

    // Dynamic start time calculation (check route schedule or default)
    let startHour = 10;
    let startMin = 0;
    if (journeyDoc?.jam_berangkat) {
      const [h, m] = String(journeyDoc.jam_berangkat).split(':').map(Number);
      if (!isNaN(h)) { startHour = h; startMin = m || 0; }
    } else if (routeId.includes('MALAM')) {
      startHour = 19;
      startMin = 30;
    }
    let baseTimeMinutes = startHour * 60 + startMin;

    // Compute cumulative load and ETA at each stop sequence
    const routeStops = detailWaypoints.map((w) => {
      const off = officeMap.get(String(w.tujuan_nopen || w.asal_nopen).trim());
      let stStatus = 'UPCOMING';
      if (w.seq < currentStopSeq) stStatus = 'PASSED';
      else if (w.seq === currentStopSeq) stStatus = 'CURRENT';

      // Cargo load calculation at this specific stop sequence
      let stopLoadKg = 0;
      if (cargoItems.length > 0) {
        const activeItemsAtStop = cargoItems.filter(c => {
          const loadedAt = c.loaded_at_seq || 1;
          const unloadedAt = c.unloaded_at_seq || totalStopsCount;
          return loadedAt <= w.seq && unloadedAt >= w.seq;
        });
        stopLoadKg = Number(activeItemsAtStop.reduce((sum, c) => sum + (c.weight_kg || 1), 0).toFixed(1));
      } else {
        stopLoadKg = currentLoadKg;
      }

      const stopUtilPct = maxCapacityKg > 0 ? Number(((stopLoadKg / maxCapacityKg) * 100).toFixed(1)) : 0;
      let stopCapStatus = 'NORMAL';
      if (stopUtilPct > 100) stopCapStatus = 'OVER CAPACITY';
      else if (stopUtilPct >= 90) stopCapStatus = 'FULL';
      else if (stopUtilPct >= 70) stopCapStatus = 'NEAR CAPACITY';

      // ETA calculation
      const segMinutes = w.estimasi_menit || 15;
      baseTimeMinutes += segMinutes;
      const hours = Math.floor(baseTimeMinutes / 60) % 24;
      const mins = baseTimeMinutes % 60;
      const etaTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} WIB`;

      return {
        seq: w.seq,
        nopen: w.tujuan_nopen || w.asal_nopen,
        officeName: off?.name || w.tujuan_nama || `Kantor ${w.tujuan_nopen}`,
        officeType: off?.type || 'KCP',
        latitude: off?.latitude || null,
        longitude: off?.longitude || null,
        alamat: off?.alamat || '',
        estimasi_menit: w.estimasi_menit || 15,
        jarakKm: w.jarak_km || 5.0,
        etaTime,
        loadAtStopKg: stopLoadKg,
        utilizationPctAtStop: stopUtilPct,
        capacityStatusAtStop: stopCapStatus,
        status: stStatus
      };
    });

    // 4. Enrich Cargo Manifest & Group by Destination Office
    const destGroupMap = new Map();
    const enrichedCargoItems = cargoItems.map((item, idx) => {
      const destNopen = String(item.destination_nopen || '40400').trim();
      const originNopen = String(item.origin_nopen || '40511').trim();
      const destOff = officeMap.get(destNopen);
      const originOff = officeMap.get(originNopen);

      const enriched = {
        ...item,
        cargo_index: idx + 1,
        weight_kg: Number(item.weight_kg || 1.5),
        origin_name: originOff?.name || `Kantor ${originNopen}`,
        destination_name: destOff?.name || `Kantor Tujuan ${destNopen}`,
        service: item.service || 'Pos Nextday',
        status: item.status || 'IN_TRANSIT',
        loaded_at_seq: item.loaded_at_seq || 1,
        unloaded_at_seq: item.unloaded_at_seq || totalStopsCount
      };

      if (!destGroupMap.has(destNopen)) {
        destGroupMap.set(destNopen, {
          destination_nopen: destNopen,
          destination_office_name: destOff?.name || `Kantor Tujuan ${destNopen}`,
          package_count: 0,
          total_weight_kg: 0,
          packages: []
        });
      }
      const grp = destGroupMap.get(destNopen);
      grp.package_count++;
      grp.total_weight_kg = Number((grp.total_weight_kg + enriched.weight_kg).toFixed(1));
      grp.packages.push(enriched);

      return enriched;
    });

    const cargoGroupedByDestination = Array.from(destGroupMap.values());

    return {
      found: true,
      vehicle: {
        nopol: vDoc.nopol,
        nama_kendaraan: vDoc.nama_kendaraan || `Armada ${vDoc.nopol}`,
        jenis_kendaraan: vDoc.jenis_kendaraan || 'MOBIL BOX INTERCITY (1.5 TON)',
        driver: vDoc.driver || 'Ahmad Supriadi',
        driver_phone: vDoc.driver_phone || '0812-9876-54321',
        home_base: vDoc.home_base || '40511 - KCU Cimahi',
        status: vDoc.status || 'AKTIF'
      },
      capacity: {
        max_capacity_kg: maxCapacityKg,
        current_load_kg: currentLoadKg,
        available_capacity_kg: availableCapacityKg,
        utilization_pct: utilizationPct,
        status: capacityStatus
      },
      journey: {
        journey_id: journeyDoc?.journey_id || `JRN-${dateStr}-${cleanNopolKey}`,
        status: journeyDoc?.status || 'IN_PROGRESS',
        current_stop_seq: currentStopSeq,
        route_id: routeId,
        nama_route: routeHeader?.nama_route || `Rute Malam Feeder Cimahi -> SPP Bandung`
      },
      vehicleNopol: vDoc.nopol,
      routeId: routeId,
      currentStopSeq,
      maxCapacityKg,
      currentLoadKg,
      utilizationPct,
      capacityStatus,
      routeStops,
      cargoItems: enrichedCargoItems,
      cargoGroupedByDestination,
      totalCargoCount: enrichedCargoItems.length,
      totalCargoWeightKg: currentLoadKg
    };
  }
}

function jCap(vDoc, jDoc) {
  if (jDoc?.maximum_capacity_kg && Number(jDoc.maximum_capacity_kg) > 0) return Number(jDoc.maximum_capacity_kg);
  if (vDoc?.max_capacity_kg && Number(vDoc.max_capacity_kg) > 0) return Number(vDoc.max_capacity_kg);
  if (vDoc?.kapasitas_ton && Number(vDoc.kapasitas_ton) > 0) return Number(vDoc.kapasitas_ton) * 1000;
  if (vDoc?.kapasitas_kg && Number(vDoc.kapasitas_kg) > 0) return Number(vDoc.kapasitas_kg);
  return 1500;
}

export default new PackageTrackingService();
