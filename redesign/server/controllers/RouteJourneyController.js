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
}

export default new RouteJourneyController();
