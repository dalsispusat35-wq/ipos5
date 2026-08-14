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
   * Normalize office codes (nopend, 5 digits).
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
    if (s.includes('DELIVERED') || s.includes('SELESAI')) return 'DELIVERED';
    if (s.includes('UNLOADED') || s.includes('BONGKAR')) return 'UNLOADED';
    if (s.includes('ARRIVED') || s.includes('TIBA') || s.includes('GATE_IN')) return 'ARRIVED';
    if (s.includes('DEPARTED') || s.includes('IN_TRANSIT') || s.includes('TRANSIT') || s.includes('GATE_OUT')) return 'IN_TRANSIT';
    if (s.includes('LOADED') || s.includes('MUAT')) return 'LOADED';
    if (s.includes('MANIFEST')) return 'MANIFESTED';
    if (s.includes('SCANNED') || s.includes('SCAN')) return 'SCANNED';
    return 'ENTRY';
  }

  /**
   * Extract origin nopen
   */
  getOriginNopen(tx) {
    if (!tx) return '40511';
    const locCreated = tx.location_data_created?.custom_field || {};
    const custom = tx.custom_field || {};
    const code = locCreated.nopen || locCreated.nopend || locCreated.origin_nopen || custom.origin_nopen || custom.origin_kprk || tx.origin_nopen;
    return this.normalizeCode(code) || '40511';
  }

  /**
   * Extract destination nopen
   */
  getDestinationNopen(tx) {
    if (!tx) return '40400';
    const custom = tx.custom_field || {};
    const locCreated = tx.location_data_created?.custom_field || {};
    const connoteObj = tx.connote || {};
    const code = custom.destination_nopen || locCreated.destination_nopen || connoteObj.destination_nopen || custom.destination_kprk || tx.destination_nopen;
    return this.normalizeCode(code) || '40400';
  }

  /**
   * Batch lookup office names from master_kantor collection.
   */
  async lookupOfficeNames(db, nopendList = []) {
    const cleanCodes = [...new Set(nopendList.map(c => this.normalizeCode(c)).filter(Boolean))];
    if (cleanCodes.length === 0) return new Map();

    const offices = await db.collection('master_kantor')
      .find({ nopend: { $in: cleanCodes } })
      .toArray();

    const officeMap = new Map();
    for (const off of offices) {
      officeMap.set(String(off.nopend).trim(), {
        nopend: String(off.nopend).trim(),
        name: off.nama_nopend || off.nama_kantor || `Kantor ${off.nopend}`,
        type: off.tipe || off.tipe_kantor || 'KCP',
        regional: off.kdregional || '-'
      });
    }
    return officeMap;
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

    // Fallback if transaction query by date is sparse: get recent 500 transactions for live operational monitoring
    const allTx = transactions.length > 0 ? transactions : await db.collection('transaksi').find({}).limit(500).toArray();

    let totalPackages = allTx.length;
    let totalWeightKg = 0;
    let receivedCount = 0;
    let loadedCount = 0;
    let inTransitCount = 0;
    let arrivedCount = 0;
    let deliveredCount = 0;

    for (const tx of allTx) {
      const w = this.parseWeightKg(tx);
      totalWeightKg += w;
      const st = this.normalizeState(tx.connote_state || tx.connote?.connote_state);

      if (st === 'DELIVERED') deliveredCount++;
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

    // Lookup vehicles to enrich fleet data
    const vehicleNopols = activeJourneys.map(j => j.vehicle_nopol).filter(Boolean);
    const vehiclesMaster = await db.collection('master_kendaraan').find({}).toArray();
    const vehicleMap = new Map();
    vehiclesMaster.forEach(v => {
      if (v.nopol) vehicleMap.set(v.nopol.replace(/\s+/g, '').toUpperCase(), v);
    });

    for (const j of activeJourneys) {
      const cleanNopol = (j.vehicle_nopol || '').replace(/\s+/g, '').toUpperCase();
      const vMaster = vehicleMap.get(cleanNopol);

      const maxCap = j.maximum_capacity_kg || vMaster?.max_capacity_kg || (vMaster?.kapasitas_ton ? vMaster.kapasitas_ton * 1000 : 1500);
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

    // Detect unassigned in-transit packages for exception panel
    const unassignedInTransit = allTx.filter(tx => {
      const st = this.normalizeState(tx.connote_state || tx.connote?.connote_state);
      return (st === 'IN_TRANSIT' || st === 'LOADED') && !tx.vehicle_nopol && !tx.journey_id;
    });

    if (unassignedInTransit.length > 0) {
      exceptions.push({
        type: 'PACKAGE_WITHOUT_VEHICLE',
        severity: 'MEDIUM',
        title: `${unassignedInTransit.length} Paket Belum Terhubung Ke Armada`,
        message: `Terdapat ${unassignedInTransit.length} resi dengan status ${unassignedInTransit[0]?.connote_state || 'IN_TRANSIT'} yang belum ter-assign ke ID Journey / Armada.`,
        count: unassignedInTransit.length
      });
    }

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
   * MODE B: Package Search Details (Exact Match, No Dummy Fallback).
   */
  async getPackageDetails(connoteCodeInput, dateStrInput) {
    const cleanCode = String(connoteCodeInput || '').trim();
    if (!cleanCode) {
      return { found: false, code: 'INVALID_QUERY', message: 'Nomor resi tidak boleh kosong.' };
    }

    const dateStr = dateStrInput || this.getWibDateStr();
    const db = await DbConnection.getDb();

    // 1. Build exact match variants (e.g., P20260724000001 vs P260724000001)
    const codeVariants = [cleanCode];
    if (cleanCode.startsWith('P26') && !cleanCode.startsWith('P2026')) {
      codeVariants.push('P20' + cleanCode.slice(1));
    } else if (cleanCode.startsWith('P2026')) {
      codeVariants.push('P2' + cleanCode.slice(3));
    }

    // Exact Match Query
    const txDoc = await db.collection('transaksi').findOne({
      $or: [
        { 'connote.connote_code': { $in: codeVariants } },
        { connote_code: { $in: codeVariants } },
        { connoteCode: { $in: codeVariants } },
        { 'connote.connote_booking_code': { $in: codeVariants } }
      ]
    });

    // ABSOLUTE RULE: NO MOCK FALLBACK findOne({})!
    if (!txDoc) {
      return {
        found: false,
        code: 'PACKAGE_NOT_FOUND',
        message: `Nomor resi / connote "${cleanCode}" tidak ditemukan di database.`
      };
    }

    const resiCode = txDoc.connote_code || txDoc.connote?.connote_code || cleanCode;
    const bookingCode = txDoc.connote?.connote_booking_code || txDoc.connote_booking_code || '-';
    const weightKg = this.parseWeightKg(txDoc);
    const service = txDoc.connote?.connote_service || txDoc.connote_service || 'Pos Reguler';
    const state = this.normalizeState(txDoc.connote_state || txDoc.connote?.connote_state);

    // 2. Resolve Origin & Destination Nopend
    let originNopen = this.getOriginNopen(txDoc) || '40511';
    let destinationNopen = this.getDestinationNopen(txDoc) || '40400';

    // Lookup official office names in master_kantor
    const officeMap = await this.lookupOfficeNames(db, [originNopen, destinationNopen]);
    const originOffice = officeMap.get(originNopen) || { nopend: originNopen, name: `KCU Cimahi (${originNopen})`, type: 'KCU' };
    const destinationOffice = officeMap.get(destinationNopen) || { nopend: destinationNopen, name: `SPP Bandung (${destinationNopen})`, type: 'SPP' };

    // 3. Hierarchical Vehicle Assignment Priority (P1 -> P2 -> P3 -> P4)
    let assignedVehicleNopol = null;
    let assignedJourneyId = null;
    let assignedRouteId = null;
    let vehicleAssignmentSource = 'UNASSIGNED';

    // Priority 1: Tracking Event Scan on dateStr
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

    // Default route match fallback based on origin/destination if route_id still empty
    if (!assignedRouteId) {
      const routeHeader = await db.collection('master_route_nopen').findOne({
        $or: [
          { nopen_asal: originNopen, nopen_tujuan: destinationNopen },
          { nopen_asal: originNopen }
        ]
      }, { sort: { prioritas: 1 } });
      if (routeHeader) {
        assignedRouteId = routeHeader.route_id;
      } else {
        assignedRouteId = 'RT-MALAM-B9910-PCX';
      }
    }

    // 4. Fetch Vehicle Info if nopol assigned
    let vehicleInfo = null;
    if (assignedVehicleNopol) {
      const cleanNopol = assignedVehicleNopol.replace(/\s+/g, '').toUpperCase();
      const vehiclesMaster = await db.collection('master_kendaraan').find({}).toArray();
      const vMatch = vehiclesMaster.find(v => (v.nopol || '').replace(/\s+/g, '').toUpperCase() === cleanNopol);

      if (vMatch) {
        vehicleInfo = {
          nopol: vMatch.nopol,
          nama_kendaraan: vMatch.nama_kendaraan,
          jenis_kendaraan: vMatch.jenis_kendaraan,
          max_capacity_kg: vMatch.max_capacity_kg || (vMatch.kapasitas_ton ? vMatch.kapasitas_ton * 1000 : 1500),
          driver: vMatch.driver || 'Driver Shift',
          driver_phone: vMatch.driver_phone || '-',
          home_base: vMatch.home_base || '-'
        };
      }
    }

    // 5. Fetch Route Header & Detail Route Waypoints from DB
    const routeHeader = await db.collection('master_route_nopen').findOne({ route_id: assignedRouteId });
    const detailWaypoints = await db.collection('detail_route')
      .find({ route_id: assignedRouteId, status: 'AKTIF' })
      .sort({ seq: 1 })
      .toArray();

    // Resolve waypoints office names
    const waypointNopends = detailWaypoints.map(w => w.tujuan_nopen || w.asal_nopen);
    const waypointsOfficeMap = await this.lookupOfficeNames(db, [originNopen, destinationNopen, ...waypointNopends]);

    const activeJourney = assignedVehicleNopol 
      ? await db.collection('route_journeys').findOne({ vehicle_nopol: assignedVehicleNopol, status: 'IN_PROGRESS' })
      : null;

    const currentStopSeq = activeJourney?.current_stop_seq || 1;

    const routeStops = detailWaypoints.map(w => {
      const offInfo = waypointsOfficeMap.get(String(w.tujuan_nopen || w.asal_nopen).trim());
      let stopStatus = 'UPCOMING';
      if (w.seq < currentStopSeq) stopStatus = 'COMPLETED';
      else if (w.seq === currentStopSeq) stopStatus = 'CURRENT';

      return {
        seq: w.seq,
        nopen: w.tujuan_nopen || w.asal_nopen,
        officeName: offInfo?.name || w.tujuan_nama || `Kantor ${w.tujuan_nopen}`,
        officeType: offInfo?.type || 'KCP',
        estimasi_menit: w.estimasi_menit || 15,
        jarak_km: w.jarak_km || 5.0,
        status: stopStatus
      };
    });

    // 6. Fetch Tracking Events Timeline
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
      vehicle_code: evt.vehicle_code || null
    }));

    if (timeline.length === 0) {
      timeline.push({
        event_id: `INIT_${resiCode}`,
        stage: state,
        note: `Transaksi resi ${resiCode} tercatat di sistem IPOS5.`,
        time: txDoc.createdAt ? new Date(txDoc.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Hari ini',
        location: originOffice.name,
        vehicle_code: assignedVehicleNopol
      });
    }

    // 7. ETA Calculation
    let remainingMinutes = 0;
    for (let i = currentStopSeq - 1; i < routeStops.length; i++) {
      remainingMinutes += (routeStops[i]?.estimasi_menit || 15);
    }
    const etaTimeStr = `${Math.floor(remainingMinutes / 60)}j ${remainingMinutes % 60}m`;

    return {
      found: true,
      connoteCode: resiCode,
      bookingCode,
      service,
      weightKg,
      state,
      origin: originOffice,
      destination: destinationOffice,
      senderName: txDoc.connote?.connote_sender_name || 'PT Pos Logistics',
      receiverName: txDoc.connote?.connote_receiver_name || 'Penerima Pos',
      receiverAddress: txDoc.connote?.connote_receiver_address || '-',
      createdAt: txDoc.createdAt || txDoc.connote?.created_at || '-',
      vehicleAssignment: {
        source: vehicleAssignmentSource,
        nopol: assignedVehicleNopol,
        journey_id: assignedJourneyId,
        route_id: assignedRouteId,
        vehicle_info: vehicleInfo
      },
      routeInfo: {
        route_id: assignedRouteId,
        nama_route: routeHeader?.nama_route || `Rute ${assignedRouteId}`,
        kodeMile: routeHeader?.kodeMile || 'FIRST_MILE',
        currentStopSeq,
        etaRemainingStr: etaTimeStr
      },
      routeStops,
      timeline
    };
  }

  /**
   * MODE C: Vehicle Tracking Details (No Dummy Fleet Fallback).
   */
  async getVehicleTrackingDetails(nopolInput, dateStrInput) {
    const cleanNopol = String(nopolInput || '').replace(/\s+/g, '').toUpperCase();
    if (!cleanNopol) {
      return { found: false, code: 'INVALID_QUERY', message: 'Plat nomor kendaraan harus diisi.' };
    }

    const dateStr = dateStrInput || this.getWibDateStr();
    const db = await DbConnection.getDb();

    // 1. Search master_kendaraan (Exact Nopol Match)
    const vehiclesMaster = await db.collection('master_kendaraan').find({}).toArray();
    const vDoc = vehiclesMaster.find(v => (v.nopol || '').replace(/\s+/g, '').toUpperCase() === cleanNopol);

    // ABSOLUTE RULE: NO MOCK FLEET FALLBACK!
    if (!vDoc) {
      return {
        found: false,
        code: 'VEHICLE_NOT_FOUND',
        message: `Kendaraan dengan plat nomor "${nopolInput}" tidak ditemukan pada master_kendaraan.`
      };
    }

    const routeId = vDoc.assigned_route_id || vDoc.rute_utama || 'RT-MALAM-B9910-PCX';

    // 2. Fetch Active Journey on dateStr
    const startDate = new Date(`${dateStr}T00:00:00.000+07:00`);
    const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);

    const journeyDoc = await db.collection('route_journeys').findOne({
      $or: [
        { vehicle_nopol: vDoc.nopol },
        { vehicle_nopol: cleanNopol }
      ],
      $or: [
        { journey_date: { $gte: startDate, $lte: endDate } },
        { tanggal_operasional: dateStr },
        { status: 'IN_PROGRESS' }
      ]
    });

    const maxCapacityKg = jCap(vDoc, journeyDoc);
    const cargoItems = journeyDoc?.cargo || [];
    const currentLoadKg = cargoItems.reduce((sum, c) => sum + (c.weight_kg || 1), 0);
    const availableCapacityKg = Math.max(0, maxCapacityKg - currentLoadKg);
    const utilizationPct = maxCapacityKg > 0 ? Number(((currentLoadKg / maxCapacityKg) * 100).toFixed(1)) : 0;

    let capacityStatus = 'NORMAL';
    if (utilizationPct > 100) capacityStatus = 'OVER CAPACITY';
    else if (utilizationPct >= 90) capacityStatus = 'FULL';
    else if (utilizationPct >= 70) capacityStatus = 'NEAR CAPACITY';

    // 3. Fetch Route Header & Waypoints from DB
    const routeHeader = await db.collection('master_route_nopen').findOne({ route_id: routeId });
    const detailWaypoints = await db.collection('detail_route')
      .find({ route_id: routeId, status: 'AKTIF' })
      .sort({ seq: 1 })
      .toArray();

    const nopendList = detailWaypoints.map(w => w.tujuan_nopen || w.asal_nopen);
    const officeMap = await this.lookupOfficeNames(db, nopendList);

    const currentStopSeq = journeyDoc?.current_stop_seq || 1;

    const routeStops = detailWaypoints.map(w => {
      const off = officeMap.get(String(w.tujuan_nopen || w.asal_nopen).trim());
      let stStatus = 'UPCOMING';
      if (w.seq < currentStopSeq) stStatus = 'COMPLETED';
      else if (w.seq === currentStopSeq) stStatus = 'CURRENT';

      return {
        seq: w.seq,
        nopen: w.tujuan_nopen || w.asal_nopen,
        officeName: off?.name || w.tujuan_nama || `Kantor ${w.tujuan_nopen}`,
        officeType: off?.type || 'KCP',
        estimasi_menit: w.estimasi_menit || 15,
        jarak_km: w.jarak_km || 5.0,
        status: stStatus
      };
    });

    // 4. Group Cargo Manifest by Destination Office
    const destGroupMap = new Map();
    for (const item of cargoItems) {
      const destNopen = item.destination_nopen || '40400';
      const offInfo = officeMap.get(destNopen);
      const destName = offInfo?.name || item.receiver_name || `Kantor Tujuan ${destNopen}`;

      if (!destGroupMap.has(destNopen)) {
        destGroupMap.set(destNopen, {
          destination_nopen: destNopen,
          destination_office_name: destName,
          package_count: 0,
          total_weight_kg: 0,
          packages: []
        });
      }
      const grp = destGroupMap.get(destNopen);
      grp.package_count++;
      grp.total_weight_kg = Number((grp.total_weight_kg + (item.weight_kg || 1)).toFixed(2));
      grp.packages.push(item);
    }

    const cargoGroupedByDestination = Array.from(destGroupMap.values());

    return {
      found: true,
      vehicle: {
        nopol: vDoc.nopol,
        nama_kendaraan: vDoc.nama_kendaraan,
        jenis_kendaraan: vDoc.jenis_kendaraan,
        driver: vDoc.driver,
        driver_phone: vDoc.driver_phone,
        home_base: vDoc.home_base,
        status: vDoc.status
      },
      capacity: {
        max_capacity_kg: maxCapacityKg,
        current_load_kg: currentLoadKg,
        available_capacity_kg: availableCapacityKg,
        utilization_pct: utilizationPct,
        status: capacityStatus
      },
      journey: {
        journey_id: journeyDoc?.journey_id || `JRN-${dateStr}-${cleanNopol}`,
        status: journeyDoc?.status || 'READY',
        current_stop_seq: currentStopSeq,
        route_id: routeId,
        nama_route: routeHeader?.nama_route || `Rute ${routeId}`
      },
      routeStops,
      cargoGroupedByDestination,
      totalCargoCount: cargoItems.length
    };
  }
}

function jCap(vDoc, jDoc) {
  if (jDoc?.maximum_capacity_kg) return Number(jDoc.maximum_capacity_kg);
  if (vDoc.max_capacity_kg) return Number(vDoc.max_capacity_kg);
  if (vDoc.kapasitas_ton) return Number(vDoc.kapasitas_ton) * 1000;
  return 1500;
}

export default new PackageTrackingService();
