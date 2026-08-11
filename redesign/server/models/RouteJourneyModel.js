import BaseModel from './BaseModel.js';
import DbConnection from '../config/DbConnection.js';

class RouteJourneyModel extends BaseModel {
  constructor() {
    super('route_journeys');
  }

  async findByJourneyId(journeyId) {
    return await this.findOne({ journey_id: journeyId });
  }

  async findActiveByVehicle(vehicleNopol, journeyDateStr = null) {
    const col = await this.getCollection();
    const filter = {
      $or: [
        { vehicle_nopol: vehicleNopol },
        { resolved_vehicle_nopol: vehicleNopol }
      ],
      status: { $in: ['DRAFT', 'READY', 'IN_PROGRESS'] }
    };

    if (journeyDateStr) {
      const startDate = new Date(journeyDateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(journeyDateStr);
      endDate.setHours(23, 59, 59, 999);

      filter.journey_date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    return await col.findOne(filter);
  }

  async generateJourneyId(date = new Date(), vehicleNopol = 'B9910PCX') {
    const col = await this.getCollection();
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');
    const dateCode = `${YYYY}${MM}${DD}`;
    const cleanNopol = vehicleNopol.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const prefix = `JRN-${dateCode}-${cleanNopol}-`;

    const cursor = await col.find({
      journey_id: new RegExp(`^${prefix}`)
    }, {
      projection: { journey_id: 1 },
      sort: { journey_id: -1 },
      limit: 1
    }).toArray();

    let lastNum = 0;
    if (cursor.length > 0 && cursor[0].journey_id) {
      const match = cursor[0].journey_id.match(/(\d+)$/);
      if (match) {
        lastNum = parseInt(match[1], 10);
      }
    }

    const nextNum = String(lastNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
  }

  async getRouteStops(routeId = 'RT-MALAM-B9910-PCX') {
    const db = await DbConnection.getDb();
    return await db.collection('detail_route')
      .find({ route_id: routeId, status: 'AKTIF' })
      .sort({ seq: 1 })
      .toArray();
  }

  async getVehicle(nopolQuery = 'B 9910 PCX') {
    const db = await DbConnection.getDb();
    const cleanQuery = String(nopolQuery || '').replace(/\s+/g, '').toUpperCase();
    
    // Find all vehicles and compare normalized nopol
    const vehicles = await db.collection('master_kendaraan').find({}).toArray();
    for (const v of vehicles) {
      const vNopolClean = String(v.nopol || '').replace(/\s+/g, '').toUpperCase();
      if (vNopolClean === cleanQuery) {
        return v;
      }
    }
    return null;
  }

  async getOfficesByCodes(codes = []) {
    if (!codes.length) return [];
    const db = await DbConnection.getDb();
    const cleanCodes = codes.map(c => String(c ?? '').trim());
    return await db.collection('master_kantor')
      .find({ nopend: { $in: cleanCodes } })
      .toArray();
  }

  async getEligibleTransactions(originNopen) {
    const db = await DbConnection.getDb();
    const cleanNopen = String(originNopen ?? '').trim();
    
    return await db.collection('transaksi').find({
      $or: [
        { 'location_data_created.custom_field.nopen': cleanNopen },
        { 'location_data_created.custom_field.nopend': cleanNopen },
        { 'custom_field.origin_nopen': cleanNopen },
        { 'origin_nopen': cleanNopen }
      ]
    }).toArray();
  }

  // ─── Daily Routing Methods ─────────────────────────────────────────────────

  /**
   * Find all journeys for a specific date (journey_date field).
   * Uses the same date-range boundary pattern as findActiveByVehicle.
   */
  async findJourneysByDate(dateStr) {
    const col = await this.getCollection();

    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);

    return await col.find({
      journey_date: { $gte: startDate, $lte: endDate }
    }).sort({ route_id: 1, journey_id: 1 }).toArray();
  }

  /**
   * Search for a specific connote code within journeys on a given date.
   * Checks both the live `cargo` array and the `processed_stops[].acceptedItems` array.
   * Returns the matching journey document or null.
   */
  async findConnoteInJourneys(connoteCode, dateStr) {
    const col = await this.getCollection();
    const cleanCode = String(connoteCode || '').trim();
    if (!cleanCode) return null;

    const filter = {
      $or: [
        { 'cargo.connote_code': cleanCode },
        { 'processed_stops.acceptedItems.connote_code': cleanCode }
      ]
    };

    if (dateStr) {
      const startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateStr);
      endDate.setHours(23, 59, 59, 999);
      filter.journey_date = { $gte: startDate, $lte: endDate };
    }

    return await col.findOne(filter);
  }
}

export default new RouteJourneyModel();
