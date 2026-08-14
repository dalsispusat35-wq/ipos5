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
import estimasiRouter from './estimasi.js';

import KantorModel from '../models/KantorModel.js';
import ProdukModel from '../models/ProdukModel.js';
import KendaraanModel from '../models/KendaraanModel.js';
import RouteModel from '../models/RouteModel.js';
import DetailRouteModel from '../models/DetailRouteModel.js';
import JadwalModel from '../models/JadwalModel.js';
import TransactionModel from '../models/TransactionModel.js';

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
router.get('/dashboard-stats', requireDb, async (req, res) => {
  try {
    const totalKantor = await KantorModel.count();
    const totalProduk = await ProdukModel.count();
    const totalKendaraan = await KendaraanModel.count({ status: 'AKTIF' });
    const totalRoute = await RouteModel.count({ aktif: 'Y' });
    const totalDetailRoute = await DetailRouteModel.count({ status: 'AKTIF' });
    
    const thisMonth = new Date().toISOString().slice(0, 7);
    const totalJadwalBulanIni = await JadwalModel.count({ bulan_generate: thisMonth });

    const col = await TransactionModel.getCollection();
    const aggregateStats = await col.aggregate([
      { $project: { state: { $ifNull: ['$connote_state', '$connote.connote_state'] } } },
      { $match: { state: { $ne: null } } },
      { $group: { _id: '$state', count: { $sum: 1 } } }
    ]).toArray();

    const transactionStats = {};
    aggregateStats.forEach(item => {
      if (item._id) transactionStats[item._id] = item.count;
    });

    res.json({
      success: true,
      data: { totalKantor, totalProduk, totalKendaraan, totalRoute, totalDetailRoute, totalJadwalBulanIni, transactionStats }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// ─── Real-time Notification & System Alerts Routes ───────────────────────────
router.get('/notifications/alerts', requireDb, (req, res) => NotificationController.getSystemAlerts(req, res));
router.post('/notifications/alerts/:id/read', requireDb, (req, res) => NotificationController.markAlertAsRead(req, res));

export default router;
