import DbConnection from '../config/DbConnection.js';

export class NotificationController {
  /**
   * Get active operational notifications & system alerts
   * GET /api/notifications/alerts
   */
  async getSystemAlerts(req, res) {
    try {
      const db = await DbConnection.getDb();
      const transaksiCol = db.collection('transaksi');
      const routeJourneysCol = db.collection('route_journeys');
      const manifestsCol = db.collection('manifests');

      const alerts = [];
      const now = new Date();

      // 1. Check for Fleet Load Overcapacity / Overspill Warnings
      const activeJourneys = await routeJourneysCol.find({ status: { $ne: 'COMPLETED' } }).toArray();
      activeJourneys.forEach((journey) => {
        const payload = journey.payload_summary || {};
        const totalWeightKg = payload.total_weight_kg || payload.active_payload_kg || 0;
        const overspillWeightKg = payload.overspill_weight_kg || 0;
        const nopol = journey.vehicle_nopol || 'B 9910 PCX';

        if (totalWeightKg >= 1500 || overspillWeightKg > 0) {
          alerts.push({
            id: `alert-load-${journey._id}`,
            type: 'CRITICAL',
            category: 'LOAD_OVERCAPACITY',
            title: `Peringatan Kapasitas Armada ${nopol}`,
            message: `Muatan aktif mencapai ${(totalWeightKg / 1000).toFixed(2)} Ton (100% SAFE Limit: 1.500 kg). Antrean melimpah Overspill Queue: ${(overspillWeightKg / 1000).toFixed(2)} Ton.`,
            timestamp: journey.updatedAt || journey.createdAt || now,
            link: '/route-journey'
          });
        }
      });

      // 2. Check for SLA Transit Delays (> 12 Hours in IN_MANIFEST or TRANSIT_SPP_BANDUNG)
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const delayedTransactions = await transaksiCol.find({
        connote_state: { $in: ['IN_MANIFEST', 'TRANSIT_SPP_BANDUNG'] },
        updatedAt: { $lt: twelveHoursAgo }
      }).limit(50).toArray();

      if (delayedTransactions.length > 0) {
        alerts.push({
          id: `alert-sla-transit-delay`,
          type: 'WARNING',
          category: 'SLA_TRANSIT_DELAY',
          title: `Deteksi Keterlambatan Transit SLA`,
          message: `${delayedTransactions.length} paket berada di status Transit SPP Bandung / Manifest selama lebih dari 12 jam tanpa pembaruan.`,
          timestamp: now,
          link: '/transaksi?status=TRANSIT_SPP_BANDUNG'
        });
      }

      // 3. System Info Alert: Active Manifests Batch
      const totalManifests = await manifestsCol.countDocuments();
      alerts.push({
        id: `alert-system-manifests`,
        type: 'INFO',
        category: 'SYSTEM_STATUS',
        title: `Status Gate Monitoring Operasional`,
        message: `Sistem mencatat ${totalManifests} manifest kontainer aktif dan terpantau di Checkpoint Gate Monitoring KCU Cimahi & SPP Bandung.`,
        timestamp: now,
        link: '/gate-monitoring'
      });

      res.json({
        success: true,
        data: {
          unreadCount: alerts.filter(a => a.type === 'CRITICAL' || a.type === 'WARNING').length,
          alerts
        }
      });
    } catch (error) {
      console.error('Error in getSystemAlerts:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Dismiss alert or mark as read
   * POST /api/notifications/alerts/:id/read
   */
  async markAlertAsRead(req, res) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: `Notification ${id} marked as read.`
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new NotificationController();
