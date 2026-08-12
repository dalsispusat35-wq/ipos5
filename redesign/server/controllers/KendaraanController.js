import BaseController from './BaseController.js';
import KendaraanModel from '../models/KendaraanModel.js';
import DetailRouteModel from '../models/DetailRouteModel.js';
import KantorModel from '../models/KantorModel.js';
import DbConnection from '../config/DbConnection.js';
import { PickupOfficeResolver } from '../services/PickupOfficeResolver.js';
import { normalizeTx, getTransactionRouteMapping } from './TransactionController.js';

const SLIDE_2_NIGHT_ROUTES = [
  { 
    vehicle: 'B 9910 PCX', 
    category: 'MALAM', 
    groups: [
      { 
        id: 'PICK_UP_AGP', 
        name: 'PICK UP AGP', 
        startTime: '16.00', 
        endTime: '21.00', 
        route_id: 'RT-MALAM-B9910-PCX',
        candidates: ['AGP ONG', 'AGP Arvinet', 'AGP Cicalengka', 'AGP Ciparay', 'AGP Majalaya', 'KCP Majalaya', 'AGP Omega', 'AGP Cileunyi', 'AGP Cinunuk Permata Biru'] 
      }
    ] 
  },
  { 
    vehicle: 'B 9945 PCY', 
    category: 'MALAM', 
    groups: [
      { 
        id: 'PICK_UP_1', 
        name: 'PICK UP 1', 
        startTime: '18.00', 
        endTime: '21.30', 
        route_id: 'RT-MALAM-B9945-PCY-PU1',
        candidates: ['KCU BD 40000', 'UNPAR', 'AGP Siliwangi', 'AGP Dago', 'KCP Cihapit', 'AGP Gatsu'] 
      },
      { 
        id: 'PICK_UP_2', 
        name: 'PICK UP 2', 
        startTime: '22.00', 
        endTime: '24.00', 
        route_id: 'RT-MALAM-B9945-PCY-PU2',
        candidates: ['KC Ujung Berung 40100', 'AGP Artajati', 'AGP Ciskul'] 
      }
    ] 
  }
];

const OFFICE_ALIAS_CODES = {
  'AGP Arvinet': '40395C1', 'AGP Cicalengka': '40395U1', 'AGP Ciparay': '40381U2',
  'AGP Majalaya': '40382U1', 'KCP Majalaya': '40382B2', 'AGP Cileunyi': '40393U3',
  'AGP Cinunuk Permata Biru': '40393S8', 'KCU BD 40000': '40000', UNPAR: '40141C3',
  'AGP Dago': '40135U1', 'KCP Cihapit': '40114A', 'AGP Gatsu': '40263C2',
  'KC Ujung Berung 40100': '40100'
};

class KendaraanController extends BaseController {
  constructor() {
    super(KendaraanModel, 'kendaraan_id');
  }

  getSearchFilter(search) {
    const regex = { $regex: search, $options: 'i' };
    return {
      $or: [
        { kendaraan_id: regex },
        { nopol: regex },
        { nama_kendaraan: regex },
        { jenis_kendaraan: regex },
        { moda: regex }
      ]
    };
  }

  async getFilters(req, res) {
    try {
      const modas = await this.model.distinct('moda', { moda: { $ne: '' } });
      const types = await this.model.distinct('jenis_kendaraan', { jenis_kendaraan: { $ne: '' } });
      res.json({
        success: true,
        data: {
          modas: modas.sort(),
          types: types.sort()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get detail vehicle by nopol including stops, transaction statistics, and shipment list
  async getDetail(req, res) {
    try {
      const { nopol } = req.params;
      const {
        page = 1,
        limit = 25,
        transaction_state,
        service
      } = req.query;

      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 25));
      const skip = (parsedPage - 1) * parsedLimit;

      const db = await DbConnection.getDb();
      
      // Standardize search nopol
      const cleanNopol = nopol.replace(/\s+/g, '').toUpperCase();
      let queryNopol = nopol;
      if (cleanNopol === 'B9910PCX') {
        queryNopol = 'B 9935 PCX';
      }

      let vehicle = await db.collection('master_kendaraan').findOne({
        $or: [
          { nopol: queryNopol },
          { nopol: new RegExp(queryNopol.replace(/\s+/g, ''), 'i') }
        ]
      });

      if (!vehicle) {
        return res.status(404).json({ success: false, message: `Kendaraan dengan Nopol "${nopol}" tidak ditemukan` });
      }

      // If queried for B 9910 PCX, override database B 9935 PCX properties to preserve Slide 2 mapping
      if (cleanNopol === 'B9910PCX') {
        vehicle.nopol = 'B 9910 PCX';
        if (vehicle.nama_kendaraan) {
          vehicle.nama_kendaraan = vehicle.nama_kendaraan.replace('B 9935 PCX', 'B 9910 PCX');
        }
      }

      const vehicleNopol = vehicle.nopol; // standard Nopol from DB/override
      const upperNopol = vehicleNopol.replace(/\s+/g, '').toUpperCase();

      let routeIds = [];
      if (upperNopol === 'B9910PCX') {
        routeIds = ['RT-MALAM-B9910-PCX'];
      } else if (upperNopol === 'B9945PCY') {
        routeIds = ['RT-MALAM-B9945-PCY-PU1', 'RT-MALAM-B9945-PCY-PU2'];
      }

      const routesData = [];
      const allNopends = [];

      // Fetch headers
      const headers = await db.collection('master_route_nopen').find({ route_id: { $in: routeIds } }).toArray();
      const headerMap = new Map(headers.map(h => [h.route_id, h]));

      // Fetch segments
      const segments = await db.collection('detail_route').find({ route_id: { $in: routeIds } }).sort({ seq: 1 }).toArray();

      // Collect all stop codes
      segments.forEach(seg => {
        allNopends.push(seg.asal_nopen, seg.tujuan_nopen);
      });
      const uniqueNopends = [...new Set(allNopends)];

      // Fetch office names from master_kantor
      const offices = await db.collection('master_kantor').find({ nopend: { $in: uniqueNopends } }).toArray();
      const officeMap = new Map(offices.map(o => [o.nopend, o]));

      // Determine target stop codes for transaction mapping
      let targetStops = [];
      if (upperNopol === 'B9910PCX') {
        targetStops = ['40395C1', '40395U1', '40381U2', '40382U1', '40382B2', '40393U3', '40393S8'];
      } else if (upperNopol === 'B9945PCY') {
        targetStops = ['40000', '40141C3', '40135U1', '40114A', '40263C2', '40100'];
      }

      const txQuery = {
        $or: [
          { 'location_data_created.custom_field.destination_nopen': { $in: targetStops } },
          { 'custom_field.destination_nopen': { $in: targetStops } },
          { 'location_data_created.custom_field.destination_kprk': { $in: targetStops } },
          { 'custom_field.destination_kprk': { $in: targetStops } }
        ]
      };

      const allMappedTxDocs = await db.collection('transaksi').find(txQuery).toArray();
      const normalizedTxs = allMappedTxDocs.map(doc => normalizeTx(doc));

      let totalWeight = 0;
      let totalAmount = 0;
      const byState = {};
      const byService = {};
      let mostCommonKprk = '-';
      const kprkCounts = {};

      const stopStatsMap = {};
      targetStops.forEach(code => {
        stopStatsMap[code] = { count: 0, weight: 0 };
      });

      const matchedTxs = [];

      normalizedTxs.forEach(tx => {
        const mapping = getTransactionRouteMapping(tx.destination_nopen, tx.destination_kprk);
        if (mapping.vehicle_nopol !== vehicleNopol) return;

        const weightVal = parseFloat(tx.actual_weight) || 0;
        const amountVal = parseFloat(tx.connote_amount) || 0;
        
        totalWeight += weightVal;
        totalAmount += amountVal;

        byState[tx.connote_state] = (byState[tx.connote_state] || 0) + 1;
        byService[tx.connote_service] = (byService[tx.connote_service] || 0) + 1;

        if (tx.destination_kprk && tx.destination_kprk !== '-') {
          kprkCounts[tx.destination_kprk] = (kprkCounts[tx.destination_kprk] || 0) + 1;
        }

        let matchedStopCode = null;
        if (targetStops.includes(tx.destination_nopen)) {
          matchedStopCode = tx.destination_nopen;
        } else if (targetStops.includes(tx.destination_kprk)) {
          matchedStopCode = tx.destination_kprk;
        }

        if (matchedStopCode && stopStatsMap[matchedStopCode]) {
          stopStatsMap[matchedStopCode].count++;
          stopStatsMap[matchedStopCode].weight += weightVal;
        }

        let keep = true;
        if (transaction_state && tx.connote_state !== transaction_state) keep = false;
        if (service && tx.connote_service !== service) keep = false;

        if (keep) {
          matchedTxs.push({
            ...tx,
            vehicle_nopol: mapping.vehicle_nopol,
            route_id: mapping.route_id,
            mapping_level: mapping.mapping_level,
            route_stop_name: officeMap.get(matchedStopCode)?.nama_nopend || matchedStopCode || '-'
          });
        }
      });

      let maxKprkCount = 0;
      for (const [kprk, count] of Object.entries(kprkCounts)) {
        if (count > maxKprkCount) {
          maxKprkCount = count;
          mostCommonKprk = kprk;
        }
      }

      for (const rId of routeIds) {
        const header = headerMap.get(rId) || { route_id: rId };
        const routeSegs = segments.filter(s => s.route_id === rId);

        const stops = [];
        const skippedStops = [];

        let sourceGroup = null;
        for (const vCfg of SLIDE_2_NIGHT_ROUTES) {
          if (vCfg.vehicle === vehicleNopol) {
            sourceGroup = vCfg.groups.find(g => g.route_id === rId);
          }
        }

        if (sourceGroup) {
          const resolver = new PickupOfficeResolver(OFFICE_ALIAS_CODES);
          await resolver.loadOffices();
          for (const cand of sourceGroup.candidates) {
            const res = resolver.resolveOfficeFromMaster(cand);
            if (!res.found) {
              skippedStops.push({
                candidate: cand,
                reason: 'Tidak ditemukan di database master_kantor'
              });
            }
          }
        }

        if (routeSegs.length > 0) {
          const firstSeg = routeSegs[0];
          const originOffice = officeMap.get(firstSeg.asal_nopen);
          stops.push({
            sequence: 0,
            nopend: firstSeg.asal_nopen,
            nama_nopend: originOffice?.nama_nopend || firstSeg.asal_nama || '-',
            role: firstSeg.role_asal || 'ORIGIN',
            estimasi_time: sourceGroup?.startTime || '-',
            txCount: stopStatsMap[firstSeg.asal_nopen]?.count || 0,
            txWeight: stopStatsMap[firstSeg.asal_nopen]?.weight || 0,
            status_cocok: true,
            status_aktif: firstSeg.status === 'AKTIF'
          });

          routeSegs.forEach(seg => {
            const destOffice = officeMap.get(seg.tujuan_nopen);
            if (seg.tujuan_nopen === seg.asal_nopen && routeSegs.length === 1) return;
            
            stops.push({
              sequence: seg.seq,
              nopend: seg.tujuan_nopen,
              nama_nopend: destOffice?.nama_nopend || seg.tujuan_nama || '-',
              role: seg.role_tujuan || 'TRANSIT',
              estimasi_time: 'Est. +1h',
              txCount: stopStatsMap[seg.tujuan_nopen]?.count || 0,
              txWeight: stopStatsMap[seg.tujuan_nopen]?.weight || 0,
              status_cocok: true,
              status_aktif: seg.status === 'AKTIF'
            });
          });
        }

        routesData.push({
          route_id: rId,
          pickup_group: rId.includes('PU1') ? 'PICK_UP_1' : rId.includes('PU2') ? 'PICK_UP_2' : 'PICK_UP_AGP',
          start_time: sourceGroup?.startTime || '-',
          end_time: sourceGroup?.endTime || '-',
          stops,
          skipped: skippedStops
        });
      }

      const totalFilteredRows = matchedTxs.length;
      const totalFilteredPages = Math.ceil(totalFilteredRows / parsedLimit);
      const paginatedTxs = matchedTxs.slice(skip, skip + parsedLimit);

      res.json({
        success: true,
        data: {
          vehicle: {
            nopol: vehicleNopol,
            nama_kendaraan: vehicle.nama_kendaraan || '-',
            jenis_kendaraan: vehicle.jenis_kendaraan || '-',
            status: vehicle.status || 'AKTIF',
            driver: vehicle.driver || '-',
            driver_phone: vehicle.driver_phone || '-'
          },
          summary: {
            totalCount: normalizedTxs.filter(tx => {
              const mapping = getTransactionRouteMapping(tx.destination_nopen, tx.destination_kprk);
              return mapping.vehicle_nopol === vehicleNopol;
            }).length,
            totalWeight,
            totalAmount,
            byState,
            byService,
            stopsCount: routesData.reduce((acc, r) => acc + r.stops.length, 0),
            mostCommonKprk,
            updatedAt: new Date().toISOString()
          },
          routes: routesData,
          transactionPagination: {
            page: parsedPage,
            limit: parsedLimit,
            totalRows: totalFilteredRows,
            totalPages: totalFilteredPages,
            hasNext: parsedPage < totalFilteredPages,
            hasPrevious: parsedPage > 1
          },
          transactions: paginatedTxs,
          syncWarnings: []
        }
      });

    } catch (error) {
      console.error('Error in getDetail kendaraan:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Calculate vehicle load capacity (Vehicle Load Capacity Gauge Feature)
  async getKapasitas(req, res) {
    try {
      const { noKendaraan } = req.params;
      const { rute_id, tanggal } = req.query;

      const db = await DbConnection.getDb();
      const cleanNopol = noKendaraan.replace(/\s+/g, '').toUpperCase();

      let vehicle = await db.collection('master_kendaraan').findOne({
        $or: [
          { nopol: noKendaraan },
          { nopol: new RegExp(cleanNopol, 'i') },
          { kendaraan_id: noKendaraan }
        ]
      });

      let maxCapacityKg = parseFloat(vehicle?.max_capacity_kg || vehicle?.kapasitas_maksimum_kg) || 5000;
      if (!vehicle?.max_capacity_kg && !vehicle?.kapasitas_maksimum_kg && vehicle?.jenis_kendaraan) {
        const jenis = (vehicle.jenis_kendaraan || '').toUpperCase();
        if (jenis.includes('HEAVY') || jenis.includes('10')) maxCapacityKg = 10000;
        else if (jenis.includes('FUSO') || jenis.includes('TRUK')) maxCapacityKg = 8000;
        else if (jenis.includes('CDD') || jenis.includes('DOUBLE') || jenis.includes('4')) maxCapacityKg = 5000;
        else if (jenis.includes('CDE') || jenis.includes('ENGKEL') || jenis.includes('3')) maxCapacityKg = 3500;
        else if (jenis.includes('VAN') || jenis.includes('PICKUP') || jenis.includes('BLIND')) maxCapacityKg = 1500;
      }

      let assignedRouteId = rute_id || vehicle?.assigned_route_id || vehicle?.rute_default_id || 'RTE-6';
      
      let targetNopends = ["40000", "40500", "40253A", "40100", "40395C1", "40395U1", "40381U2", "40382U1", "40382B2", "40393U3", "40393S8"];
      let destinationPrefixes = ["1", "2", "3", "7", "9"];
      let ruteName = "Rute 6 — SPP Bandung ke SPP Jakarta / Hub Regional";
      let ruteAsal = "SPP Bandung (40000)";
      let ruteTujuan = "SPP Jakarta Timur (10000)";

      if (assignedRouteId) {
        const routeDoc = await db.collection('master_route_nopen').findOne({
          $or: [
            { route_id: assignedRouteId },
            { route_code: assignedRouteId },
            { kd_route: assignedRouteId }
          ]
        });
        if (routeDoc) {
          ruteName = routeDoc.nama_rute || routeDoc.route_name || routeDoc.route_id || assignedRouteId;
          ruteAsal = routeDoc.asal_nama || routeDoc.origin || ruteAsal;
          ruteTujuan = routeDoc.tujuan_nama || routeDoc.destination || ruteTujuan;
          if (routeDoc.origin_nopen_list && Array.isArray(routeDoc.origin_nopen_list) && routeDoc.origin_nopen_list.length > 0) {
            targetNopends = routeDoc.origin_nopen_list;
          } else if (routeDoc.daftar_nopend_asal && Array.isArray(routeDoc.daftar_nopend_asal) && routeDoc.daftar_nopend_asal.length > 0) {
            targetNopends = routeDoc.daftar_nopend_asal;
          }
          if (routeDoc.destination_prefix_filter && Array.isArray(routeDoc.destination_prefix_filter) && routeDoc.destination_prefix_filter.length > 0) {
            destinationPrefixes = routeDoc.destination_prefix_filter;
          }
        }
      }

      const targetDateStr = tanggal || new Date().toISOString().slice(0, 10);
      const destinationRegex = new RegExp(`^(${destinationPrefixes.join('|')})`);

      const matchConditions = [
        {
          $or: [
            { 'location_data_created.custom_field.nopen': { $in: targetNopends } },
            { 'location_data_created.custom_field.destination_nopen': { $in: targetNopends } },
            { 'custom_field.destination_nopen': { $regex: destinationRegex } },
            { 'custom_field.final_swp': { $in: [6, '6'] } }
          ]
        },
        {
          'connote_state': { $nin: ['CANCEL', 'CANCELLED', 'RETURNED'] }
        }
      ];

      // Fetch real-time active journey cargo from MongoDB route_journeys
      const vehicleNopolClean = (vehicle?.nopol || noKendaraan).replace(/\s+/g, '').toUpperCase();
      const activeJourney = await db.collection('route_journeys').findOne({
        $or: [
          { vehicle_nopol: vehicle?.nopol },
          { vehicle_nopol: noKendaraan },
          { resolved_vehicle_nopol: vehicle?.nopol }
        ]
      });

      let totalWeightKg = 0;
      let totalPaket = 0;
      let unweightedCount = 0;

      if (activeJourney?.cargo && Array.isArray(activeJourney.cargo) && activeJourney.cargo.length > 0) {
        totalPaket = activeJourney.cargo.length;
        activeJourney.cargo.forEach(item => {
          const w = parseFloat(item.weight_kg || 0);
          if (w <= 0) unweightedCount++;
          else totalWeightKg += w;
        });
      } else {
        allTxDocs.forEach(doc => {
          const weight = parseFloat(doc.connote?.actual_weight || doc.actual_weight || 0);
          if (weight <= 0) unweightedCount++;
          else totalWeightKg += weight;
          totalPaket++;
        });
      }

      // Load Partitioning: Cap Trip 1 at maxCapacityKg, route excess to overflow queue
      const activeTripLoadKg = Math.min(totalWeightKg, maxCapacityKg);
      const overflowQueueKg = Math.max(0, totalWeightKg - maxCapacityKg);

      const persentaseTerpakai = maxCapacityKg > 0 ? parseFloat(((activeTripLoadKg / maxCapacityKg) * 100).toFixed(1)) : 0;
      let statusKapasitas = 'NORMAL';
      if (activeTripLoadKg >= maxCapacityKg) {
        statusKapasitas = 'TERISI PENUH (FULL)';
      } else if (persentaseTerpakai >= 80) {
        statusKapasitas = 'WARNING';
      }

      res.json({
        success: true,
        data: {
          no_kendaraan: vehicle?.nopol || noKendaraan,
          nama_kendaraan: vehicle?.nama_kendaraan || 'Armada Logistik',
          jenis_kendaraan: vehicle?.jenis_kendaraan || 'Truk Box',
          assigned_route_id: assignedRouteId,
          rute: {
            rute_id: assignedRouteId,
            nama_rute: ruteName,
            asal: ruteAsal,
            tujuan: ruteTujuan,
            origin_nopen_list: targetNopends,
            destination_prefix_filter: destinationPrefixes
          },
          kapasitas_maksimum_kg: maxCapacityKg,
          total_berat_terpakai_kg: parseFloat(activeTripLoadKg.toFixed(2)),
          used_capacity_kg: parseFloat(activeTripLoadKg.toFixed(2)),
          total_berat_akumulasi_kg: parseFloat(totalWeightKg.toFixed(2)),
          overflow_queue_kg: parseFloat(overflowQueueKg.toFixed(2)),
          has_overflow: overflowQueueKg > 0,
          total_paket: totalPaket,
          unweighted_count: unweightedCount,
          persentase_terpakai: persentaseTerpakai,
          percentage_used: persentaseTerpakai,
          status_kapasitas: statusKapasitas,
          tanggal: targetDateStr
        }
      });
    } catch (error) {
      console.error('Error in getKapasitas kendaraan:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new KendaraanController();
