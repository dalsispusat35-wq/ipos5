import BaseController from './BaseController.js';
import RouteJourneyModel from '../models/RouteJourneyModel.js';
import RouteJourneyService from '../services/RouteJourneyService.js';

class RouteJourneyController extends BaseController {
  constructor() {
    super(RouteJourneyModel, 'journey_id');
  }

  // Handle standard error mapping
  handleError(res, error) {
    console.error('RouteJourneyController Error:', error);
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'INTERNAL_SERVER_ERROR';

    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: error.message || 'Terjadi kesalahan pada server.',
      activeJourney: error.activeJourney || null
    });
  }

  // Validation helper for vehicle and route parameters
  validateJourneyParams(body = {}, query = {}) {
    const routeId = body.route_id || body.routeId || query.route_id || query.routeId || 'RT-MALAM-B9910-PCX';
    const vehicleNopol = body.vehicle_nopol || body.vehicleNopol || query.vehicle_nopol || query.vehicleNopol || 'B 9910 PCX';

    if (routeId !== 'RT-MALAM-B9910-PCX') {
      const err = new Error(`Route ID "${routeId}" tidak diizinkan. Hanya route "RT-MALAM-B9910-PCX" yang diproses.`);
      err.code = 'ROUTE_NOT_FOUND';
      err.statusCode = 400;
      throw err;
    }

    const cleanReqNopol = String(vehicleNopol).replace(/\s+/g, ' ').trim().toUpperCase();
    if (cleanReqNopol !== 'B 9910 PCX' && cleanReqNopol !== 'B9910PCX') {
      const err = new Error(`Kendaraan "${vehicleNopol}" tidak diizinkan. Fitur ini khusus kendaraan "B 9910 PCX".`);
      err.code = 'VEHICLE_NOT_FOUND';
      err.statusCode = 400;
      throw err;
    }

    return { routeId, vehicleNopol: 'B 9910 PCX' };
  }

  // DRY RUN SIMULATION
  async simulateMilkRun(req, res) {
    try {
      const { routeId, vehicleNopol } = this.validateJourneyParams(req.body, req.query);
      const simulationResult = await RouteJourneyService.simulateMilkRun(routeId, vehicleNopol);

      res.json({
        success: true,
        data: simulationResult
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // CREATE JOURNEY
  async createJourney(req, res) {
    try {
      const { routeId, vehicleNopol } = this.validateJourneyParams(req.body, req.query);
      const journeyDate = req.body.journey_date || req.body.journeyDate || new Date();

      const journeyDoc = await RouteJourneyService.createJourney(routeId, vehicleNopol, journeyDate);

      res.status(201).json({
        success: true,
        message: `Journey "${journeyDoc.journey_id}" berhasil dibuat dengan status READY.`,
        data: journeyDoc
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // START JOURNEY (READY -> IN_PROGRESS)
  async startJourney(req, res) {
    try {
      const { journeyId } = req.params;
      if (!journeyId) {
        return res.status(400).json({ success: false, message: 'Parameter journeyId diperlukan.' });
      }

      const journeyDoc = await RouteJourneyService.startJourney(journeyId);

      res.json({
        success: true,
        message: `Journey "${journeyId}" berhasil dimulai.`,
        data: journeyDoc
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // PROCESS A SINGLE STOP (ACID Transaction)
  async processStop(req, res) {
    try {
      const { journeyId, seq } = req.params;
      if (!journeyId || seq === undefined) {
        return res.status(400).json({ success: false, message: 'Parameter journeyId dan seq diperlukan.' });
      }

      const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey || null;

      const result = await RouteJourneyService.processStop(journeyId, seq, idempotencyKey);

      res.json({
        success: true,
        message: `Stop seq ${seq} pada journey "${journeyId}" berhasil diproses.`,
        data: result.journey,
        stopResult: result.stopResult,
        idempotent: result.idempotent || false
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // COMPLETE JOURNEY
  async completeJourney(req, res) {
    try {
      const { journeyId } = req.params;
      if (!journeyId) {
        return res.status(400).json({ success: false, message: 'Parameter journeyId diperlukan.' });
      }

      const journeyDoc = await RouteJourneyService.completeJourney(journeyId);

      res.json({
        success: true,
        message: `Journey "${journeyId}" berhasil diselesaikan di SPP Bandung 40400.`,
        data: journeyDoc
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // CANCEL JOURNEY
  async cancelJourney(req, res) {
    try {
      const { journeyId } = req.params;
      const reason = req.body?.reason || 'Dibatalkan oleh pengguna';

      const journeyDoc = await RouteJourneyService.cancelJourney(journeyId, reason);

      res.json({
        success: true,
        message: `Journey "${journeyId}" berhasil dibatalkan.`,
        data: journeyDoc
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // GET SPECIFIC JOURNEY DETAILS
  async getJourney(req, res) {
    try {
      const { journeyId } = req.params;
      const journey = await RouteJourneyModel.findByJourneyId(journeyId);
      if (!journey) {
        return res.status(404).json({ success: false, message: `Journey "${journeyId}" tidak ditemukan.` });
      }

      const { stops, diagnostics } = await RouteJourneyService.getValidatedRouteStops(journey.route_id);

      res.json({
        success: true,
        data: journey,
        routeStops: stops,
        diagnostics
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // GET ACTIVE JOURNEY FOR VEHICLE
  async getActiveJourney(req, res) {
    try {
      const { vehicleNopol } = this.validateJourneyParams({}, req.query);
      const activeJourney = await RouteJourneyModel.findActiveByVehicle(vehicleNopol);

      if (!activeJourney) {
        return res.json({
          success: true,
          data: null,
          message: `Tidak ada journey aktif untuk kendaraan ${vehicleNopol}.`
        });
      }

      const { stops, diagnostics } = await RouteJourneyService.getValidatedRouteStops(activeJourney.route_id);

      res.json({
        success: true,
        data: activeJourney,
        routeStops: stops,
        diagnostics
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ─── DAILY ROUTING (Date-based Journey Aggregation) ───────────────────────

  // GET /route-journeys/daily?date=2026-07-24
  async getDailyRouting(req, res) {
    try {
      const dateStr = req.query.date || new Date().toISOString().slice(0, 10);

      // Validate date format
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Format tanggal tidak valid: "${dateStr}". Gunakan format YYYY-MM-DD.`
        });
      }

      const journeys = await RouteJourneyModel.findJourneysByDate(dateStr);

      // Build summary and flatten connotes from all journeys
      const routeSet = new Set();
      const vehicleSet = new Set();
      let totalConnotes = 0;
      const connoteList = [];

      for (const j of journeys) {
        routeSet.add(j.route_id);
        vehicleSet.add(j.resolved_vehicle_nopol || j.vehicle_nopol);

        // Collect connotes from cargo (live/current)
        const cargoItems = j.cargo || [];
        for (const item of cargoItems) {
          if (item.connote_code) {
            connoteList.push({
              connote_code: item.connote_code,
              weight_kg: item.weight_kg || 0,
              origin_nopen: item.origin_nopen || '-',
              destination_nopen: item.destination_nopen || '-',
              vehicle_nopol: j.resolved_vehicle_nopol || j.vehicle_nopol,
              route_id: j.route_id,
              journey_id: j.journey_id,
              status: 'INVEHICLE'
            });
          }
        }

        // Collect connotes from processed stops (historical)
        const processedStops = j.processed_stops || [];
        for (const stop of processedStops) {
          const accepted = stop.acceptedItems || [];
          for (const item of accepted) {
            // Avoid duplicates if connote is still in cargo
            if (item.connote_code && !connoteList.some(c => c.connote_code === item.connote_code)) {
              connoteList.push({
                connote_code: item.connote_code,
                weight_kg: item.weight_kg || 0,
                origin_nopen: item.origin_nopen || item.loaded_at_nopen || '-',
                destination_nopen: item.destination_nopen || '-',
                vehicle_nopol: j.resolved_vehicle_nopol || j.vehicle_nopol,
                route_id: j.route_id,
                journey_id: j.journey_id,
                status: 'LOADED'
              });
            }
          }
        }

        totalConnotes = connoteList.length;
      }

      // Enrich journeys with full vehicle route stops
      const enrichedJourneys = await Promise.all(journeys.map(async (j) => {
        let routeStops = [];
        try {
          const segments = await RouteJourneyModel.getRouteStops(j.route_id);
          if (segments && segments.length > 0) {
            const stopCodes = [segments[0].asal_nopen, ...segments.map(s => s.tujuan_nopen)].filter(Boolean);
            const offices = await RouteJourneyModel.getOfficesByCodes(stopCodes);
            const officeMap = new Map(offices.map(o => [String(o.nopend), o.nama_nopend]));

            routeStops = stopCodes.map((code, idx) => ({
              seq: idx + 1,
              nopen: code,
              officeName: officeMap.get(code) || (idx === 0 ? segments[0].asal_nama : segments[idx - 1].tujuan_nama || `KANTOR ${code}`),
              role: idx === 0 ? 'ORIGIN' : idx === stopCodes.length - 1 ? 'DESTINATION' : 'TRANSIT'
            }));
          }
        } catch (e) {
          console.error(`Error resolving route stops for ${j.route_id}:`, e.message);
        }

        return {
          journey_id: j.journey_id,
          route_id: j.route_id,
          vehicle_nopol: j.resolved_vehicle_nopol || j.vehicle_nopol,
          shift: j.shift || '-',
          status: j.status,
          journey_date: j.journey_date,
          maximum_capacity_kg: j.maximum_capacity_kg || 0,
          current_load_kg: j.current_load_kg || 0,
          cargo_count: (j.cargo || []).length,
          processed_stops_count: (j.processed_stops || []).length,
          current_nopen: j.current_nopen || null,
          route_stops: routeStops
        };
      }));

      res.json({
        success: true,
        data: {
          date: dateStr,
          summary: {
            totalRoutes: routeSet.size,
            totalVehicles: vehicleSet.size,
            totalConnotes,
            totalJourneys: journeys.length
          },
          journeys: enrichedJourneys,
          connotes: connoteList
        }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // GET /route-journeys/daily/search/:connoteCode?date=2026-07-24
  async searchConnoteByDate(req, res) {
    try {
      const { connoteCode } = req.params;
      const dateStr = req.query.date || new Date().toISOString().slice(0, 10);

      if (!connoteCode) {
        return res.status(400).json({
          success: false,
          message: 'Parameter connoteCode diperlukan.'
        });
      }

      const cleanCode = String(connoteCode).trim();
      const journey = await RouteJourneyModel.findConnoteInJourneys(cleanCode, dateStr);

      if (!journey) {
        return res.json({
          success: true,
          data: null,
          message: `Resi "${cleanCode}" tidak ditemukan dalam routing tanggal ${dateStr}.`
        });
      }

      // Find the specific connote info within the journey
      let connoteInfo = null;

      // Check cargo
      const cargoMatch = (journey.cargo || []).find(c => c.connote_code === cleanCode);
      if (cargoMatch) {
        connoteInfo = {
          connote_code: cleanCode,
          vehicle_nopol: journey.resolved_vehicle_nopol || journey.vehicle_nopol,
          route_id: journey.route_id,
          journey_id: journey.journey_id,
          destination_nopen: cargoMatch.destination_nopen || '-',
          origin_nopen: cargoMatch.origin_nopen || '-',
          weight_kg: cargoMatch.weight_kg || 0,
          status: 'INVEHICLE',
          journey_date: journey.journey_date,
          shift: journey.shift || '-',
          journey_status: journey.status
        };
      }

      // Check processed stops if not found in cargo
      if (!connoteInfo) {
        for (const stop of (journey.processed_stops || [])) {
          const match = (stop.acceptedItems || []).find(a => a.connote_code === cleanCode);
          if (match) {
            connoteInfo = {
              connote_code: cleanCode,
              vehicle_nopol: journey.resolved_vehicle_nopol || journey.vehicle_nopol,
              route_id: journey.route_id,
              journey_id: journey.journey_id,
              destination_nopen: match.destination_nopen || '-',
              origin_nopen: match.origin_nopen || match.loaded_at_nopen || '-',
              weight_kg: match.weight_kg || 0,
              status: 'LOADED',
              loaded_at_stop: stop.officeName || stop.nopen,
              journey_date: journey.journey_date,
              shift: journey.shift || '-',
              journey_status: journey.status
            };
            break;
          }
        }
      }

      res.json({
        success: true,
        data: connoteInfo
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}

export default new RouteJourneyController();
