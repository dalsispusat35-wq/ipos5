import PackageTrackingService from '../services/PackageTrackingService.js';

class PackageTrackingController {
  /**
   * GET /api/checker/control-tower?date=YYYY-MM-DD
   */
  async getControlTowerData(req, res) {
    try {
      const dateStr = req.query.date ? String(req.query.date).trim() : PackageTrackingService.getWibDateStr();
      const data = await PackageTrackingService.getDailyControlTowerSummary(dateStr);
      return res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error in getControlTowerData:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONTROL_TOWER_ERROR',
          message: error.message || 'Gagal memuat data Control Tower Operasional.'
        }
      });
    }
  }

  /**
   * GET /api/checker/vehicle/:nopol?date=YYYY-MM-DD
   */
  async getVehicleDetails(req, res) {
    try {
      const { nopol } = req.params;
      const dateStr = req.query.date ? String(req.query.date).trim() : PackageTrackingService.getWibDateStr();

      if (!nopol) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_NOPOL', message: 'Plat nomor kendaraan harus diisi.' }
        });
      }

      const result = await PackageTrackingService.getVehicleTrackingDetails(nopol, dateStr);

      if (!result.found) {
        return res.status(404).json({
          success: false,
          error: {
            code: result.code || 'VEHICLE_NOT_FOUND',
            message: result.message || `Kendaraan "${nopol}" tidak ditemukan.`
          }
        });
      }

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getVehicleDetails:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VEHICLE_TRACKING_ERROR',
          message: error.message || 'Gagal memuat data pelacakan armada kendaraan.'
        }
      });
    }
  }

  /**
   * GET /api/checker/:connoteCode?date=YYYY-MM-DD
   */
  async getPackageDetails(req, res) {
    try {
      const { connoteCode } = req.params;
      const dateStr = req.query.date ? String(req.query.date).trim() : PackageTrackingService.getWibDateStr();

      if (!connoteCode) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CONNOTE', message: 'Nomor resi / connote harus diisi.' }
        });
      }

      const cleanQuery = String(connoteCode).trim();

      // Check if query is vehicle nopol search (e.g. starts with B, D, F, etc. or format 'B 9910 PCX')
      const isVehiclePattern = /^[a-zA-Z]{1,2}\s?\d{1,4}\s?[a-zA-Z]{1,3}$/.test(cleanQuery);
      if (isVehiclePattern) {
        const vResult = await PackageTrackingService.getVehicleTrackingDetails(cleanQuery, dateStr);
        if (vResult.found) {
          return res.json({
            success: true,
            isVehicleQuery: true,
            data: vResult
          });
        }
      }

      // Package Connote Search
      const pkgResult = await PackageTrackingService.getPackageDetails(cleanQuery, dateStr);

      if (!pkgResult.found) {
        return res.status(404).json({
          success: false,
          error: {
            code: pkgResult.code || 'PACKAGE_NOT_FOUND',
            message: pkgResult.message || `Nomor resi "${cleanQuery}" tidak ditemukan.`
          }
        });
      }

      return res.json({
        success: true,
        isVehicleQuery: false,
        data: pkgResult
      });
    } catch (error) {
      console.error('Error in getPackageDetails:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PACKAGE_TRACKING_ERROR',
          message: error.message || 'Gagal memuat data pelacakan resi paket.'
        }
      });
    }
  }
}

export default new PackageTrackingController();
