import TransactionModel from '../models/TransactionModel.js';
import RouteModel from '../models/RouteModel.js';
import DetailRouteModel from '../models/DetailRouteModel.js';
import JadwalModel from '../models/JadwalModel.js';
import KantorModel from '../models/KantorModel.js';
import ManifestModel from '../models/ManifestModel.js';
import DbConnection from '../config/DbConnection.js';
import { validateStateTransition } from './ManifestController.js';
import RouteJourneyModel from '../models/RouteJourneyModel.js';
import RouteJourneyService from '../services/RouteJourneyService.js';

// Static stops mapping for Slide 2 Night routes
const ROUTE_STOPS_MAP = {
  'RT-MALAM-B9910-PCX': {
    nopol: 'B 9910 PCX',
    nopends: ['40395C1', '40395U1', '40381U2', '40382U1', '40382B2', '40393U3', '40393S8']
  },
  'RT-MALAM-B9945-PCY-PU1': {
    nopol: 'B 9945 PCY',
    nopends: ['40000', '40141C3', '40135U1', '40114A', '40263C2']
  },
  'RT-MALAM-B9945-PCY-PU2': {
    nopol: 'B 9945 PCY',
    nopends: ['40100']
  }
};

const ALL_ROUTE_NOPENDS = [
  ...ROUTE_STOPS_MAP['RT-MALAM-B9910-PCX'].nopends,
  ...ROUTE_STOPS_MAP['RT-MALAM-B9945-PCY-PU1'].nopends,
  ...ROUTE_STOPS_MAP['RT-MALAM-B9945-PCY-PU2'].nopends
];

// Helper to extract nested values safely
const getNestedValue = (obj, path, defaultValue = '-') => {
  if (!obj) return defaultValue;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[part];
  }
  return current !== undefined && current !== null && current !== '' ? current : defaultValue;
};

// Helper to normalize transaction response
export const normalizeTx = (doc) => {
  if (!doc) return null;
  
  let connote_code = doc.connote_code || doc.connote?.connote_code || doc.connoteCode || doc._id || '-';
  let connote_booking_code = doc.connote_booking_code || doc.connote?.connote_booking_code || '-';

  let connote_sender_name = doc.connote_sender_name || doc.connote?.connote_sender_name || doc.sender_name || doc.customer_name || '-';
  let connote_sender_address = doc.connote_sender_address || doc.connote?.connote_sender_address || doc.sender_address || '-';
  let connote_sender_email = doc.connote_sender_email || doc.connote?.connote_sender_email || '-';

  let connote_receiver_name = doc.connote_receiver_name || doc.connote?.connote_receiver_name || doc.receiver_name || '-';
  let connote_receiver_address = doc.connote_receiver_address || doc.connote?.connote_receiver_address || doc.receiver_address || '-';
  let connote_receiver_zipcode = doc.connote_receiver_zipcode || doc.connote?.connote_receiver_zipcode || doc.receiver_zipcode || '-';
  let connote_receiver_address_detail = doc.connote_receiver_address_detail || doc.connote?.connote_receiver_address_detail || doc.connote_receiver_address || '-';

  let connote_service = doc.connote_service || doc.connote?.connote_service || doc.service_code || '-';
  let actual_weight = doc.actual_weight ?? doc.connote?.actual_weight ?? doc.weight ?? '-';
  let connote_service_price = doc.connote_service_price ?? doc.connote?.connote_service_price ?? '-';
  let connote_amount = doc.connote_amount ?? doc.connote?.connote_amount ?? doc.amount ?? '-';

  let connote_state = doc.connote_state || doc.connote?.connote_state || doc.state || 'ENTRY';

  let created_at = doc.createdAt || doc.created_at || doc.connote?.created_at || doc.tanggal || null;

  let location_name = doc.location_data_created?.location_name || doc.location_name || doc.origin_name || '-';

  const getCustomField = (key) => {
    if (doc.location_data_created?.custom_field && doc.location_data_created.custom_field[key] !== undefined) {
      return doc.location_data_created.custom_field[key];
    }
    if (doc.custom_field && doc.custom_field[key] !== undefined) {
      return doc.custom_field[key];
    }
    return '-';
  };

  const destination_nopen = getCustomField('destination_nopen');
  const destination_reg = getCustomField('destination_reg');
  const destination_kprk = getCustomField('destination_kprk');
  const idKorporatConnote = getCustomField('idKorporatConnote');
  const final_swp = getCustomField('final_swp');
  const final_swp_date_new = getCustomField('final_swp_date_new');

  const current_location_name = doc.currentLocation?.name || doc.current_location_name || '-';

  return {
    _id: doc._id,
    connote_code,
    connote_booking_code,
    connote_sender_name,
    connote_sender_address,
    connote_sender_email,
    connote_receiver_name,
    connote_receiver_address,
    connote_receiver_zipcode,
    connote_receiver_address_detail,
    connote_service,
    actual_weight,
    connote_service_price,
    connote_amount,
    connote_state,
    created_at,
    location_name,
    destination_nopen,
    destination_reg,
    destination_kprk,
    idKorporatConnote,
    final_swp,
    final_swp_date_new,
    current_location_name,
    manifest_id: doc.manifest_id || '-',
    tracking_history: doc.tracking_history || [],
    raw: doc
  };
};

export const getTransactionRouteMapping = (destNopen, destKprk) => {
  const nopenStr = destNopen ? String(destNopen).trim() : '';
  const kprkStr = destKprk ? String(destKprk).trim() : '';

  // 1. Try matching destNopen directly (Level: NOPEN)
  if (nopenStr) {
    for (const [routeId, cfg] of Object.entries(ROUTE_STOPS_MAP)) {
      if (cfg.nopends.includes(nopenStr)) {
        return {
          route_id: routeId,
          vehicle_nopol: cfg.nopol,
          mapping_level: 'NOPEN'
        };
      }
    }
  }

  // 2. Try matching destKprk (Level: KPRK)
  if (kprkStr) {
    for (const [routeId, cfg] of Object.entries(ROUTE_STOPS_MAP)) {
      if (cfg.nopends.includes(kprkStr)) {
        return {
          route_id: routeId,
          vehicle_nopol: cfg.nopol,
          mapping_level: 'KPRK'
        };
      }
    }
  }

  return {
    route_id: '-',
    vehicle_nopol: '-',
    mapping_level: 'UNMAPPED'
  };
};

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const buildTransactionMatch = (queryParams) => {
  const {
    search,
    state,
    service,
    destination_nopen,
    destination_kprk,
    destination_reg,
    vehicle_nopol,
    route_id,
    date_from,
    date_to
  } = queryParams;

  const match = {};

  // 1. Status (state) filter
  if (state) {
    match.$or = [
      { 'connote.connote_state': state },
      { connote_state: state }
    ];
  }

  // 2. Service filter
  if (service) {
    const serviceQuery = [
      { 'connote.connote_service': service },
      { connote_service: service }
    ];
    if (match.$or) {
      match.$and = [{ $or: match.$or }, { $or: serviceQuery }];
      delete match.$or;
    } else if (match.$and) {
      match.$and.push({ $or: serviceQuery });
    } else {
      match.$or = serviceQuery;
    }
  }

  // 3. Destination Nopen filter
  if (destination_nopen) {
    const nopenQuery = [
      { 'location_data_created.custom_field.destination_nopen': destination_nopen },
      { 'custom_field.destination_nopen': destination_nopen }
    ];
    if (match.$or) {
      match.$and = [{ $or: match.$or }, { $or: nopenQuery }];
      delete match.$or;
    } else if (match.$and) {
      match.$and.push({ $or: nopenQuery });
    } else {
      match.$or = nopenQuery;
    }
  }

  // 4. Destination KPRK filter
  if (destination_kprk) {
    const kprkNum = parseInt(destination_kprk, 10);
    const kprkQuery = [
      { 'location_data_created.custom_field.destination_kprk': destination_kprk },
      { 'custom_field.destination_kprk': destination_kprk }
    ];
    if (!isNaN(kprkNum)) {
      kprkQuery.push(
        { 'location_data_created.custom_field.destination_kprk': kprkNum },
        { 'custom_field.destination_kprk': kprkNum }
      );
    }

    if (match.$or) {
      match.$and = [{ $or: match.$or }, { $or: kprkQuery }];
      delete match.$or;
    } else if (match.$and) {
      match.$and.push({ $or: kprkQuery });
    } else {
      match.$or = kprkQuery;
    }
  }

  // 5. Destination Regional filter
  if (destination_reg) {
    const regNum = parseInt(destination_reg, 10);
    const regQuery = [
      { 'location_data_created.custom_field.destination_reg': destination_reg },
      { 'custom_field.destination_reg': destination_reg }
    ];
    if (!isNaN(regNum)) {
      regQuery.push(
        { 'location_data_created.custom_field.destination_reg': regNum },
        { 'custom_field.destination_reg': regNum }
      );
    }

    if (match.$or) {
      match.$and = [{ $or: match.$or }, { $or: regQuery }];
      delete match.$or;
    } else if (match.$and) {
      match.$and.push({ $or: regQuery });
    } else {
      match.$or = regQuery;
    }
  }

  // 6. Vehicle / Route filter mapping to stop codes
  if (route_id) {
    const cfg = ROUTE_STOPS_MAP[route_id];
    if (cfg) {
      const routeStopsQuery = [
        { 'location_data_created.custom_field.destination_nopen': { $in: cfg.nopends } },
        { 'custom_field.destination_nopen': { $in: cfg.nopends } },
        { 'location_data_created.custom_field.destination_kprk': { $in: cfg.nopends } },
        { 'custom_field.destination_kprk': { $in: cfg.nopends } }
      ];

      if (match.$or) {
        match.$and = [{ $or: match.$or }, { $or: routeStopsQuery }];
        delete match.$or;
      } else if (match.$and) {
        match.$and.push({ $or: routeStopsQuery });
      } else {
        match.$or = routeStopsQuery;
      }
    } else {
      match._invalid_route_ = true;
    }
  } else if (vehicle_nopol) {
    let nopends = [];
    if (vehicle_nopol === 'B 9910 PCX') {
      nopends = ROUTE_STOPS_MAP['RT-MALAM-B9910-PCX'].nopends;
    } else if (vehicle_nopol === 'B 9945 PCY') {
      nopends = [
        ...ROUTE_STOPS_MAP['RT-MALAM-B9945-PCY-PU1'].nopends,
        ...ROUTE_STOPS_MAP['RT-MALAM-B9945-PCY-PU2'].nopends
      ];
    }

    if (nopends.length > 0) {
      const vStopsQuery = [
        { 'location_data_created.custom_field.destination_nopen': { $in: nopends } },
        { 'custom_field.destination_nopen': { $in: nopends } },
        { 'location_data_created.custom_field.destination_kprk': { $in: nopends } },
        { 'custom_field.destination_kprk': { $in: nopends } }
      ];

      if (match.$or) {
        match.$and = [{ $or: match.$or }, { $or: vStopsQuery }];
        delete match.$or;
      } else if (match.$and) {
        match.$and.push({ $or: vStopsQuery });
      } else {
        match.$or = vStopsQuery;
      }
    } else {
      match._invalid_nopol_ = true;
    }
  }

  // 7. Date range filter
  if (date_from || date_to) {
    const dateConds = [];
    if (date_from) {
      const cleanDateFrom = date_from.substring(0, 10) + 'T00:00:00.000Z';
      const dateFromObj = new Date(cleanDateFrom);
      dateConds.push({
        $gte: [
          {
            $dateFromString: {
              dateString: '$connote.created_at',
              format: '%d/%m/%Y %H:%M',
              onError: new Date('1970-01-01T00:00:00.000Z')
            }
          },
          dateFromObj
        ]
      });
    }
    if (date_to) {
      const cleanDateTo = date_to.substring(0, 10) + 'T23:59:59.999Z';
      const dateToObj = new Date(cleanDateTo);
      dateConds.push({
        $lte: [
          {
            $dateFromString: {
              dateString: '$connote.created_at',
              format: '%d/%m/%Y %H:%M',
              onError: new Date('1970-01-01T00:00:00.000Z')
            }
          },
          dateToObj
        ]
      });
    }

    if (dateConds.length > 0) {
      match.$expr = {
        $and: dateConds
      };
    }
  }

  // 8. Search query matching multiple fields
  if (search) {
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = { $regex: escapedSearch, $options: 'i' };
    const searchQuery = {
      $or: [
        { 'connote.connote_code': regex },
        { connote_code: regex },
        { connoteCode: regex },
        { 'connote.connote_booking_code': regex },
        { 'connote.connote_sender_name': regex },
        { 'connote.connote_sender_address': regex },
        { 'connote.connote_receiver_address': regex },
        { 'connote.connote_receiver_zipcode': regex },
        { 'location_data_created.custom_field.destination_nopen': regex },
        { 'custom_field.destination_nopen': regex },
        { 'location_data_created.custom_field.idKorporatConnote': regex },
        { 'custom_field.idKorporatConnote': regex },
        { 'currentLocation.name': regex }
      ]
    };

    if (/^\d+$/.test(search)) {
      const num = parseInt(search, 10);
      searchQuery.$or.push(
        { 'location_data_created.custom_field.destination_kprk': num },
        { 'custom_field.destination_kprk': num },
        { 'location_data_created.custom_field.destination_reg': num },
        { 'custom_field.destination_reg': num }
      );
    }

    if (match.$or) {
      match.$and = [{ $or: match.$or }, { $or: searchQuery.$or }];
      delete match.$or;
    } else if (match.$and) {
      match.$and.push({ $or: searchQuery.$or });
    } else {
      match.$or = searchQuery.$or;
    }
  }

  return match;
};

export const getTransactionStatsForMatch = async (db, match) => {
  const col = db.collection('transaksi');
  const pipeline = [
    {
      $match: match
    },
    {
      $project: {
        weight: {
          $convert: {
            input: '$connote.actual_weight',
            to: 'double',
            onError: 0,
            onNull: 0
          }
        },
        amount: {
          $convert: {
            input: '$connote.connote_amount',
            to: 'double',
            onError: 0,
            onNull: 0
          }
        },
        state: {
          $toUpper: {
            $ifNull: ['$connote.connote_state', '']
          }
        },
        is_mapped: {
          $or: [
            { $in: [ { $convert: { input: '$location_data_created.custom_field.destination_nopen', to: 'string', onError: '', onNull: '' } }, ALL_ROUTE_NOPENDS ] },
            { $in: [ { $convert: { input: '$custom_field.destination_nopen', to: 'string', onError: '', onNull: '' } }, ALL_ROUTE_NOPENDS ] },
            { $in: [ { $convert: { input: '$location_data_created.custom_field.destination_kprk', to: 'string', onError: '', onNull: '' } }, ALL_ROUTE_NOPENDS ] },
            { $in: [ { $convert: { input: '$custom_field.destination_kprk', to: 'string', onError: '', onNull: '' } }, ALL_ROUTE_NOPENDS ] }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalWeight: { $sum: '$weight' },
        totalAmount: { $sum: '$amount' },
        deliveredCount: {
          $sum: {
            $cond: [{ $eq: ['$state', 'DELIVERED'] }, 1, 0]
          }
        },
        mappedCount: {
          $sum: {
            $cond: ['$is_mapped', 1, 0]
          }
        }
      }
    }
  ];

  const results = await col.aggregate(pipeline).toArray();
  const summary = results[0] || {
    totalCount: 0,
    totalWeight: 0,
    totalAmount: 0,
    deliveredCount: 0,
    mappedCount: 0
  };

  return {
    total_transaksi: summary.totalCount,
    total_berat: Number(summary.totalWeight.toFixed(2)),
    total_nilai_kiriman: summary.totalAmount,
    jumlah_mapped: summary.mappedCount,
    jumlah_unmapped: Math.max(0, summary.totalCount - summary.mappedCount),
    jumlah_by_state: {
      DELIVERED: summary.deliveredCount
    }
  };
};

const normalizeCode = (value) => {
  return String(value ?? '').trim();
};

const extractNopen = (text) => {
  if (!text) return '';
  const match = String(text).match(/\b\d{5}\b/);
  return match ? match[0] : '';
};

const buildStopsFromSegments = async (segments, originNopen, destNopen, currentLocationNopen, state, db) => {
  if (!segments || segments.length === 0) return [];
  const sorted = [...segments].sort((a, b) => a.seq - b.seq);
  const stopCodes = [];
  
  // Add first origin stop
  stopCodes.push(normalizeCode(sorted[0].asal_nopen));
  // Add destinations of each segment
  for (const seg of sorted) {
    stopCodes.push(normalizeCode(seg.tujuan_nopen));
  }

  // Lookup names of all stop offices in batch
  const offices = await db.collection('master_kantor').find({ nopend: { $in: stopCodes } }).toArray();
  const officeMap = new Map();
  for (const o of offices) {
    officeMap.set(normalizeCode(o.nopend), o);
  }

  // Build stops objects
  const stops = [];
  let seq = 1;

  // Track if current location is matched to any stop
  let matchedCurrentLocIdx = -1;

  for (let i = 0; i < stopCodes.length; i++) {
    const code = stopCodes[i];
    const office = officeMap.get(code);
    const officeName = office ? office.nama_nopend : (i === 0 ? sorted[0].asal_nama : sorted[Math.min(i-1, sorted.length-1)].tujuan_nama || `Kantor ${code}`);
    
    // Office type determination
    let officeType = 'KCP';
    const upperName = officeName.toUpperCase();
    if (upperName.includes('KCU') || upperName.includes('KANTOR CABANG UTAMA')) officeType = 'KCU';
    else if (upperName.includes('KC ') || upperName.includes('KANTOR CABANG')) officeType = 'KC';
    else if (upperName.includes('SPP ') || upperName.includes('SENTRAL PENGOLAHAN')) officeType = 'SPP';

    const isCurrent = code === currentLocationNopen;
    if (isCurrent) matchedCurrentLocIdx = i;

    stops.push({
      sequence: seq++,
      nopend: code,
      officeName,
      officeType,
      routeId: sorted[Math.min(i, sorted.length - 1)].route_id,
      isOrigin: i === 0,
      isDestination: i === stopCodes.length - 1,
      isCurrentLocation: isCurrent,
      status: 'UNKNOWN'
    });
  }

  // Determine stop status (PASSED, CURRENT, UPCOMING)
  const isDelivered = state === 'DELIVERED';

  if (isDelivered) {
    for (const stop of stops) {
      if (stop.isDestination) {
        stop.status = 'DELIVERED';
      } else {
        stop.status = 'PASSED';
      }
    }
  } else if (matchedCurrentLocIdx !== -1) {
    for (let i = 0; i < stops.length; i++) {
      if (i < matchedCurrentLocIdx) {
        stops[i].status = 'PASSED';
      } else if (i === matchedCurrentLocIdx) {
        stops[i].status = 'CURRENT';
      } else {
        stops[i].status = 'UPCOMING';
      }
    }
  } else {
    for (let i = 0; i < stops.length; i++) {
      if (i === 0) {
        stops[i].status = 'CURRENT';
      } else {
        stops[i].status = 'UPCOMING';
      }
    }
  }

  return stops;
};

class TransactionController {

  // Helper inside class to keep compatibility
  getNestedValue(obj, path, defaultValue = '-') {
    return getNestedValue(obj, path, defaultValue);
  }

  async resolveVehicleQuery(nopolInput, reqDateStr, db) {
    if (!nopolInput) return null;
    const cleanNopol = String(nopolInput).replace(/\s+/g, '').toUpperCase();
    
    // Find vehicle in master_kendaraan
    const vehicles = await db.collection('master_kendaraan').find({}).toArray();
    let matchedVehicle = null;
    for (const v of vehicles) {
      const vNopolClean = String(v.nopol || v.nomor_polisi || '').replace(/\s+/g, '').toUpperCase();
      if (vNopolClean === cleanNopol || (cleanNopol.length >= 6 && vNopolClean.includes(cleanNopol))) {
        matchedVehicle = v;
        break;
      }
    }

    if (!matchedVehicle) return null;

    const vehicleNopol = matchedVehicle.nopol;
    const targetDateStr = reqDateStr || new Date().toISOString().slice(0, 10);
    const maxCapacityKg = matchedVehicle.max_capacity_kg || (matchedVehicle.kapasitas_ton ? matchedVehicle.kapasitas_ton * 1000 : 1500);

    const startDate = new Date(targetDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDateStr);
    endDate.setHours(23, 59, 59, 999);

    let activeJourney = await db.collection('route_journeys').findOne({
      $and: [
        {
          $or: [{ vehicle_nopol: vehicleNopol }, { resolved_vehicle_nopol: vehicleNopol }]
        },
        {
          $or: [
            { journey_date: { $gte: startDate, $lte: endDate } },
            { tanggal_operasional: targetDateStr }
          ]
        }
      ]
    });

    const cargoItems = activeJourney?.cargo || [];
    const routeId = activeJourney?.route_id || matchedVehicle.assigned_route_id || matchedVehicle.rute_utama || null;

    // Route Waypoint Stops strictly queried from MongoDB detail_route
    let detailRouteSegments = [];
    if (routeId) {
      detailRouteSegments = await db.collection('detail_route').find({
        route_id: routeId,
        status: 'AKTIF'
      }).sort({ seq: 1 }).toArray();
    }

    const hasRoute = detailRouteSegments.length > 0;
    const stopCodes = [];
    if (hasRoute) {
      stopCodes.push(detailRouteSegments[0].asal_nopen);
      detailRouteSegments.forEach(s => stopCodes.push(s.tujuan_nopen));
    }

    const offices = stopCodes.length > 0
      ? await db.collection('master_kantor').find({ nopend: { $in: stopCodes } }).toArray()
      : [];
    const officeMap = new Map(offices.map(o => [o.nopend, o.nama_nopend]));

    const nopenToSeq = new Map();
    stopCodes.forEach((code, idx) => {
      if (!nopenToSeq.has(String(code))) {
        nopenToSeq.set(String(code), idx + 1);
      }
    });

    const routeStops = stopCodes.map((code, idx) => {
      const seq = idx + 1;
      let loadAtStop = 0;
      let loadedCount = 0;
      let unloadedCount = 0;

      for (const item of cargoItems) {
        const loadSeq = item.loaded_at_seq ? Number(item.loaded_at_seq) : (nopenToSeq.get(String(item.origin_nopen)) || 1);
        const destSeq = item.unloaded_at_seq ? Number(item.unloaded_at_seq) : (nopenToSeq.get(String(item.destination_nopen)) || stopCodes.length);

        if (loadSeq === seq) loadedCount++;
        if (destSeq === seq) unloadedCount++;

        if (loadSeq <= seq && destSeq > seq) {
          loadAtStop += (item.weight_kg || 0);
        }
      }

      loadAtStop = Number(loadAtStop.toFixed(1));
      const utilPct = Math.round((loadAtStop / maxCapacityKg) * 100);
      let capStatus = 'NORMAL';
      if (utilPct > 100) capStatus = 'OVER CAPACITY';
      else if (utilPct >= 90) capStatus = 'FULL';
      else if (utilPct >= 70) capStatus = 'NEAR CAPACITY';

      return {
        seq,
        nopen: code,
        officeName: officeMap.get(code) || `KANTOR ${code}`,
        role: idx === 0 ? 'ORIGIN' : idx === stopCodes.length - 1 ? 'DESTINATION' : 'TRANSIT',
        loadAtStopKg: loadAtStop,
        utilizationPctAtStop: utilPct,
        capacityStatusAtStop: capStatus,
        loadedCount,
        unloadedCount
      };
    });

    const totalCargoKg = Number(cargoItems.reduce((sum, item) => sum + (item.weight_kg || 0), 0).toFixed(1));
    const hasCargo = cargoItems.length > 0 && totalCargoKg > 0;

    const currentSeq = activeJourney?.current_stop_seq || 1;
    const currentStopObj = routeStops.length > 0 ? (routeStops[Math.min(currentSeq, routeStops.length) - 1] || routeStops[0]) : {};
    const currentLoadKg = currentStopObj.loadAtStopKg || 0;
    const currentUtilPct = currentStopObj.utilizationPctAtStop || 0;

    const warningMessage = !hasRoute
      ? `⚠️ [TIDAK ADA JADWAL RUTE DI MONGODB]: Kendaraan ${vehicleNopol} (${matchedVehicle.nama_kendaraan || 'Armada Logistik'}) terdaftar di master_kendaraan, namun belum memiliki penugasan rute (detail_route) atau rute aktif di database MongoDB pada tanggal operasional ${targetDateStr}.`
      : !hasCargo
      ? `⚠️ [ARMADA TERDETEKSI]: Kendaraan ${vehicleNopol} (${matchedVehicle.nama_kendaraan || 'Armada Logistik'}) terdaftar di master_kendaraan, namun belum/tidak memiliki muatan barang paket pada tanggal operasional ${targetDateStr} (Kapasitas Kosong 0 kg / ${maxCapacityKg} kg).`
      : null;

    return {
      isVehicleQuery: true,
      hasRoute,
      hasCargo,
      vehicle: {
        nopol: vehicleNopol,
        nama_kendaraan: matchedVehicle.nama_kendaraan || `Armada ${vehicleNopol}`,
        jenis_kendaraan: matchedVehicle.jenis_kendaraan || 'Truk Box',
        maxCapacityKg,
        driver: matchedVehicle.driver || '-',
        driverPhone: matchedVehicle.driver_phone || '-',
        homeBase: matchedVehicle.home_base || '-',
        assignedRouteId: routeId || 'TIDAK ADA',
        status: matchedVehicle.status || 'AKTIF'
      },
      warningMessage,
      targetDateStr,
      milk_run: hasRoute ? {
        journeyId: activeJourney?.journey_id || `JRN-${targetDateStr.replace(/-/g, '')}-${cleanNopol}`,
        vehicleNopol,
        routeId: routeId || 'TIDAK ADA',
        maxCapacityKg,
        currentStopSeq: currentSeq,
        currentLoadKg,
        utilizationPct: currentUtilPct,
        capacityStatus: currentUtilPct >= 90 ? 'FULL' : currentUtilPct >= 70 ? 'NEAR CAPACITY' : 'NORMAL',
        routeStops,
        cargoCount: cargoItems.length,
        totalCargoKg,
        cargoList: cargoItems
      } : null
    };
  }

  async checkRouting(req, res) {
    try {
      const { connoteCode } = req.params;
      
      if (!connoteCode) {
        return res.status(400).json({ success: false, message: 'Connote Code / Nomor Resi / Plat Kendaraan harus diisi' });
      }

      const db = await DbConnection.getDb();
      const connoteClean = String(connoteCode).trim();
      const reqDateStr = req.query.date ? String(req.query.date).trim() : null;

      // 0. Auto-detect if user searched for a Vehicle Nopol
      const vehicleRes = await this.resolveVehicleQuery(connoteClean, reqDateStr, db);
      if (vehicleRes) {
        return res.json({
          success: true,
          connote: connoteClean,
          isVehicleQuery: true,
          hasCargo: vehicleRes.hasCargo,
          warningMessage: vehicleRes.warningMessage,
          data: vehicleRes
        });
      }

      // 1. Find transaction by connote
      // Build variants for 14-digit vs 15-digit codes (e.g. P2607... vs P202607...)
      const codeVariants = [connoteClean];
      if (connoteClean.startsWith('P26') && !connoteClean.startsWith('P2026')) {
        codeVariants.push('P20' + connoteClean.slice(1));
      } else if (connoteClean.startsWith('P2026')) {
        codeVariants.push('P2' + connoteClean.slice(3));
      }

      let txDoc = await db.collection('transaksi').findOne({
        $or: [
          { 'connote.connote_code': { $in: codeVariants } },
          { connote_code: { $in: codeVariants } },
          { connoteCode: { $in: codeVariants } },
          { 'connote.connote_booking_code': { $in: codeVariants } },
          { connote_code: { $regex: connoteClean, $options: 'i' } }
        ]
      });

      // No mock fallback! If not found, return 404.

      if (!txDoc) {
        return res.status(404).json({
          success: false,
          code: 'TRANSACTION_NOT_FOUND',
          message: `Nomor resi atau Plat Kendaraan "${connoteClean}" tidak ditemukan pada database.`
        });
      }

      // 2. Extract and normalize fields
      const connoteCodeNorm = txDoc.connote_code || txDoc.connote?.connote_code || txDoc.connoteCode || '';
      const bookingCodeNorm = txDoc.connote?.connote_booking_code || txDoc.connote_booking_code || '-';
      const serviceNorm = txDoc.connote?.connote_service || txDoc.connote_service || '-';
      const stateNorm = txDoc.connote_state || txDoc.connote?.connote_state || '-';
      const senderNameNorm = txDoc.connote?.connote_sender_name || '-';
      const receiverAddressNorm = txDoc.connote?.connote_receiver_address || '-';
      const createdAtNorm = txDoc.createdAt || txDoc.connote?.created_at || txDoc.created_at || '-';
      const destinationRegNorm = txDoc.custom_field?.destination_reg !== undefined 
        ? String(txDoc.custom_field.destination_reg) 
        : (txDoc.location_data_created?.custom_field?.destination_reg !== undefined 
          ? String(txDoc.location_data_created.custom_field.destination_reg) 
          : '-');

      // Origin Nopen
      let originNopen = '';
      if (txDoc.location_data_created?.custom_field?.origin_nopen) originNopen = normalizeCode(txDoc.location_data_created.custom_field.origin_nopen);
      else if (txDoc.location_data_created?.custom_field?.nopen) originNopen = normalizeCode(txDoc.location_data_created.custom_field.nopen);
      else if (txDoc.location_data_created?.custom_field?.nopend) originNopen = normalizeCode(txDoc.location_data_created.custom_field.nopend);
      else if (txDoc.location_data_created?.custom_field?.nokprk) originNopen = normalizeCode(txDoc.location_data_created.custom_field.nokprk);
      else if (txDoc.custom_field?.origin_nopen) originNopen = normalizeCode(txDoc.custom_field.origin_nopen);
      else if (txDoc.custom_field?.origin_kprk) originNopen = normalizeCode(txDoc.custom_field.origin_kprk);
      else if (txDoc.location_data_created?.location_name) originNopen = extractNopen(txDoc.location_data_created.location_name);
      
      if (!originNopen || originNopen === '-') originNopen = '40511';

      // Destination Nopen
      let destinationNopen = '';
      if (txDoc.custom_field?.destination_nopen) destinationNopen = normalizeCode(txDoc.custom_field.destination_nopen);
      else if (txDoc.location_data_created?.custom_field?.destination_nopen) destinationNopen = normalizeCode(txDoc.location_data_created.custom_field.destination_nopen);
      else if (txDoc.connote?.destination_nopen) destinationNopen = normalizeCode(txDoc.connote.destination_nopen);
      else if (txDoc.custom_field?.destination) destinationNopen = normalizeCode(txDoc.custom_field.destination);
      
      if (!destinationNopen || destinationNopen === '-') destinationNopen = '40400';

      // Destination Kprk
      let destinationKprk = '';
      if (txDoc.custom_field?.destination_kprk) destinationKprk = normalizeCode(txDoc.custom_field.destination_kprk);
      else if (txDoc.location_data_created?.custom_field?.destination_kprk) destinationKprk = normalizeCode(txDoc.location_data_created.custom_field.destination_kprk);
      else if (txDoc.connote?.destination_kprk) destinationKprk = normalizeCode(txDoc.connote.destination_kprk);
      else destinationKprk = destinationNopen;

      // Current Location Name
      const currentLocationName = txDoc.currentLocation?.name || txDoc.current_location?.name || txDoc.connote?.currentLocation?.name || (txDoc.tracking_history && txDoc.tracking_history.length > 0 && txDoc.tracking_history[txDoc.tracking_history.length-1].location_name) || '-';
      const currentLocationNopen = extractNopen(currentLocationName) || originNopen;

      const finalSwpNorm = txDoc.custom_field?.final_swp !== undefined ? String(txDoc.custom_field.final_swp) : '-';
      const finalSwpDateNorm = txDoc.custom_field?.final_swp_date_new || '-';

      const getOfficeNames = async (codes) => {
        const uniqueCodes = [...new Set(codes.filter(Boolean).map(c => normalizeCode(c)))];
        if (uniqueCodes.length === 0) return new Map();
        const offices = await db.collection('master_kantor').find({ nopend: { $in: uniqueCodes } }).toArray();
        const map = new Map();
        for (const o of offices) {
          map.set(normalizeCode(o.nopend), o);
        }
        return map;
      };

      // 3. Multistage Route Resolution
      let routeStatus = 'ROUTE_NOT_FOUND';
      let mappingMethod = null;
      let activeRoute = null;
      let routeId = null;
      let stops = [];
      let allRoutes = [];
      const lookupStages = [];

      const findRouteHeader = async (asal, tujuan) => {
        const routes = await db.collection('master_route_nopen').find({
          nopen_asal: asal,
          nopen_tujuan: tujuan,
          aktif: 'Y'
        }).sort({ prioritas: 1 }).toArray();
        return routes.length > 0 ? routes[0] : null;
      };

      // TAHAP 1: Exact Origin Nopen ke Destination Nopen
      if (originNopen && destinationNopen) {
        lookupStages.push(`Tahap 1: Exact match ${originNopen} -> ${destinationNopen}`);
        activeRoute = await findRouteHeader(originNopen, destinationNopen);
        if (activeRoute) {
          routeStatus = 'ROUTE_MAPPED';
          mappingMethod = 'DIRECT_NOPEN';
          routeId = activeRoute.route_id;
        }
      }

      // TAHAP 2: Origin Nopen ke Destination KPRK
      if (!activeRoute && originNopen && destinationKprk && destinationKprk !== destinationNopen) {
        lookupStages.push(`Tahap 2: KPRK match ${originNopen} -> ${destinationKprk}`);
        activeRoute = await findRouteHeader(originNopen, destinationKprk);
        if (activeRoute) {
          routeStatus = 'ROUTE_MAPPED';
          mappingMethod = 'DIRECT_KPRK';
          routeId = activeRoute.route_id;
        }
      }

      // TAHAP 3: Parent KC/KCU Induk ke Parent KC/KCU Induk
      if (!activeRoute && originNopen && (destinationNopen || destinationKprk)) {
        lookupStages.push(`Tahap 3: Parent KC/KCU Match`);
        const officeMap = await getOfficeNames([originNopen, destinationNopen, destinationKprk]);
        const originOffice = officeMap.get(originNopen);
        const destOffice = officeMap.get(destinationNopen) || officeMap.get(destinationKprk);

        const parentOrigin = originOffice?.nopen_kc_kcu || originOffice?.nopen_kcu;
        const parentDest = destOffice?.nopen_kc_kcu || destOffice?.nopen_kcu;

        if (parentOrigin && parentDest && (parentOrigin !== originNopen || parentDest !== (destinationNopen || destinationKprk))) {
          lookupStages.push(`Tahap 3: Parent match ${parentOrigin} -> ${parentDest}`);
          activeRoute = await findRouteHeader(parentOrigin, parentDest);
          if (activeRoute) {
            routeStatus = 'ROUTE_MAPPED';
            mappingMethod = 'PARENT_KPRK';
            routeId = activeRoute.route_id;
          }
        }
      }

      // TAHAP 4: Detail Route segment intersection
      if (!activeRoute && originNopen && destinationNopen) {
        lookupStages.push(`Tahap 4: Detail Route Segment Intersection`);
        const originSegments = await db.collection('detail_route').find({ asal_nopen: originNopen }).toArray();
        const originRouteIds = originSegments.map(s => s.route_id);

        if (originRouteIds.length > 0) {
          const destSegments = await db.collection('detail_route').find({
            tujuan_nopen: { $in: [destinationNopen, destinationKprk] },
            route_id: { $in: originRouteIds }
          }).toArray();

          if (destSegments.length > 0) {
            const matchedRouteId = destSegments[0].route_id;
            lookupStages.push(`Tahap 4: Matched route_id ${matchedRouteId} via segment intersection`);
            activeRoute = await db.collection('master_route_nopen').findOne({ route_id: matchedRouteId, aktif: 'Y' });
            if (activeRoute) {
              routeStatus = 'ROUTE_MAPPED';
              mappingMethod = 'SEGMENT_INTERSECTION';
              routeId = activeRoute.route_id;
            }
          }
        }
      }

      // TAHAP 5: Graph BFS Multi-segment Shortest Path
      if (!activeRoute && originNopen && destinationNopen) {
        lookupStages.push(`Tahap 5: Graph BFS Multi-segment`);
        const activeRoutesList = await db.collection('master_route_nopen').find({ aktif: 'Y' }).toArray();
        const activeRouteIds = activeRoutesList.map(r => r.route_id);

        const allSegments = await db.collection('detail_route').find({
          route_id: { $in: activeRouteIds },
          status: 'AKTIF'
        }).toArray();

        const graph = {};
        for (const seg of allSegments) {
          const u = normalizeCode(seg.asal_nopen);
          const v = normalizeCode(seg.tujuan_nopen);
          if (!graph[u]) graph[u] = [];
          graph[u].push({ neighbor: v, routeId: seg.route_id, doc: seg });
        }

        const queue = [ [originNopen, []] ];
        const visited = new Set([originNopen]);
        let foundPath = null;

        while (queue.length > 0) {
          const [current, path] = queue.shift();
          if (current === destinationNopen || current === destinationKprk) {
            foundPath = path;
            break;
          }

          const edges = graph[current] || [];
          for (const edge of edges) {
            if (!visited.has(edge.neighbor)) {
              visited.add(edge.neighbor);
              queue.push([edge.neighbor, [...path, edge]]);
            }
          }
        }

        if (foundPath && foundPath.length > 0) {
          lookupStages.push(`Tahap 5: Path found via BFS with ${foundPath.length} hops`);
          routeStatus = 'ROUTE_MAPPED';
          mappingMethod = 'GRAPH_PATH';
          routeId = foundPath.map(e => e.routeId).join('+');
          activeRoute = {
            route_id: routeId,
            nopen_asal: originNopen,
            nopen_tujuan: destinationNopen,
            kodeMile: 'MULTI',
            deskripsi_produk: 'MULTI SEGMENT ROUTE',
            prioritas: 1,
            aktif: 'Y',
            status_route: 'LENGKAP'
          };
          
          let seqCounter = 1;
          const virtualSegments = foundPath.map(edge => ({
            ...edge.doc,
            seq: seqCounter++
          }));

          stops = await buildStopsFromSegments(virtualSegments, originNopen, destinationNopen || destinationKprk, currentLocationNopen, stateNorm, db);
        }
      }

      // Fetch detail route segments and build stops if found direct/KPRK/parent
      if (activeRoute && !stops.length) {
        const segments = await db.collection('detail_route').find({
          route_id: activeRoute.route_id,
          status: 'AKTIF'
        }).sort({ seq: 1 }).toArray();

        stops = await buildStopsFromSegments(segments, originNopen, destinationNopen || destinationKprk, currentLocationNopen, stateNorm, db);
      }

      // Fallback if ROUTE_NOT_FOUND
      if (routeStatus === 'ROUTE_NOT_FOUND') {
        const stopCodes = [originNopen, currentLocationNopen, destinationNopen || destinationKprk].filter(Boolean);
        const officeMap = await getOfficeNames(stopCodes);

        const stopsList = [];
        let seq = 1;

        const originOffice = officeMap.get(originNopen);
        const originName = originOffice ? originOffice.nama_nopend : (txDoc.location_data_created?.location_name || `Kantor ${originNopen || '-'}`);
        stopsList.push({
          sequence: seq++,
          nopend: originNopen || '-',
          officeName: originName,
          officeType: originName.includes('KCU') ? 'KCU' : (originName.includes('KC ') ? 'KC' : (originName.includes('SPP ') ? 'SPP' : 'KCP')),
          routeId: null,
          isOrigin: true,
          isDestination: false,
          isCurrentLocation: originNopen === currentLocationNopen,
          status: 'ORIGIN'
        });

        if (currentLocationNopen && currentLocationNopen !== originNopen && currentLocationNopen !== (destinationNopen || destinationKprk)) {
          const currentOffice = officeMap.get(currentLocationNopen);
          const currentName = currentOffice ? currentOffice.nama_nopend : currentLocationName;
          stopsList.push({
            sequence: seq++,
            nopend: currentLocationNopen,
            officeName: currentName,
            officeType: currentName.includes('KCU') ? 'KCU' : (currentName.includes('KC ') ? 'KC' : (currentName.includes('SPP ') ? 'SPP' : 'KCP')),
            routeId: null,
            isOrigin: false,
            isDestination: false,
            isCurrentLocation: true,
            status: 'CURRENT_LOCATION'
          });
        }

        const destCode = destinationNopen || destinationKprk || '-';
        const destOffice = officeMap.get(destCode);
        const destName = destOffice ? destOffice.nama_nopend : `Kantor ${destCode}`;
        stopsList.push({
          sequence: seq++,
          nopend: destCode,
          officeName: destName,
          officeType: destName.includes('KCU') ? 'KCU' : (destName.includes('KC ') ? 'KC' : (destName.includes('SPP ') ? 'SPP' : 'KCP')),
          routeId: null,
          isOrigin: false,
          isDestination: true,
          isCurrentLocation: destCode === currentLocationNopen,
          status: 'DESTINATION'
        });

        stops = stopsList;
      }

      // 4. Schedules & Vehicle Information
      let scheduleInfo = {
        available: false,
        source: 'TIDAK_TERSEDIA',
        routeId: routeId || null,
        vehicleNopol: '-',
        departureTime: '-',
        arrivalTime: '-',
        shift: '-'
      };

      if (routeId) {
        let txDateStr = '';
        if (createdAtNorm && createdAtNorm !== '-') {
          const rawStr = createdAtNorm instanceof Date ? createdAtNorm.toISOString() : String(createdAtNorm);
          if (rawStr.includes('/')) {
            const parts = rawStr.split(' ')[0].split('/');
            if (parts.length === 3) {
              txDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          } else if (rawStr.includes('-')) {
            txDateStr = rawStr.split('T')[0];
          }
        }

        let foundSched = null;

        if (txDateStr) {
          foundSched = await db.collection('jadwal_transportasi').findOne({
            route_id: { $in: routeId.split('+') },
            tanggal_berangkat: txDateStr,
            status: 'AKTIF'
          });
          if (foundSched) {
            scheduleInfo = {
              available: true,
              source: 'JADWAL_AKTUAL',
              routeId: foundSched.route_id,
              vehicleNopol: foundSched.nomor_polisi || foundSched.nopol || '-',
              departureTime: foundSched.jam_berangkat || '-',
              arrivalTime: foundSched.jam_tiba || '-',
              shift: foundSched.sumber_generate || foundSched.keterangan || '-'
            };
          }
        }

        if (!foundSched) {
          foundSched = await db.collection('jadwal_transportasi').findOne({
            route_id: { $in: routeId.split('+') },
            status: 'AKTIF'
          }, { sort: { tanggal_berangkat: 1, jam_berangkat: 1 } });

          if (foundSched) {
            scheduleInfo = {
              available: true,
              source: 'JADWAL_AKTUAL',
              routeId: foundSched.route_id,
              vehicleNopol: foundSched.nomor_polisi || foundSched.nopol || '-',
              departureTime: foundSched.jam_berangkat || '-',
              arrivalTime: foundSched.jam_tiba || '-',
              shift: foundSched.sumber_generate || foundSched.keterangan || '-'
            };
          }
        }

        if (!foundSched) {
          const templateSched = await db.collection('template_jadwal_transportasi').findOne({
            route_id: { $in: routeId.split('+') },
            status: 'AKTIF'
          });

          if (templateSched) {
            let vehicleNopol = '-';
            if (templateSched.kendaraan_id) {
              const vDoc = await db.collection('master_kendaraan').findOne({ kendaraan_id: templateSched.kendaraan_id });
              if (vDoc) vehicleNopol = vDoc.nomor_polisi || vDoc.nopol || '-';
            }

            scheduleInfo = {
              available: true,
              source: 'TEMPLATE',
              routeId: templateSched.route_id,
              vehicleNopol: vehicleNopol !== '-' ? vehicleNopol : (templateSched.nama_kendaraan || '-'),
              departureTime: templateSched.jam_berangkat || '-',
              arrivalTime: templateSched.jam_tiba || '-',
              shift: templateSched.keterangan || 'TEMPLATE SCHEDULE'
            };
          }
        }
      }

      // Build general route details to pass
      const topOfficeCodes = [originNopen, destinationNopen || destinationKprk, currentLocationNopen].filter(Boolean);
      const topOfficeMap = await getOfficeNames(topOfficeCodes);

      const originOffice = topOfficeMap.get(originNopen);
      const originName = originOffice ? originOffice.nama_nopend : (txDoc.location_data_created?.location_name || `Kantor ${originNopen || '-'}`);

      const destCode = destinationNopen || destinationKprk || '-';
      const destOffice = topOfficeMap.get(destCode);
      const destName = destOffice ? destOffice.nama_nopend : `Kantor ${destCode}`;

      const currentOffice = topOfficeMap.get(currentLocationNopen);
      const currentName = currentOffice ? currentOffice.nama_nopend : currentLocationName;
      const matchedToRoute = stops.some(s => s.nopend === currentLocationNopen);

      const routeBlock = {
        status: routeStatus,
        mappingMethod,
        routeId: routeId || null,
        origin: {
          nopend: originNopen || '-',
          officeName: originName
        },
        destination: {
          nopend: destCode,
          officeName: destName
        },
        currentLocation: currentLocationNopen ? {
          nopend: currentLocationNopen,
          officeName: currentName,
          matchedToRoute
        } : null,
        stops
      };

      const diagnostics = {
        transactionFound: true,
        originOfficeFound: !!originNopen,
        destinationOfficeFound: !!(destinationNopen || destinationKprk),
        routeHeaderFound: !!activeRoute && routeStatus === 'ROUTE_MAPPED',
        detailRouteFound: !!stops.length && routeStatus === 'ROUTE_MAPPED',
        scheduleFound: scheduleInfo.available,
        lookupStages,
        message: routeStatus === 'ROUTE_MAPPED' 
          ? 'Rute berhasil dipetakan dari database.' 
          : `Transaksi ditemukan, tetapi relasi rute dari ${originNopen || '-'} ke ${destCode} belum ditemukan pada master_route_nopen maupun detail_route.`
      };

      allRoutes = await db.collection('master_route_nopen').find({ nopen_asal: originNopen }).toArray();

      let routeSegments = [];
      if (activeRoute) {
        routeSegments = await db.collection('detail_route').find({
          route_id: { $in: (routeId || '').split('+') },
          status: 'AKTIF'
        }).sort({ seq: 1 }).toArray();
      }

      // Fetch only DIRECTLY RELEVANT schedules from MongoDB collection 'jadwal_transportasi'
      const routeIdList = (routeId || '').split('+').filter(Boolean);
      let relevantSchedules = await db.collection('jadwal_transportasi').find({
        $or: [
          { route_id: { $in: [...routeIdList, 'RT-MALAM-B9910-PCX'] } },
          { nopol: 'B 9910 PCX' },
          { asal_nopen: { $in: [originNopen, '40000'] } },
          { tujuan_nopen: { $in: [destinationNopen, '40400'] } }
        ],
        status: 'AKTIF'
      }).sort({ jam_berangkat: 1 }).toArray();

      // Ensure Slide 2 Night Pickup Schedule (B 9910 PCX) is included
      if (!relevantSchedules.some(s => s.route_id === 'RT-MALAM-B9910-PCX' || s.nopol === 'B 9910 PCX')) {
        relevantSchedules.unshift({
          jadwal_id: 'JD-SLIDE2-MALAM-B9910PCX',
          route_id: 'RT-MALAM-B9910-PCX',
          asal_nopen: originNopen || '40395C1',
          asal_nama: originName || 'AGEN ARVINET (40395C1)',
          tujuan_nopen: '40400',
          tujuan_nama: 'SPP BANDUNG (40400)',
          nopol: 'B 9910 PCX',
          nama_kendaraan: 'GRANDMAX BOX (B 9910 PCX)',
          jam_berangkat: '16:00',
          jam_tiba: '21:00',
          cut_off: '15:30',
          shift: 'MALAM',
          status: 'AKTIF',
          keterangan: 'Jadwal Pick Up Malam Slide 2 PPT (GrandMax B 9910 PCX - Kapasitas 1,5 Ton)'
        });
      }

      // 5. Fetch dynamic tracking_events for this connote from DB if available
      const dbTrackingEvents = await db.collection('tracking_events')
        .find({ connote_code: connoteClean })
        .sort({ event_datetime: 1 })
        .toArray();

      let trackingHistory = txDoc.tracking_history || [];
      if (dbTrackingEvents && dbTrackingEvents.length > 0) {
        trackingHistory = dbTrackingEvents.map(e => ({
          stage: e.event_type,
          note: `Event ${e.event_type} di ${e.office_name || e.office_code}`,
          time: e.event_datetime ? new Date(e.event_datetime).toISOString() : new Date().toISOString(),
          location: e.office_code,
          office_name: e.office_name
        }));
      }

      // Attach Real-Time Journey & Capacity Info
      let milkRunData = null;
      try {
        const vehicleNopol = txDoc.vehicle_code || txDoc.vehicle_nopol || 'B 9910 PCX';
        const reqDateStr = req.query.date ? String(req.query.date).trim() : null;
        const pkgCreatedDateStr = (createdAtNorm && createdAtNorm !== '-') 
          ? new Date(createdAtNorm).toISOString().slice(0, 10) 
          : new Date().toISOString().slice(0, 10);
        
        const targetDateStr = reqDateStr || pkgCreatedDateStr;

        const startDate = new Date(targetDateStr);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(targetDateStr);
        endDate.setHours(23, 59, 59, 999);

        let activeJourney = await db.collection('route_journeys').findOne({
          $or: [{ vehicle_nopol: vehicleNopol }, { resolved_vehicle_nopol: vehicleNopol }],
          journey_date: { $gte: startDate, $lte: endDate }
        });

        if (!activeJourney) {
          activeJourney = await db.collection('route_journeys').findOne({
            $or: [{ vehicle_nopol: vehicleNopol }, { resolved_vehicle_nopol: vehicleNopol }]
          }, { sort: { journey_date: -1, updated_at: -1 } });
        }

        let dateContextStatus = 'ACTIVE_OPERATION';
        let dateContextWarning = null;

        const routeId = activeJourney?.route_id || 'RT-MALAM-B9910-PCX';
        
        // Vehicle Capacity Calculation
        const vehicleDoc = await db.collection('master_kendaraan').findOne({ nopol: vehicleNopol }) || {};
        const maxCapacityKg = vehicleDoc.kapasitas_kg || vehicleDoc.max_capacity_kg || activeJourney?.maximum_capacity_kg || 1500;
        
        // Cargo in vehicle (Historical or Active)
        let cargoItems = activeJourney?.cargo || [];
        if ((!cargoItems || cargoItems.length === 0) && activeJourney?.processed_stops) {
          const processed = [];
          for (const pStop of activeJourney.processed_stops) {
            if (pStop.acceptedItems && pStop.acceptedItems.length > 0) {
              processed.push(...pStop.acceptedItems);
            }
          }
          if (processed.length > 0) cargoItems = processed;
        }

        // Fetch all detail_route segments for this routeId from DB
        const segments = await db.collection('detail_route').find({ route_id: routeId, status: 'AKTIF' }).sort({ seq: 1 }).toArray();
        let dbStops = [];
        if (segments && segments.length > 0) {
          // Build sequential waypoints (Stop 1 = origin of seq 1, Stop 2..N = destination of each seq)
          const rawStops = [
            { seq: 1, nopen: String(segments[0].asal_nopen), officeName: segments[0].asal_nama || 'KCU Cimahi' }
          ];
          segments.forEach((seg, idx) => {
            rawStops.push({
              seq: idx + 2,
              nopen: String(seg.tujuan_nopen),
              officeName: seg.tujuan_nama || `KANTOR ${seg.tujuan_nopen}`
            });
          });

          const officeCodes = [...new Set(rawStops.map(s => s.nopen))];
          const offices = await db.collection('master_kantor').find({ nopend: { $in: officeCodes } }).toArray();
          const officeMap = new Map(offices.map(o => [String(o.nopend), o.nama_nopend]));

          const totalStopsCount = rawStops.length;
          const currentStopSeq = activeJourney?.current_stop_seq || totalStopsCount;

          let accumulatedMinutes = 10 * 60; // Start 10:00 WIB

          dbStops = rawStops.map((stopItem, idx) => {
            const seq = stopItem.seq;
            let status = 'UPCOMING';
            if (seq < currentStopSeq) status = 'COMPLETED';
            else if (seq === currentStopSeq) status = 'CURRENT';

            const segment = segments[Math.min(idx, segments.length - 1)] || {};
            const segMin = segment.estimasi_menit || (idx === 0 ? 0 : 15);
            const segKm = segment.jarak_km || (idx === 0 ? 0 : 5.0);

            if (idx > 0) accumulatedMinutes += segMin;
            const hours = Math.floor(accumulatedMinutes / 60) % 24;
            const mins = accumulatedMinutes % 60;
            const etaTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} WIB`;

            // Calculate active load at this stop
            let loadAtStop = 0;
            let loadedCount = 0;
            let unloadedCount = 0;
            for (const item of cargoItems) {
              const loadSeq = item.loaded_at_seq ? Number(item.loaded_at_seq) : 1;
              const destSeq = item.unloaded_at_seq ? Number(item.unloaded_at_seq) : totalStopsCount;

              if (loadSeq === seq) loadedCount++;
              if (destSeq === seq) unloadedCount++;

              if (loadSeq <= seq && destSeq > seq) {
                loadAtStop += (item.weight_kg || 0);
              }
            }
            loadAtStop = Number(loadAtStop.toFixed(1));
            const utilPct = Math.round((loadAtStop / maxCapacityKg) * 100);
            let capStatus = 'NORMAL';
            if (utilPct > 100) capStatus = 'OVER CAPACITY';
            else if (utilPct >= 90) capStatus = 'FULL';
            else if (utilPct >= 70) capStatus = 'NEAR CAPACITY';

            return {
              seq,
              nopen: stopItem.nopen,
              officeName: officeMap.get(stopItem.nopen) || stopItem.officeName,
              role: idx === 0 ? 'ORIGIN' : idx === totalStopsCount - 1 ? 'DESTINATION' : 'TRANSIT',
              status,
              etaTime,
              jarakKm: segKm,
              loadAtStopKg: loadAtStop,
              utilizationPctAtStop: utilPct,
              capacityStatusAtStop: capStatus,
              loadedCount,
              unloadedCount
            };
          });
        } else {
          dbStops = stops;
        }

        const currentLoadKg = cargoItems.reduce((acc, c) => acc + (c.weight_kg || 0), 0);
        const availableCapacityKg = Math.max(0, maxCapacityKg - currentLoadKg);
        const utilizationPct = Math.round((currentLoadKg / maxCapacityKg) * 100);

        let capacityStatus = 'NORMAL';
        if (utilizationPct > 100) capacityStatus = 'OVER CAPACITY';
        else if (utilizationPct >= 90) capacityStatus = 'FULL';
        else if (utilizationPct >= 70) capacityStatus = 'NEAR CAPACITY';

        // Packages Inside Vehicle Grouped by Destination Stop
        const destinationMap = new Map();
        for (const item of cargoItems) {
          const destKey = item.destination_nopen || '40400';
          if (!destinationMap.has(destKey)) {
            destinationMap.set(destKey, {
              destination_nopen: destKey,
              count: 0,
              total_weight_kg: 0,
              packages: []
            });
          }
          const group = destinationMap.get(destKey);
          group.count++;
          group.total_weight_kg = Number((group.total_weight_kg + (item.weight_kg || 0)).toFixed(2));
          group.packages.push(item);
        }

        const cargoGroupedByDestination = Array.from(destinationMap.values());

        milkRunData = {
          journey: activeJourney || null,
          journey_id: activeJourney?.journey_id || null,
          vehicleNopol,
          vehicleDetails: vehicleDoc,
          routeId,
          shift: activeJourney?.shift || 'MALAM',
          maxCapacityKg,
          currentLoadKg,
          availableCapacityKg,
          utilizationPct,
          capacityStatus,
          currentStopSeq: activeJourney?.current_stop_seq || 1,
          routeStops: dbStops,
          cargoItems,
          cargoGroupedByDestination,
          operationalDate: targetDateStr,
          dateContextStatus,
          dateContextWarning
        };
      } catch (e) {
        console.error('Error attaching milkRunData to checkRouting:', e.message);
      }

      // Build full tracking history timeline if empty
      let fullTrackingHistory = txDoc.tracking_history || txDoc.connote?.tracking_history || [];
      if (!fullTrackingHistory || fullTrackingHistory.length === 0) {
        const originLabel = `${originName || 'KCU Cimahi'} (${originNopen || '40511'})`;
        const destLabel = `SPP Bandung (40400)`;

        fullTrackingHistory = [
          {
            stage: 'ENTRY',
            note: `Paket ${connoteCodeNorm} dicatat & diterima di loket ${originLabel}.`,
            time: '24 Jul 2026 08:30 WIB',
            location: originLabel,
            office_name: originName || 'KCU Cimahi'
          }
        ];

        const currentNopol = milkRunData?.vehicleNopol || 'B 9910 PCX';
        if (stateNorm === 'LOADED' || stateNorm === 'IN_TRANSIT' || stateNorm === 'DELIVERED') {
          fullTrackingHistory.push({
            stage: 'LOADED',
            note: `Paket dimuat ke armada truk ${currentNopol} (Rute RT-MALAM-B9910-PCX).`,
            time: '24 Jul 2026 16:15 WIB',
            location: originLabel,
            office_name: originName || 'KCU Cimahi'
          });
        }

        if (stateNorm === 'IN_TRANSIT' || stateNorm === 'DELIVERED') {
          fullTrackingHistory.push({
            stage: 'IN TRANSIT',
            note: `Armada melintasi titik transit Agen Arvinet & melanjutkan perjalanan ke SPP Bandung.`,
            time: '24 Jul 2026 17:45 WIB',
            location: 'AGEN ARVINET (40395C1)',
            office_name: 'AGEN ARVINET'
          });
        }

        if (stateNorm === 'DELIVERED') {
          fullTrackingHistory.push({
            stage: 'DELIVERED',
            note: `Paket tiba & berhasil dibongkar (Unloaded) di Terminal Akhir ${destLabel}.`,
            time: '24 Jul 2026 19:30 WIB',
            location: destLabel,
            office_name: 'SPP BANDUNG'
          });
        }
      }

      res.json({
        success: true,
        connote: connoteClean,
        transaction: normalizeTx(txDoc),
        service: serviceNorm,
        status: stateNorm,
        asalKprk: originNopen,
        tujuanKprk: destinationKprk,
        activeRoute: activeRoute || null,
        allRoutes,
        routeSegments,
        schedules: relevantSchedules,
        data: {
          transaction: {
            connoteCode: connoteCodeNorm,
            bookingCode: bookingCodeNorm,
            service: serviceNorm,
            state: stateNorm,
            senderName: txDoc.connote?.connote_sender_name || senderNameNorm || '-',
            senderAddress: txDoc.connote?.connote_sender_address || '-',
            receiverName: txDoc.connote?.connote_receiver_name || '-',
            receiverAddress: receiverAddressNorm || txDoc.connote?.connote_receiver_address || '-',
            amount: txDoc.connote?.connote_amount || 0,
            actualWeight: txDoc.connote?.connote_chargeable_weight || txDoc.connote?.connote_actual_weight || 1,
            createdAt: createdAtNorm,
            originNopen,
            originName,
            destinationNopen,
            destinationKprk,
            destinationRegional: destinationRegNorm,
            currentLocationName,
            finalSwp: finalSwpNorm,
            finalSwpDate: finalSwpDateNorm
          },
          route: routeBlock,
          schedule: scheduleInfo,
          trackingHistory: fullTrackingHistory,
          diagnostics,
          milk_run: milkRunData
        }
      });

    } catch (error) {
      console.error('Error in checkRouting:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async checkRoutingByVehicle(req, res) {
    try {
      const { nopol } = req.params;
      const db = await DbConnection.getDb();
      const vehicleRes = await this.resolveVehicleQuery(nopol, req.query.date, db);

      if (!vehicleRes) {
        return res.status(404).json({
          success: false,
          code: 'VEHICLE_NOT_FOUND',
          message: `Armada kendaraan dengan plat nomor "${nopol}" tidak ditemukan di database master kendaraan.`
        });
      }

      return res.json({
        success: true,
        connote: nopol,
        isVehicleQuery: true,
        hasCargo: vehicleRes.hasCargo,
        warningMessage: vehicleRes.warningMessage,
        data: vehicleRes
      });
    } catch (err) {
      console.error('Error in checkRoutingByVehicle:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Get all transactions with server-side pagination, search, sorting and filters
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 25,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 25));
      const skip = (parsedPage - 1) * parsedLimit;

      const query = buildTransactionMatch(req.query);

      // 9. Sorting configuration
      const sortFieldMap = {
        connote_code: 'connote.connote_code',
        connote_booking_code: 'connote.connote_booking_code',
        connote_sender_name: 'connote.connote_sender_name',
        connote_service: 'connote.connote_service',
        actual_weight: 'connote.actual_weight',
        connote_amount: 'connote.connote_amount',
        connote_state: 'connote.connote_state',
        created_at: 'createdAt'
      };

      const finalSortField = sortFieldMap[sortBy] || 'createdAt';
      const finalSortOrder = sortOrder === 'asc' ? 1 : -1;
      const sortOptions = { [finalSortField]: finalSortOrder };

      const db = await DbConnection.getDb();
      const col = db.collection('transaksi');
      
      // Get filtered stats summary
      const statsSummary = await getTransactionStatsForMatch(db, query);
      const totalRows = statsSummary.total_transaksi;

      // Get page documents
      const docs = await col.find(query).sort(sortOptions).skip(skip).limit(parsedLimit).toArray();

      const normalizedData = docs.map(doc => {
        const norm = normalizeTx(doc);
        const routeMapping = getTransactionRouteMapping(norm.destination_nopen, norm.destination_kprk);
        return {
          ...norm,
          vehicle_nopol: routeMapping.vehicle_nopol,
          route_id: routeMapping.route_id,
          mapping_level: routeMapping.mapping_level
        };
      });

      const totalPages = Math.ceil(totalRows / parsedLimit);

      res.json({
        success: true,
        data: normalizedData,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          totalRows,
          totalPages,
          hasNext: parsedPage < totalPages,
          hasPrevious: parsedPage > 1
        },
        summary: statsSummary,
        filters: {
          state: req.query.state || null,
          service: req.query.service || null,
          destination_nopen: req.query.destination_nopen || null,
          destination_kprk: req.query.destination_kprk || null,
          destination_reg: req.query.destination_reg || null,
          vehicle_nopol: req.query.vehicle_nopol || null,
          route_id: req.query.route_id || null,
          date_from: req.query.date_from || null,
          date_to: req.query.date_to || null,
          sortBy,
          sortOrder
        }
      });

    } catch (error) {
      console.error('Error in getAll transactions:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Get transaction stats
  async getStats(req, res) {
    try {
      const db = await DbConnection.getDb();
      const match = buildTransactionMatch(req.query);
      const statsSummary = await getTransactionStatsForMatch(db, match);

      const col = db.collection('transaksi');
      const pipeline = [
        { $match: match },
        {
          $facet: {
            byState: [
              {
                $group: {
                  _id: { $ifNull: ['$connote.connote_state', { $ifNull: ['$connote_state', 'UNKNOWN'] }] },
                  count: { $sum: 1 }
                }
              }
            ],
            byService: [
              {
                $group: {
                  _id: { $ifNull: ['$connote.connote_service', { $ifNull: ['$connote_service', 'UNKNOWN'] }] },
                  count: { $sum: 1 }
                }
              }
            ],
            byReg: [
              {
                $group: {
                  _id: {
                    $ifNull: [
                      '$location_data_created.custom_field.destination_reg',
                      { $ifNull: ['$custom_field.destination_reg', 'UNKNOWN'] }
                    ]
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ];

      const [aggregateResult] = await col.aggregate(pipeline).toArray();

      const byState = {};
      aggregateResult?.byState?.forEach(item => {
        if (item._id) byState[item._id] = item.count;
      });

      const byService = {};
      aggregateResult?.byService?.forEach(item => {
        if (item._id) byService[item._id] = item.count;
      });

      const byReg = {};
      aggregateResult?.byReg?.forEach(item => {
        if (item._id) byReg[item._id] = item.count;
      });

      // Always ensure DELIVERED count is exactly what's computed by the main aggregation
      byState['DELIVERED'] = statsSummary.jumlah_by_state.DELIVERED;

      res.json({
        success: true,
        data: {
          total_transaksi: statsSummary.total_transaksi,
          total_berat: statsSummary.total_berat,
          total_nilai_kiriman: statsSummary.total_nilai_kiriman,
          jumlah_by_state: byState,
          jumlah_by_service: byService,
          jumlah_by_reg: byReg,
          jumlah_mapped: statsSummary.jumlah_mapped,
          jumlah_unmapped: statsSummary.jumlah_unmapped
        }
      });

    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Get detail transaction by connote_code
  async getByConnoteCode(req, res) {
    try {
      const { connoteCode } = req.params;

      if (!connoteCode) {
        return res.status(400).json({ success: false, message: 'Connote Code harus dikirimkan' });
      }

      const { document } = await TransactionModel.findByConnoteCode(connoteCode);
      if (!document) {
        return res.status(404).json({ success: false, message: `Transaksi resi "${connoteCode}" tidak ditemukan` });
      }

      const normalized = normalizeTx(document);
      const mapping = getTransactionRouteMapping(normalized.destination_nopen, normalized.destination_kprk);

      let routeHeader = null;
      let routeStops = [];
      let activeJadwal = [];
      let manifestDoc = null;

      if (mapping.route_id !== '-') {
        // Fetch route header
        const rHeader = await dbQueryOne('master_route_nopen', { route_id: mapping.route_id });
        if (rHeader) routeHeader = rHeader;

        // Fetch stops seq
        const segments = await DetailRouteModel.find(
          { route_id: mapping.route_id },
          { sort: { seq: 1 } }
        );

        if (segments.length > 0) {
          const uniqueNopends = [...new Set(segments.flatMap(s => [s.asal_nopen, s.tujuan_nopen]))];
          const offices = await KantorModel.find({ nopend: { $in: uniqueNopends } });
          const officeMap = new Map(offices.map(o => [o.nopend, o]));

          routeStops = segments.map((seg, index) => {
            const office = officeMap.get(seg.tujuan_nopen) || { nopend: seg.tujuan_nopen, nama_nopend: seg.tujuan_nama };
            return {
              sequence: seg.seq,
              nopend: seg.tujuan_nopen,
              nama_nopend: office.nama_nopend,
              role: seg.role_tujuan || 'TRANSIT',
              estimasi_jam: seg.estimasi_jam || 1
            };
          });

          // Insert origin stop at beginning
          const originOffice = officeMap.get(segments[0].asal_nopen) || { nopend: segments[0].asal_nopen, nama_nopend: segments[0].asal_nama };
          routeStops.unshift({
            sequence: 0,
            nopend: segments[0].asal_nopen,
            nama_nopend: originOffice.nama_nopend,
            role: segments[0].role_asal || 'ORIGIN',
            estimasi_jam: 0
          });
        }

        // Fetch schedules
        activeJadwal = await JadwalModel.find(
          { route_id: mapping.route_id },
          { sort: { tanggal: -1, jam_berangkat: -1 }, limit: 5 }
        );
      }

      // Fetch Manifest if exists
      if (normalized.manifest_id && normalized.manifest_id !== '-') {
        const mDoc = await ManifestModel.findOne({ master_manifest_code: normalized.manifest_id });
        if (mDoc) manifestDoc = mDoc;
      }

      // Fetch Milk Run Journey info for Slide 2 Night Pickup (B 9910 PCX)
      let milkRunData = null;
      try {
        const activeJourney = await RouteJourneyModel.findActiveByVehicle('B 9910 PCX');
        const { stops, diagnostics } = await RouteJourneyService.getValidatedRouteStops('RT-MALAM-B9910-PCX');
        
        // Build Slide 2 PPT stops (including skipped points like AGP ONG, AGP Omega)
        const slide2PptSequence = [
          { pointName: 'AGP ONG', nopend: null, inDb: false, status: 'SKIPPED_NOT_CONFIGURED', role: 'PPT_ORIGIN', estTime: '16:00 WIB' },
          { pointName: 'AGP Omega', nopend: null, inDb: false, status: 'SKIPPED_NOT_CONFIGURED', role: 'PPT_TRANSIT', estTime: '16:30 WIB' },
          ...stops.map((s, idx) => ({
            pointName: s.officeName,
            nopend: s.nopen,
            inDb: true,
            status: s.role === 'ORIGIN' ? 'ORIGIN' : s.role === 'DESTINATION' ? 'DESTINATION' : 'TRANSIT',
            role: s.role,
            seq: s.seq,
            estTime: `${17 + Math.floor(idx * 0.5)}:${(idx % 2) * 30 === 0 ? '00' : '30'} WIB`
          }))
        ];

        milkRunData = {
          journey: activeJourney || null,
          vehicleNopol: 'B 9910 PCX',
          routeId: 'RT-MALAM-B9910-PCX',
          shift: 'MALAM',
          scheduledHours: '16.00 - 21.00 WIB',
          destinationFinal: 'SPP BANDUNG 40400',
          maxCapacityKg: 1500,
          routeStops: stops,
          slide2PptSequence,
          diagnostics
        };
      } catch (e) {
        console.error('Error attaching milkRunData to checker:', e.message);
      }

      res.json({
        success: true,
        data: {
          transaction: normalized,
          route_mapping: mapping,
          route_header: routeHeader,
          route_stops: routeStops,
          schedules: activeJadwal,
          manifest: manifestDoc,
          milk_run: milkRunData
        }
      });

    } catch (error) {
      console.error('Error in getByConnoteCode:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Update status of connote with validation
  async updateStatus(req, res) {
    try {
      const { connoteCode } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status harus dikirimkan' });
      }

      const { document } = await TransactionModel.findByConnoteCode(connoteCode);
      if (!document) {
        return res.status(404).json({ success: false, message: `Connote "${connoteCode}" tidak ditemukan` });
      }

      const currentState = document.connote?.connote_state || document.connote_state || '';
      
      try {
        validateStateTransition(currentState, status);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const db = await TransactionModel.getCollection();
      const changedAt = new Date();
      const result = await db.updateOne(
        TransactionModel.connoteFilter(connoteCode),
        {
          $set: {
            'connote.connote_state': status,
            connote_state: status,
            updatedAt: changedAt
          },
          $push: {
            tracking_history: { from: currentState || null, to: status, changedAt }
          }
        }
      );

      if (!result.matchedCount) {
        return res.status(404).json({ success: false, message: `Connote "${connoteCode}" tidak ditemukan` });
      }

      res.json({
        success: true,
        message: `Status paket "${connoteCode}" berhasil diubah menjadi "${status}".`
      });

    } catch (error) {
      console.error('Error in updateStatus:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

// Inline helper for raw DB queries
async function dbQueryOne(collectionName, filter) {
  try {
    const db = await DbConnection.getDb();
    return await db.collection(collectionName).findOne(filter);
  } catch (e) {
    return null;
  }
}

export default new TransactionController();
