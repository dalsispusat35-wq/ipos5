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
}

export default new KendaraanController();
