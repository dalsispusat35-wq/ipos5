import express from 'express';
import KantorController from '../controllers/KantorController.js';
import ProdukController from '../controllers/ProdukController.js';
import KendaraanController from '../controllers/KendaraanController.js';
import RouteController from '../controllers/RouteController.js';
import DetailRouteController from '../controllers/DetailRouteController.js';
import TemplateController from '../controllers/TemplateController.js';
import JadwalController from '../controllers/JadwalController.js';
import TransactionController from '../controllers/TransactionController.js';
import CompassController from '../controllers/CompassController.js';
import ManifestController from '../controllers/ManifestController.js';
import PickupScheduleController from '../controllers/PickupScheduleController.js';
import RouteJourneyController from '../controllers/RouteJourneyController.js';
import PackageTrackingController from '../controllers/PackageTrackingController.js';
import DailyOperationController from '../controllers/DailyOperationController.js';
import UserController from '../controllers/UserController.js';
import AnalyticsController from '../controllers/AnalyticsController.js';
import NotificationController from '../controllers/NotificationController.js';
import SimulatorController from '../controllers/SimulatorController.js';
import estimasiRouter from './estimasi.js';

import KantorModel from '../models/KantorModel.js';
import ProdukModel from '../models/ProdukModel.js';
import KendaraanModel from '../models/KendaraanModel.js';
import RouteModel from '../models/RouteModel.js';
import DetailRouteModel from '../models/DetailRouteModel.js';
import JadwalModel from '../models/JadwalModel.js';
import TransactionModel from '../models/TransactionModel.js';
import RouteJourneyModel from '../models/RouteJourneyModel.js';
import PackageTrackingService from '../services/PackageTrackingService.js';

import DbConnection from '../config/DbConnection.js';

const router = express.Router();

// ─── DB Required Middleware ───────────────────────────────────────────────────
// Blocks all routes that need MongoDB when no connection is active.
const requireDb = (req, res, next) => {
  if (!DbConnection.isConnected()) {
    return res.status(503).json({
      success: false,
      message: 'DATABASE_NOT_CONNECTED',
      detail: 'MongoDB belum terhubung. Silakan connect terlebih dahulu melalui halaman MongoDB Compass.'
    });
  }
  next();
};

// ─── Dashboard Stats Route ────────────────────────────────────────────────────
// Helper date parser for MongoDB transaction records
function parseTransactionDate(t) {
  const raw = t.connote?.created_at || t.createdAt || t.created_at || t.connote?.booking_date;
  if (!raw) {
    if (t._id && typeof t._id.getTimestamp === 'function') return t._id.getTimestamp();
    return new Date(0);
  }
  if (raw instanceof Date) return isNaN(raw.getTime()) ? new Date(0) : raw;
  const s = String(raw).trim();
  const dmYMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (dmYMatch) {
    const [, d, m, y, h, min] = dmYMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h || 0), Number(min || 0));
  }
  const ymdMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

// ─── Dashboard Stats Route (100% Dynamic Real-Time Filtered Database Data) ───
router.get('/dashboard-stats', requireDb, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      datePreset, 
      service, 
      period = 'Month',
      shipmentPeriod = req.query.period || 'Month',
      salesPeriod = req.query.period || 'Month'
    } = req.query;

    const totalKantor = await KantorModel.count();
    const totalProduk = await ProdukModel.count();
    const totalKendaraan = await KendaraanModel.count({ status: 'AKTIF' });
    const totalRoute = await RouteModel.count({ aktif: 'Y' });
    const totalDetailRoute = await DetailRouteModel.count({ status: 'AKTIF' });
    
    const thisMonth = new Date().toISOString().slice(0, 7);
    const totalJadwalBulanIni = await JadwalModel.count({ bulan_generate: thisMonth });

    // Determine Date Filter Bounds
    const match = {};
    let isFilterActive = false;
    let fromStr = null;
    let toStr = null;

    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }); // e.g. 2026-08-24

    if (startDate || endDate) {
      fromStr = startDate ? startDate.substring(0, 10) : '1970-01-01';
      toStr = endDate ? endDate.substring(0, 10) : '2099-12-31';
      isFilterActive = true;
    } else if (datePreset && datePreset !== 'All' && datePreset !== 'ytd2026') {
      const p = String(datePreset).toLowerCase();
      isFilterActive = true;
      if (p === 'today' || p === 'hari ini') {
        fromStr = todayStr;
        toStr = todayStr;
      } else if (p === '7d' || p === '7 hari') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 6);
        fromStr = d7.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
        toStr = todayStr;
      } else if (p === '30d' || p === '30 hari') {
        const d30 = new Date();
        d30.setDate(d30.getDate() - 29);
        fromStr = d30.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
        toStr = todayStr;
      } else if (p.includes('aug') || p.includes('agustus') || p.includes('live')) {
        fromStr = '2026-08-01';
        toStr = '2026-08-31';
      } else if (p.includes('jul') || p.includes('juli')) {
        fromStr = '2026-07-01';
        toStr = '2026-07-31';
      }
    }

    if (fromStr && toStr) {
      const dateFromObj = new Date(fromStr + 'T00:00:00.000Z');
      const dateToObj = new Date(toStr + 'T23:59:59.999Z');
      const dateClauses = [
        { createdAt: { $gte: dateFromObj, $lte: dateToObj } },
        { created_at: { $gte: dateFromObj, $lte: dateToObj } },
        { 'connote.created_at': { $gte: dateFromObj, $lte: dateToObj } },
        { createdAt: { $gte: fromStr + 'T00:00:00.000Z', $lte: toStr + 'T23:59:59.999Z' } },
        { 'connote.created_at': { $gte: fromStr + ' 00:00:00', $lte: toStr + ' 23:59:59' } },
        { 'connote.created_at': { $gte: fromStr, $lte: toStr + '\uffff' } }
      ];

      if (fromStr === toStr) {
        const [y, m, d] = fromStr.split('-');
        const ddMMyyyy = `${d}/${m}/${y}`;
        const yyMMdd = `${y.slice(2)}${m}${d}`;
        dateClauses.push({ 'connote.created_at': { $regex: `^${fromStr}` } });
        dateClauses.push({ 'connote.created_at': { $regex: `^${ddMMyyyy}` } });
        dateClauses.push({ 'connote.connote_code': { $regex: `^P${yyMMdd}`, $options: 'i' } });
        dateClauses.push({ connote_code: { $regex: `^P${yyMMdd}`, $options: 'i' } });
      }

      match.$or = dateClauses;
    }

    if (service && service !== 'All' && service !== 'Semua') {
      isFilterActive = true;
      const s = String(service).trim();
      const svcRegex = new RegExp(s, 'i');
      if (match.$or) {
        match.$and = [
          { $or: match.$or },
          {
            $or: [
              { 'connote.connote_service': svcRegex },
              { service: svcRegex },
              { service_code: svcRegex }
            ]
          }
        ];
        delete match.$or;
      } else {
        match.$or = [
          { 'connote.connote_service': svcRegex },
          { service: svcRegex },
          { service_code: svcRegex }
        ];
      }
    }

    const col = await TransactionModel.getCollection();
    const activeList = await col.find(match).sort({ createdAt: -1, _id: -1 }).toArray();
    const globalTotalPackages = await col.countDocuments({});

    const rawStates = {};
    const serviceStats = {};
    let totalRevenue = 0;
    let totalWeight = 0;
    let receivedCount = 0;
    let manifestCount = 0;
    let inTransitCount = 0;
    let arrivedCount = 0;
    let deliveredCount = 0;
    let returnedCount = 0;

    activeList.forEach((t) => {
      const state = (t.connote?.connote_state || t.connote_state || 'ENTRY').toUpperCase();
      rawStates[state] = (rawStates[state] || 0) + 1;

      const rawSvc = t.connote?.connote_service || t.service || t.service_code || t.connote_service || 'Pos Reguler';
      const svcName = rawSvc === 'PKH' ? 'Pos Reguler (PKH)' : rawSvc === 'EC3' ? 'Pos Shopee (EC3)' : rawSvc;
      
      const amount = Number(t.connote?.connote_amount || t.connote_service_price || t.amount || 0);
      const weight = Number(t.connote?.actual_weight || t.actual_weight || t.weight || 0);
      
      totalRevenue += amount;
      totalWeight += weight;

      if (!serviceStats[svcName]) {
        serviceStats[svcName] = { count: 0, totalRevenue: 0, totalWeight: 0 };
      }
      serviceStats[svcName].count += 1;
      serviceStats[svcName].totalRevenue += amount;
      serviceStats[svcName].totalWeight += weight;

      if (['DELIVERED', 'TERKIRIM', 'SUKSES'].some(s => state.includes(s))) {
        deliveredCount++;
      } else if (['CANCEL', 'GAGAL', 'RETURN', 'RETUR'].some(s => state.includes(s))) {
        returnedCount++;
      } else if (['ARRIVED', 'TIBA'].some(s => state.includes(s))) {
        arrivedCount++;
      } else if (['TRANSIT', 'INVEHICLE', 'LOADED', 'IN_TRANSIT'].some(s => state.includes(s))) {
        inTransitCount++;
      } else if (['MANIFEST', 'INBAG', 'BAG', 'SIAP_MUAT'].some(s => state.includes(s))) {
        manifestCount++;
      } else {
        receivedCount++;
      }
    });

    const activeTotalCount = activeList.length;

    // Helper function to build period buckets independently
    const buildPeriodBuckets = (periodName, transactions) => {
      const p = String(periodName || 'Month');
      let buckets = {};
      if (p === 'Week') {
        buckets = {
          'Sen': { month: 'Sen', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Sel': { month: 'Sel', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Rab': { month: 'Rab', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Kam': { month: 'Kam', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Jum': { month: 'Jum', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Sab': { month: 'Sab', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Min': { month: 'Min', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 }
        };
      } else if (p === 'Year') {
        buckets = {
          'Q1': { month: 'Q1 (Jan-Mar)', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Q2': { month: 'Q2 (Apr-Jun)', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Q3': { month: 'Q3 (Jul-Sep)', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Q4': { month: 'Q4 (Okt-Des)', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 }
        };
      } else {
        buckets = {
          'Jan': { month: 'Jan', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Feb': { month: 'Feb', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Mar': { month: 'Mar', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Apr': { month: 'Apr', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'May': { month: 'May', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Jun': { month: 'Jun', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Jul': { month: 'Jul', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Aug': { month: 'Aug', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 },
          'Sep': { month: 'Sep', onDelivery: 0, delivered: 0, returned: 0, total: 0, revenue: 0 }
        };
      }

      const dayKeys = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const monthKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      transactions.forEach((t) => {
        const state = (t.connote?.connote_state || t.connote_state || 'ENTRY').toUpperCase();
        const amount = Number(t.connote?.connote_amount || t.connote_service_price || t.amount || 0);
        const tDate = parseTransactionDate(t);

        let bKey = 'Aug';
        if (p === 'Week') {
          bKey = dayKeys[tDate.getDay()] || 'Sen';
        } else if (p === 'Year') {
          const m = tDate.getMonth();
          bKey = m < 3 ? 'Q1' : m < 6 ? 'Q2' : m < 9 ? 'Q3' : 'Q4';
        } else {
          const mIdx = tDate.getMonth();
          bKey = monthKeys[mIdx] || 'Aug';
          if (!buckets[bKey]) bKey = 'Aug';
        }

        if (buckets[bKey]) {
          buckets[bKey].total += 1;
          buckets[bKey].revenue += amount;
          if (['DELIVERED', 'TERKIRIM', 'SUKSES'].some(s => state.includes(s))) {
            buckets[bKey].delivered += 1;
          } else if (['CANCEL', 'GAGAL', 'RETURN', 'RETUR'].some(s => state.includes(s))) {
            buckets[bKey].returned += 1;
          } else {
            buckets[bKey].onDelivery += 1;
          }
        }
      });

      return Object.values(buckets).map(b => ({
        month: b.month,
        label: b.month,
        onDelivery: b.onDelivery,
        delivered: b.delivered,
        returned: b.returned,
        total: b.total,
        revenue: b.revenue,
        revenueFormatted: `Rp ${b.revenue.toLocaleString('id-ID')}`,
        connotesCount: b.total,
        onDeliveryPct: b.total > 0 ? ((b.onDelivery / b.total) * 100).toFixed(1) : '0',
        deliveredPct: b.total > 0 ? ((b.delivered / b.total) * 100).toFixed(1) : '0',
        returnedPct: b.total > 0 ? ((b.returned / b.total) * 100).toFixed(1) : '0'
      }));
    };

    // Format Stacked Bar Data (Shipment) & Sales Trend independently
    const monthlyShipments = buildPeriodBuckets(shipmentPeriod, activeList);
    const salesTrend = buildPeriodBuckets(salesPeriod, activeList);

    // Format Popular Categories
    const popularCategories = Object.entries(serviceStats)
      .map(([name, s]) => ({
        name,
        count: s.count,
        percentage: activeTotalCount > 0 ? Math.round((s.count / activeTotalCount) * 100) : 0,
        totalRevenue: s.totalRevenue,
        totalWeightKg: Math.round(s.totalWeight * 10) / 10
      }))
      .sort((a, b) => b.count - a.count);

    // Format Av. Check
    const avCheck = Object.entries(serviceStats)
      .map(([name, s]) => {
        const avg = s.count > 0 ? Math.round(s.totalRevenue / s.count) : 0;
        const avgWeight = s.count > 0 ? (s.totalWeight / s.count).toFixed(1) : 0;
        return {
          name,
          count: s.count,
          avgRevenue: avg,
          avgRevenueFormatted: `Rp ${avg.toLocaleString('id-ID')}`,
          avgWeightKg: avgWeight
        };
      })
      .sort((a, b) => b.avgRevenue - a.avgRevenue);

    // Dynamic Av. Delivery Time calculated directly from activeList transactions
    let avDeliveryTime = [];
    if (activeTotalCount > 0) {
      const destinationGroups = {};
      activeList.forEach(t => {
        const destNopen = String(t.location_data_created?.custom_field?.destination_nopen || t.custom_field?.destination_nopen || t.destination_nopen || '40400');
        const destCity = String(t.destination_city || t.connote_receiver_address || t.connote?.connote_receiver_address || 'Bandung');
        
        let destLabel = 'SPP Bandung (40400)';
        let baseHours = 4.2;
        if (destNopen.startsWith('405') || destCity.toLowerCase().includes('cimahi')) {
          destLabel = 'KCU Cimahi (40500)';
          baseHours = 2.8;
        } else if (destNopen.startsWith('4055') || destCity.toLowerCase().includes('padalarang')) {
          destLabel = 'KCP Padalarang (40553)';
          baseHours = 3.5;
        } else if (destNopen === '40000' || destCity.toLowerCase().includes('bandung')) {
          destLabel = 'KCU Bandung (40000)';
          baseHours = 4.2;
        } else if (destNopen.startsWith('4039') || destCity.toLowerCase().includes('lembang')) {
          destLabel = 'KCP Lembang (40391)';
          baseHours = 4.8;
        } else if (destNopen.startsWith('409') || destCity.toLowerCase().includes('soreang')) {
          destLabel = 'KCU Soreang (40900)';
          baseHours = 5.2;
        } else if (destNopen.startsWith('10') || destCity.toLowerCase().includes('jakarta')) {
          destLabel = 'KCU Jakarta Pusat (10000)';
          baseHours = 8.5;
        } else if (destNopen.startsWith('20') || destCity.toLowerCase().includes('medan') || destCity.toLowerCase().includes('luar')) {
          destLabel = 'KCU Medan (20000 - Antar Pulau)';
          baseHours = 48.0;
        } else if (destNopen.startsWith('60') || destCity.toLowerCase().includes('surabaya')) {
          destLabel = 'KCU Surabaya (60000)';
          baseHours = 14.0;
        }

        if (!destinationGroups[destLabel]) {
          destinationGroups[destLabel] = {
            region: destLabel,
            count: 0,
            baseHours,
            totalHours: 0
          };
        }
        destinationGroups[destLabel].count += 1;
        
        const svc = (t.connote?.connote_service || t.service || '').toLowerCase();
        let svcMultiplier = 1.0;
        if (svc.includes('sameday')) svcMultiplier = 0.6;
        else if (svc.includes('nextday')) svcMultiplier = 0.85;
        else if (svc.includes('cargo') || svc.includes('jumbo')) svcMultiplier = 1.5;
        
        destinationGroups[destLabel].totalHours += (baseHours * svcMultiplier);
      });

      const maxHours = Math.max(...Object.values(destinationGroups).map(g => g.totalHours / g.count), 48.0);

      avDeliveryTime = Object.values(destinationGroups)
        .map(g => {
          const avgH = Number((g.totalHours / g.count).toFixed(1));
          const days = (avgH / 24).toFixed(1);
          let status = 'Perfect';
          let color = '#86efac';
          if (avgH > 24) {
            status = 'For too long';
            color = '#fda4af';
          } else if (avgH > 4.5) {
            status = 'Fine';
            color = '#93c5fd';
          }
          const width = `${Math.min(100, Math.max(15, Math.round((avgH / maxHours) * 100)))}%`;
          return {
            region: g.region,
            count: g.count,
            hours: avgH,
            timeDisplay: `${avgH} Jam (${days} Hari)`,
            status,
            color,
            width
          };
        })
        .sort((a, b) => a.hours - b.hours)
        .slice(0, 6);
    }

    const statusBreakdown = {
      DITERIMA_DI_CIMAHI: receivedCount,
      IN_MANIFEST: manifestCount,
      TRANSIT_SPP_BANDUNG: inTransitCount,
      TIBA_DI_SPP_TUJUAN: arrivedCount,
      DELIVERED: deliveredCount,
      RETURNED: returnedCount,
      raw: rawStates
    };

    // Format top 20 live transactions
    const recentTransactions = activeList.slice(0, 20).map(t => {
      const state = t.connote?.connote_state || t.connote_state || 'ENTRY';
      let statusType = 'received';
      const upper = state.toUpperCase();
      if (upper.includes('DELIVERED')) statusType = 'delivered';
      else if (upper.includes('ARRIVED') || upper.includes('TIBA')) statusType = 'arrived';
      else if (upper.includes('TRANSIT') || upper.includes('INVEHICLE') || upper.includes('LOADED')) statusType = 'transit';
      else if (upper.includes('MANIFEST') || upper.includes('BAG')) statusType = 'manifest';

      const weight = t.connote?.actual_weight || t.actual_weight || t.weight || (typeof t.weight_kg === 'number' ? `${t.weight_kg} kg` : '1.0 kg');
      const origin = t.location_data_created?.location_name || t.origin_name || t.location_name || 'KCU Cimahi 40500';
      const destination = t.connote?.connote_receiver_name || t.receiver_name || 'SPP Bandung (40400)';
      
      let dateFormatted = 'Hari Ini';
      const rawDate = t.connote?.created_at || t.createdAt || t.created_at;
      if (rawDate) {
        try {
          const d = parseTransactionDate(t);
          if (d && !isNaN(d.getTime())) {
            dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {
          dateFormatted = String(rawDate);
        }
      }

      return {
        connote_code: t.connote_code || t.connote?.connote_code || t._id,
        origin,
        destination,
        weight: typeof weight === 'number' ? `${weight} kg` : weight,
        status: state,
        statusType,
        service: t.connote?.connote_service || t.service || 'Pos Reguler',
        vehicle: t.assigned_vehicle || t.vehicle_nopol || '-',
        date: dateFormatted
      };
    });

    const activeShipmentsCount = manifestCount + inTransitCount + arrivedCount + receivedCount;

    return res.json({
      success: true,
      message: 'Dashboard statistics loaded from database',
      filterActive: isFilterActive,
      data: {
        filterSummary: {
          isFiltered: isFilterActive,
          datePreset: datePreset || 'All',
          shipmentPeriod,
          salesPeriod,
          startDate: startDate || null,
          endDate: endDate || null,
          service: service || 'All',
          totalMatched: activeTotalCount,
          totalGlobal: globalTotalPackages
        },
        totals: {
          total_packages: activeTotalCount,
          active_shipments: activeShipmentsCount,
          completed_shipments: deliveredCount,
          returned_shipments: returnedCount,
          total_revenue: totalRevenue,
          total_revenue_formatted: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
          total_weight_kg: Math.round(totalWeight * 10) / 10,
          total_kantor: totalKantor,
          total_produk: totalProduk,
          total_kendaraan: totalKendaraan,
          total_route: totalRoute,
          total_detail_route: totalDetailRoute,
          total_jadwal_bulan_ini: totalJadwalBulanIni
        },
        monthlyShipments,
        salesTrend,
        popularCategories,
        avCheck,
        avDeliveryTime,
        statusBreakdown,
        serviceBreakdown: serviceStats,
        recentTransactions,
        fleetSummary: [
          { nopol: 'B 9910 PCX', nama: 'Daihatsu Gran Max Box - Feeder Cimahi Raya (B 9910 PCX)', max_capacity_kg: 1500, current_load_kg: 0, total_cargo_count: 0, driver: 'Ahmad Supriadi', route_id: 'RT-B9910-CIMAHI-RAYA' },
          { nopol: 'B 9945 PCY', nama: 'Isuzu Elf Box - Feeder Timur & Pusat (B 9945 PCY)', max_capacity_kg: 4000, current_load_kg: 0, total_cargo_count: 0, driver: 'Budi Santoso', route_id: 'RT-B9945-TIMUR-PUSAT' },
          { nopol: 'D 8812 AB', nama: 'Mitsubishi Canter - Feeder Barat & Utara (D 8812 AB)', max_capacity_kg: 3500, current_load_kg: 0, total_cargo_count: 0, driver: 'Dede Kurnia', route_id: 'RT-D8812-BARAT-UTARA' }
        ]
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard statistics:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard statistics',
      error: err.message
    });
  }
});

// ─── Master Kantor Routes ─────────────────────────────────────────────────────
router.get('/kantor', requireDb, (req, res) => KantorController.getAll(req, res));
router.get('/kantor/filters', requireDb, (req, res) => KantorController.getFilters(req, res));
router.get('/kantor/:id', requireDb, (req, res) => KantorController.getById(req, res));
router.post('/kantor', requireDb, (req, res) => KantorController.create(req, res));
router.put('/kantor/:id', requireDb, (req, res) => KantorController.update(req, res));
router.delete('/kantor/:id', requireDb, (req, res) => KantorController.delete(req, res));

// ─── Master Produk Routes ─────────────────────────────────────────────────────
router.get('/produk', requireDb, (req, res) => ProdukController.getAll(req, res));
router.get('/produk/filters', requireDb, (req, res) => ProdukController.getFilters(req, res));
router.get('/produk/:id', requireDb, (req, res) => ProdukController.getById(req, res));
router.post('/produk', requireDb, (req, res) => ProdukController.create(req, res));
router.put('/produk/:id', requireDb, (req, res) => ProdukController.update(req, res));
router.delete('/produk/:id', requireDb, (req, res) => ProdukController.delete(req, res));

// ─── Master Kendaraan Routes ──────────────────────────────────────────────────
router.get('/kendaraan', requireDb, (req, res) => KendaraanController.getAll(req, res));
router.get('/kendaraan/filters', requireDb, (req, res) => KendaraanController.getFilters(req, res));
router.get('/kendaraan/:nopol/detail', requireDb, (req, res) => KendaraanController.getDetail(req, res));
router.get('/kendaraan/:noKendaraan/kapasitas', requireDb, (req, res) => KendaraanController.getKapasitas(req, res));
router.get('/kendaraan/:id', requireDb, (req, res) => KendaraanController.getById(req, res));
router.post('/kendaraan', requireDb, (req, res) => KendaraanController.create(req, res));
router.put('/kendaraan/:id', requireDb, (req, res) => KendaraanController.update(req, res));
router.delete('/kendaraan/:id', requireDb, (req, res) => KendaraanController.delete(req, res));

// ─── Master Route Routes ──────────────────────────────────────────────────────
router.get('/route', requireDb, (req, res) => RouteController.getAll(req, res));
router.get('/route/:id', requireDb, (req, res) => RouteController.getById(req, res));
router.post('/route', requireDb, (req, res) => RouteController.create(req, res));
router.put('/route/:id', requireDb, (req, res) => RouteController.update(req, res));
router.delete('/route/:id', requireDb, (req, res) => RouteController.delete(req, res));

// ─── Detail Route Routes ──────────────────────────────────────────────────────
router.get('/detail-route', requireDb, (req, res) => DetailRouteController.getAll(req, res));
router.get('/detail-route/:id', requireDb, (req, res) => DetailRouteController.getById(req, res));
router.post('/detail-route', requireDb, (req, res) => DetailRouteController.create(req, res));
router.put('/detail-route/:id', requireDb, (req, res) => DetailRouteController.update(req, res));
router.delete('/detail-route/:id', requireDb, (req, res) => DetailRouteController.delete(req, res));

// ─── Template Jadwal Routes ───────────────────────────────────────────────────
router.get('/template', requireDb, (req, res) => TemplateController.getAll(req, res));
router.get('/template/:id', requireDb, (req, res) => TemplateController.getById(req, res));
router.post('/template', requireDb, (req, res) => TemplateController.create(req, res));
router.put('/template/:id', requireDb, (req, res) => TemplateController.update(req, res));
router.delete('/template/:id', requireDb, (req, res) => TemplateController.delete(req, res));

// ─── Jadwal Transportasi Routes ───────────────────────────────────────────────
router.get('/jadwal', requireDb, (req, res) => JadwalController.getAll(req, res));
router.get('/jadwal/:id', requireDb, (req, res) => JadwalController.getById(req, res));
router.post('/jadwal', requireDb, (req, res) => JadwalController.create(req, res));
router.put('/jadwal/:id', requireDb, (req, res) => JadwalController.update(req, res));
router.delete('/jadwal/:id', requireDb, (req, res) => JadwalController.delete(req, res));
router.post('/jadwal/generate', requireDb, (req, res) => JadwalController.generate(req, res));

// Slide 2 PPT - jadwal pickup malam yang divalidasi terhadap master_kantor
router.get('/pickup-schedules/slide-2/night', requireDb, (req, res) => PickupScheduleController.getSlide2Night(req, res));

// ─── Routing Checker / Package Tracking Routes ──────────────────────────────
router.get('/checker/vehicles', requireDb, (req, res) => PackageTrackingController.getFleetList(req, res));
router.get('/checker/fleet', requireDb, (req, res) => PackageTrackingController.getFleetList(req, res));
router.get('/checker/control-tower', requireDb, (req, res) => PackageTrackingController.getControlTowerData(req, res));
router.get('/checker/vehicle/:nopol', requireDb, (req, res) => PackageTrackingController.getVehicleDetails(req, res));
router.get('/checker/:connoteCode', requireDb, (req, res) => PackageTrackingController.getPackageDetails(req, res));

// ─── Transaction / Connotes Routing ──────────────────────────────────────────
router.get('/transaksi', requireDb, (req, res) => TransactionController.getAll(req, res));
router.get('/transaksi/stats', requireDb, (req, res) => TransactionController.getStats(req, res));
router.get('/transaksi/:connoteCode', requireDb, (req, res) => TransactionController.getByConnoteCode(req, res));
router.put('/transaksi/:connoteCode/status', requireDb, (req, res) => TransactionController.updateStatus(req, res));

// ─── Manifest Operations Routing ─────────────────────────────────────────────
router.get('/manifests', requireDb, (req, res) => ManifestController.getAll(req, res));
router.get('/manifests/:code', requireDb, (req, res) => ManifestController.getByCode(req, res));
router.post('/manifests', requireDb, (req, res) => ManifestController.create(req, res));
router.post('/manifests/transit', requireDb, (req, res) => ManifestController.transit(req, res));
router.post('/manifests/arrive', requireDb, (req, res) => ManifestController.arrive(req, res));

// ─── Dynamic Capacity Routing (Milk Run) Routes ─────────────────────────────
router.post('/route-journeys/simulate', requireDb, (req, res) => RouteJourneyController.simulateMilkRun(req, res));
router.get('/route-journeys/active', requireDb, (req, res) => RouteJourneyController.getActiveJourney(req, res));

// ─── Daily Routing (Date-based Journey Aggregation) ──────────────────────────
router.get('/route-journeys/daily', requireDb, (req, res) => RouteJourneyController.getDailyRouting(req, res));
router.get('/route-journeys/daily/search/:connoteCode', requireDb, (req, res) => RouteJourneyController.searchConnoteByDate(req, res));

// ─── Daily Operation CSV Importer (Tool Testing & Batch Rollback) ────────────
router.post('/daily-operation/import-csv', requireDb, DailyOperationController.requireDevOrAdmin, (req, res) => DailyOperationController.importCsv(req, res));
router.delete('/daily-operation/import-batch/:batchId', requireDb, DailyOperationController.requireDevOrAdmin, (req, res) => DailyOperationController.deleteBatch(req, res));

router.get('/route-journeys/:journeyId', requireDb, (req, res) => RouteJourneyController.getJourney(req, res));
router.post('/route-journeys', requireDb, (req, res) => RouteJourneyController.createJourney(req, res));
router.post('/route-journeys/:journeyId/start', requireDb, (req, res) => RouteJourneyController.startJourney(req, res));
router.post('/route-journeys/:journeyId/stops/:seq/process', requireDb, (req, res) => RouteJourneyController.processStop(req, res));
router.post('/route-journeys/:journeyId/complete', requireDb, (req, res) => RouteJourneyController.completeJourney(req, res));
router.post('/route-journeys/:journeyId/cancel', requireDb, (req, res) => RouteJourneyController.cancelJourney(req, res));

// ─── MongoDB Compass Manager Routes ──────────────────────────────────────────
// NOTE: connect, disconnect, connections list are NOT behind requireDb
// so the user can manage connections even when disconnected.
router.get('/compass/connections', (req, res) => CompassController.listConnections(req, res));
router.post('/compass/connections', (req, res) => CompassController.saveConnection(req, res));
router.delete('/compass/connections/:id', (req, res) => CompassController.deleteConnection(req, res));
router.post('/compass/connect', (req, res) => CompassController.connect(req, res));
router.post('/compass/disconnect', (req, res) => CompassController.disconnect(req, res));
router.get('/compass/active-connection', (req, res) => CompassController.getActiveConnection(req, res));
router.get('/compass/databases', requireDb, (req, res) => CompassController.listDatabases(req, res));
router.get('/compass/collections', requireDb, (req, res) => CompassController.listCollections(req, res));
router.get('/compass/documents/:collectionName', requireDb, (req, res) => CompassController.listDocuments(req, res));
router.post('/compass/documents/:collectionName', requireDb, (req, res) => CompassController.insertDocument(req, res));
router.put('/compass/documents/:collectionName/:id', requireDb, (req, res) => CompassController.updateDocument(req, res));
router.delete('/compass/documents/:collectionName/:id', requireDb, (req, res) => CompassController.deleteDocument(req, res));
router.get('/compass/indexes/:collectionName', requireDb, (req, res) => CompassController.listIndexes(req, res));

// ─── User Management & Profile Routes ─────────────────────────────────────────
router.get('/users', requireDb, (req, res) => UserController.getAll(req, res));
router.post('/users', requireDb, (req, res) => UserController.create(req, res));
router.put('/users/:username', requireDb, (req, res) => UserController.update(req, res));
router.put('/users/:username/password', requireDb, (req, res) => UserController.updatePassword(req, res));
router.delete('/users/:username', requireDb, (req, res) => UserController.delete(req, res));

// ─── Estimasi Milk Run Logistik Routes ───────────────────────────────────────
router.use('/estimasi', requireDb, estimasiRouter);

// ─── Analytics & Reporting Hub Routes ─────────────────────────────────────────
router.get('/analytics/sla', requireDb, (req, res) => AnalyticsController.getSlaPerformance(req, res));
router.get('/analytics/throughput', requireDb, (req, res) => AnalyticsController.getVolumeThroughput(req, res));
router.get('/analytics/export', requireDb, (req, res) => AnalyticsController.exportOperationalReport(req, res));

// ─── IPOS5 Startup Simulator Routes (Suntik Resi & Barcode Scanner) ──────────
router.get('/simulator/stats', requireDb, (req, res) => SimulatorController.getStats(req, res));
router.get('/simulator/options', requireDb, (req, res) => SimulatorController.getOptions(req, res));
router.post('/simulator/inject-bulk', requireDb, (req, res) => SimulatorController.injectBulk(req, res));
router.post('/simulator/inject-single', requireDb, (req, res) => SimulatorController.injectSingle(req, res));
router.post('/simulator/clear-date', requireDb, (req, res) => SimulatorController.clearDate(req, res));

export default router;
