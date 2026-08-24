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
      
      // Standardize search nopol with regex flexibility
      const cleanNopol = (nopol || '').replace(/\s+/g, '').toUpperCase();
      const nopolRegex = new RegExp(`^${cleanNopol.replace(/([A-Z]+)(\d+)([A-Z]+)/, '$1\\s*$2\\s*$3')}$`, 'i');

      let vehicle = await db.collection('master_kendaraan').findOne({
        $or: [
          { nopol: nopol },
          { nopol: nopolRegex },
          { nopol: new RegExp(cleanNopol, 'i') },
          { kendaraan_id: nopol },
          { kendaraan_id: `VH-${cleanNopol}` }
        ]
      });

      if (!vehicle) {
        return res.status(404).json({ success: false, message: `Kendaraan dengan Nopol "${nopol}" tidak ditemukan` });
      }

      const vehicleNopol = vehicle.nopol || nopol;
      const upperNopol = vehicleNopol.replace(/\s+/g, '').toUpperCase();

      // Determine matching route ID
      let routeIds = [];
      if (vehicle.route_default) {
        routeIds = [vehicle.route_default];
      } else if (upperNopol.includes('9910')) {
        routeIds = ['RT-B9910-CIMAHI-RAYA'];
      } else if (upperNopol.includes('8812')) {
        routeIds = ['RT-D8812-BARAT-UTARA'];
      } else if (upperNopol.includes('9945')) {
        routeIds = ['RT-B9945-TIMUR-PUSAT'];
      } else {
        routeIds = ['RT-B9910-CIMAHI-RAYA'];
      }

      const routesData = [];
      const allNopends = [];

      // Fetch headers from master_route_nopen
      const headers = await db.collection('master_route_nopen').find({ route_id: { $in: routeIds } }).toArray();
      const headerMap = new Map(headers.map(h => [h.route_id, h]));

      // Fetch segments from detail_route
      const segments = await db.collection('detail_route').find({ route_id: { $in: routeIds } }).sort({ seq: 1 }).toArray();

      // Collect all stop codes
      segments.forEach(seg => {
        if (seg.asal_nopen) allNopends.push(seg.asal_nopen);
        if (seg.tujuan_nopen) allNopends.push(seg.tujuan_nopen);
      });
      const uniqueNopends = [...new Set(allNopends)];

      // Fetch office names from master_kantor
      const offices = await db.collection('master_kantor').find({ nopend: { $in: uniqueNopends } }).toArray();
      const officeMap = new Map(offices.map(o => [o.nopend, o]));

      // Fetch transactions assigned to this vehicle
      const txQuery = {
        $or: [
          { assigned_vehicle: vehicleNopol },
          { vehicle_nopol: vehicleNopol },
          { 'connote.assigned_vehicle': vehicleNopol },
          { 'connote.vehicle_nopol': vehicleNopol },
          { location_data_created_nopen: { $in: uniqueNopends } }
        ]
      };

      const allMappedTxDocs = await db.collection('transaksi').find(txQuery).toArray();
      const normalizedTxs = allMappedTxDocs.map(doc => normalizeTx(doc));

      let totalWeight = 0;
      let totalAmount = 0;
      const byState = {};
      const byService = {};
      let mostCommonKprk = '40000';
      const kprkCounts = {};

      const stopStatsMap = {};
      uniqueNopends.forEach(code => {
        stopStatsMap[code] = { count: 0, weight: 0 };
      });

      const matchedTxs = [];

      normalizedTxs.forEach(tx => {
        const weightVal = parseFloat(tx.actual_weight) || 0;
        const amountVal = parseFloat(tx.connote_amount) || 0;
        
        totalWeight += weightVal;
        totalAmount += amountVal;

        byState[tx.connote_state] = (byState[tx.connote_state] || 0) + 1;
        byService[tx.connote_service] = (byService[tx.connote_service] || 0) + 1;

        if (tx.destination_nopen && stopStatsMap[tx.destination_nopen]) {
          stopStatsMap[tx.destination_nopen].count++;
          stopStatsMap[tx.destination_nopen].weight += weightVal;
        }

        let keep = true;
        if (transaction_state && tx.connote_state !== transaction_state) keep = false;
        if (service && tx.connote_service !== service) keep = false;

        if (keep) {
          matchedTxs.push({
            ...tx,
            vehicle_nopol: vehicleNopol,
            route_id: routeIds[0] || '-',
            mapping_level: 'VEHICLE_DIRECT',
            route_stop_name: officeMap.get(tx.destination_nopen)?.nama_nopend || tx.destination_nopen || 'SPP Bandung (40400)'
          });
        }
      });

      for (const rId of routeIds) {
        const header = headerMap.get(rId) || { route_id: rId };
        const routeSegs = segments.filter(s => s.route_id === rId);
        const stops = [];

        if (routeSegs.length > 0) {
          const firstSeg = routeSegs[0];
          const originOffice = officeMap.get(firstSeg.asal_nopen);
          stops.push({
            sequence: 0,
            nopend: firstSeg.asal_nopen,
            nama_nopend: originOffice?.nama_kantor || originOffice?.nama_nopend || firstSeg.asal_nama || '-',
            role: 'ORIGIN',
            estimasi_time: '08:00 WIB',
            txCount: stopStatsMap[firstSeg.asal_nopen]?.count || 0,
            txWeight: stopStatsMap[firstSeg.asal_nopen]?.weight || 0,
            status_cocok: true,
            status_aktif: true
          });

          routeSegs.forEach(seg => {
            const destOffice = officeMap.get(seg.tujuan_nopen);
            stops.push({
              sequence: seg.seq,
              nopend: seg.tujuan_nopen,
              nama_nopend: destOffice?.nama_kantor || destOffice?.nama_nopend || seg.tujuan_nama || '-',
              role: seg.seq === routeSegs.length ? 'DESTINATION' : 'TRANSIT',
              estimasi_time: `Est. +${seg.seq * 45}m`,
              txCount: stopStatsMap[seg.tujuan_nopen]?.count || 0,
              txWeight: stopStatsMap[seg.tujuan_nopen]?.weight || 0,
              status_cocok: true,
              status_aktif: true
            });
          });
        }

        routesData.push({
          route_id: rId,
          pickup_group: header.nama_route || rId,
          start_time: '08:00 WIB',
          end_time: '12:30 WIB',
          stops,
          skipped: []
        });
      }

      const totalFilteredRows = matchedTxs.length;
      const totalFilteredPages = Math.ceil(totalFilteredRows / parsedLimit) || 1;
      const paginatedTxs = matchedTxs.slice(skip, skip + parsedLimit);

      res.json({
        success: true,
        data: {
          vehicle: {
            nopol: vehicleNopol,
            nama_kendaraan: vehicle.nama_kendaraan || '-',
            jenis_kendaraan: vehicle.jenis_kendaraan || '-',
            status: vehicle.status || 'AKTIF',
            driver: vehicle.driver || vehicle.driver_utama?.nama || 'Sopir Ekspedisi',
            driver_phone: vehicle.driver_phone || vehicle.driver_utama?.telepon || '0812-3456-7890',
            max_capacity_kg: vehicle.max_capacity_kg || 1500
          },
          summary: {
            totalCount: matchedTxs.length,
            totalWeight: Number(totalWeight.toFixed(1)),
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
      res.status(500).json({ success: false, message: 'Server error: ' + error.message });
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
