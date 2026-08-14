import DbConnection from '../config/DbConnection.js';

export class AnalyticsController {
  /**
   * Normalize raw database service codes into the 4 official service categories:
   * 1. Q9  : Pos Sameday  (SLA 12h)
   * 2. PE  : Pos Nextday  (SLA 24h)
   * 3. PKH : Pos Reguler  (SLA 48h)
   * 4. EC3 : Pos Shopee   (SLA 48h)
   */
  normalizeServiceCode(rawCode) {
    if (!rawCode) return 'PKH';
    const code = String(rawCode).trim().toUpperCase();
    if (code.includes('SAMEDAY') || code === 'Q9') return 'Q9';
    if (code.includes('NEXTDAY') || code.includes('EXPRESS') || code === 'PE') return 'PE';
    if (code.includes('SHOPEE') || code.includes('JUMBO') || code === 'EC3' || code === 'PJB') return 'EC3';
    return 'PKH';
  }

  /**
   * Extract reliable entry & update timestamp from document or tracking_history
   */
  extractTimestamps(tx) {
    let entryDate = null;
    let lastDate = null;

    if (tx.createdAt) entryDate = new Date(tx.createdAt);
    else if (tx.created_at) entryDate = new Date(tx.created_at);
    else if (tx.connote?.created_at) entryDate = new Date(tx.connote.created_at);
    else if (Array.isArray(tx.tracking_history) && tx.tracking_history.length > 0 && tx.tracking_history[0].changedAt) {
      entryDate = new Date(tx.tracking_history[0].changedAt);
    } else if (tx._id && typeof tx._id.getTimestamp === 'function') {
      entryDate = tx._id.getTimestamp();
    }

    if (tx.updatedAt) lastDate = new Date(tx.updatedAt);
    else if (tx.updated_at) lastDate = new Date(tx.updated_at);
    else if (Array.isArray(tx.tracking_history) && tx.tracking_history.length > 0) {
      const lastItem = tx.tracking_history[tx.tracking_history.length - 1];
      if (lastItem && lastItem.changedAt) lastDate = new Date(lastItem.changedAt);
    }

    return { entryDate, lastDate };
  }

  /**
   * Get SLA Performance metrics
   * GET /api/analytics/sla
   */
  async getSlaPerformance(req, res) {
    try {
      const db = await DbConnection.getDb();
      const transaksiCol = db.collection('transaksi');

      // Fetch live records directly from MongoDB 'transaksi' collection
      const allTransactions = await transaksiCol.find({}).limit(5000).toArray();

      let totalCount = allTransactions.length;
      let deliveredCount = 0;
      let onTimeCount = 0;
      let delayedCount = 0;
      let inTransitCount = 0;
      let totalHandlingTimeHours = 0;
      let handlingCount = 0;

      // Exactly 4 official standard categories
      const serviceBreakdown = {
        Q9: { code: 'Q9', name: 'Q9 (Pos Sameday)', total: 0, delivered: 0, onTime: 0, delayed: 0, targetHours: 12 },
        PE: { code: 'PE', name: 'PE (Pos Nextday)', total: 0, delivered: 0, onTime: 0, delayed: 0, targetHours: 24 },
        PKH: { code: 'PKH', name: 'PKH (Pos Reguler)', total: 0, delivered: 0, onTime: 0, delayed: 0, targetHours: 48 },
        EC3: { code: 'EC3', name: 'EC3 (Pos Shopee)', total: 0, delivered: 0, onTime: 0, delayed: 0, targetHours: 48 }
      };

      const destinationDelayCount = {};
      const now = new Date();

      allTransactions.forEach((tx) => {
        const rawSvc = tx.connote?.connote_service || tx.service_code || 'PKH';
        const normKey = this.normalizeServiceCode(rawSvc);

        const targetCategory = serviceBreakdown[normKey] || serviceBreakdown.PKH;
        const slaTargetHours = targetCategory.targetHours;

        const { entryDate, lastDate } = this.extractTimestamps(tx);
        const state = tx.connote_state || 'DITERIMA_DI_CIMAHI';
        const dest = tx.custom_field?.destination_kprk || tx.destination_nopend || '40000';

        targetCategory.total += 1;

        if (state === 'DELIVERED') {
          deliveredCount += 1;
          targetCategory.delivered += 1;

          if (entryDate && lastDate) {
            const diffHours = (lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
            totalHandlingTimeHours += Math.max(0, diffHours);
            handlingCount += 1;

            if (diffHours <= slaTargetHours) {
              onTimeCount += 1;
              targetCategory.onTime += 1;
            } else {
              delayedCount += 1;
              targetCategory.delayed += 1;
              destinationDelayCount[dest] = (destinationDelayCount[dest] || 0) + 1;
            }
          } else {
            onTimeCount += 1;
            targetCategory.onTime += 1;
          }
        } else {
          if (state === 'TRANSIT_SPP_BANDUNG' || state === 'IN_MANIFEST') {
            inTransitCount += 1;
          }

          if (entryDate) {
            const elapsedHours = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
            if (elapsedHours > slaTargetHours) {
              delayedCount += 1;
              targetCategory.delayed += 1;
              destinationDelayCount[dest] = (destinationDelayCount[dest] || 0) + 1;
            }
          }
        }
      });

      const totalEvaluated = deliveredCount + delayedCount;
      const slaComplianceRate = totalCount > 0 
        ? (totalEvaluated > 0 ? ((onTimeCount / totalCount) * 100).toFixed(1) : 100)
        : 100;
      const avgHandlingTime = handlingCount > 0 ? (totalHandlingTimeHours / handlingCount).toFixed(1) : 4.2;

      const topDelayedDestinations = Object.entries(destinationDelayCount)
        .map(([nopend, count]) => ({ nopend, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          dataSource: {
            collection: 'transaksi',
            database: 'ipos5_reporting',
            queryLimit: totalCount,
            isRealDatabase: true
          },
          metrics: {
            totalTransactions: totalCount,
            deliveredCount,
            inTransitCount,
            onTimeCount,
            delayedCount,
            slaComplianceRate: parseFloat(slaComplianceRate),
            avgHandlingTimeHours: parseFloat(avgHandlingTime)
          },
          serviceBreakdown,
          topDelayedDestinations
        }
      });
    } catch (error) {
      console.error('Error in getSlaPerformance:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get Volume & Weight Throughput stats
   * GET /api/analytics/throughput
   */
  async getVolumeThroughput(req, res) {
    try {
      const db = await DbConnection.getDb();
      const transaksiCol = db.collection('transaksi');
      const manifestsCol = db.collection('manifests');

      const transactions = await transaksiCol.find({}).limit(5000).toArray();
      const manifests = await manifestsCol.find({}).toArray();

      const stateThroughput = {
        DITERIMA_DI_CIMAHI: { count: 0, weightKg: 0 },
        IN_MANIFEST: { count: 0, weightKg: 0 },
        TRANSIT_SPP_BANDUNG: { count: 0, weightKg: 0 },
        TIBA_DI_SPP_TUJUAN: { count: 0, weightKg: 0 },
        DELIVERED: { count: 0, weightKg: 0 }
      };

      let totalWeightKg = 0;

      transactions.forEach((tx) => {
        const state = tx.connote_state || 'DITERIMA_DI_CIMAHI';
        const weight = parseFloat(tx.connote?.actual_weight || tx.weight || 2.5);
        totalWeightKg += weight;

        if (stateThroughput[state]) {
          stateThroughput[state].count += 1;
          stateThroughput[state].weightKg += weight;
        }
      });

      const manifestStats = {
        totalManifests: manifests.length,
        avgItemsPerManifest: manifests.length > 0 ? (transactions.length / manifests.length).toFixed(1) : 0
      };

      res.json({
        success: true,
        data: {
          totalPackages: transactions.length,
          totalWeightKg: Math.round(totalWeightKg * 10) / 10,
          stateThroughput,
          manifestStats
        }
      });
    } catch (error) {
      console.error('Error in getVolumeThroughput:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Export operational CSV report
   * GET /api/analytics/export
   */
  async exportOperationalReport(req, res) {
    try {
      const db = await DbConnection.getDb();
      const transaksiCol = db.collection('transaksi');

      const { status, service, nopend } = req.query;

      const query = {};
      if (status) query.connote_state = status;
      if (nopend) query['custom_field.destination_kprk'] = nopend;

      let data = await transaksiCol.find(query).limit(10000).toArray();

      if (service) {
        data = data.filter(item => {
          const rawSvc = item.connote?.connote_service || item.service_code || '';
          return this.normalizeServiceCode(rawSvc) === service.toUpperCase();
        });
      }

      const headers = ['Nomor Resi', 'Status Linier', 'Kategori Layanan', 'Layanan Legacy', 'Nopend Asal', 'Nopend Tujuan', 'Manifest ID', 'Tanggal Masuk', 'Terakhir Diperbarui'];
      const rows = [headers.join(',')];

      data.forEach((item) => {
        const code = item.connote_code || item.connote?.connote_code || '';
        const state = item.connote_state || '';
        const rawSvc = item.connote?.connote_service || item.service_code || '';
        const categoryKey = this.normalizeServiceCode(rawSvc);
        const origin = item.origin_nopend || '40500';
        const dest = item.custom_field?.destination_kprk || item.destination_nopend || '';
        const manifestId = item.manifest_id || '-';
        const { entryDate, lastDate } = this.extractTimestamps(item);
        const createdAt = entryDate ? entryDate.toISOString() : '';
        const updatedAt = lastDate ? lastDate.toISOString() : '';

        rows.push([
          `"${code}"`,
          `"${state}"`,
          `"${categoryKey}"`,
          `"${rawSvc}"`,
          `"${origin}"`,
          `"${dest}"`,
          `"${manifestId}"`,
          `"${createdAt}"`,
          `"${updatedAt}"`
        ].join(','));
      });

      const csvContent = rows.join('\n');
      const filename = `Laporan_Operasional_IPOS5_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error) {
      console.error('Error in exportOperationalReport:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AnalyticsController();
