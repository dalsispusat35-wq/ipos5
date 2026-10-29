import BaseController from './BaseController.js';
import KantorModel from '../models/KantorModel.js';
import DbConnection from '../config/DbConnection.js';
import KantorWilayah from '../services/KantorWilayahService.js';

class KantorController extends BaseController {
  constructor() {
    super(KantorModel, 'nopend');
  }

  getSearchFilter(search) {
    const cleanSearch = (search || '').trim();
    const regex = { $regex: cleanSearch, $options: 'i' };
    return {
      $or: [
        { nopend: regex },
        { nama_nopend: regex },
        { nama_kantor: regex },
        { alamat: regex },
        { kelurahan: regex },
        { kecamatan: regex },
        { kabupaten_kota: regex },
        { kota: regex },
        { nama_kcu_kc: regex },
        { nopen_kc_kcu: regex },
        { nama_regional: regex }
      ]
    };
  }

  async getAll(req, res) {
    try {
      const { search, page = 1, limit = 12, sortField, sortOrder, status, category, region, wilayahKode, nopend } = req.query;
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
      const skip = (parsedPage - 1) * parsedLimit;
      
      const db = await DbConnection.getDb();
      const wilayahIndex = await KantorWilayah.getIndex();
      let query = {};
      const conditions = [];

      // 0. Specific Nopend filter
      if (nopend) {
        conditions.push({ nopend: String(nopend).trim() });
      }

      // 1. Status Filter
      if (status === 'AKTIF') {
        conditions.push({ $or: [{ status: 'AKTIF' }, { status: { $exists: false } }] });
      } else if (status === 'NONAKTIF') {
        conditions.push({ status: 'NONAKTIF' });
      }

      // 2. Bandung/Cimahi office filter, based on stored office location fields.
      if (region === 'BANDUNG_CIMAHI' && !wilayahKode && !nopend) {
        conditions.push({
          $or: [
            { kabupaten_kota: { $regex: 'bandung|cimahi', $options: 'i' } },
            { kabupaten: { $regex: 'bandung|cimahi', $options: 'i' } },
            { kota: { $regex: 'bandung|cimahi', $options: 'i' } },
            { nama_kcu_kc: { $regex: 'bandung|cimahi|soreang', $options: 'i' } },
            { nama_kcu: { $regex: 'bandung|cimahi', $options: 'i' } }
          ]
        });
      }

      // 3. Category Filter
      if (category && category !== 'ALL') {
        const catUpper = category.toUpperCase();
        if (catUpper === 'KCU') {
          conditions.push({
            $or: [
              { tipe: 'KCU' },
              { jenis_kantor: { $regex: 'Utama|KCU', $options: 'i' } },
              { nama_nopend: { $regex: 'KCU', $options: 'i' } }
            ]
          });
        } else if (catUpper === 'KC') {
          conditions.push({
            $or: [
              { tipe: 'KC' },
              { jenis_kantor: { $regex: 'Cabang$', $options: 'i' } },
              { nama_nopend: { $regex: '\\bKC\\b', $options: 'i' } }
            ]
          });
        } else if (catUpper === 'KCP') {
          conditions.push({
            $or: [
              { tipe: 'KCP' },
              { jenis_kantor: { $regex: 'Pembantu|KCP', $options: 'i' } },
              { nama_nopend: { $regex: 'KCP', $options: 'i' } }
            ]
          });
        } else if (catUpper === 'AGENPOS' || catUpper === 'AGEN') {
          conditions.push({
            $or: [
              { tipe: 'AGENPOS' },
              { jenis_kantor: { $regex: 'Agen', $options: 'i' } },
              { nama_nopend: { $regex: 'AGEN|AGP', $options: 'i' } }
            ]
          });
        } else if (catUpper === 'SPP_DC' || catUpper === 'HUB') {
          conditions.push({
            $or: [
              { tipe: 'SPP_DC' },
              { jenis_kantor: { $regex: 'SPP|Sentral|DC', $options: 'i' } },
              { nama_nopend: { $regex: 'SPP|DC', $options: 'i' } }
            ]
          });
        }
      }

      if (conditions.length === 1) {
        query = conditions[0];
      } else if (conditions.length > 1) {
        query = { $and: conditions };
      }

      // Default sort prioritizes verified active Bandung/Cimahi operational route offices
      let sort = { is_real_verified: -1, priority: 1, nopend: 1 };
      if (sortField) {
        sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };
      }

      const searchTerm = String(search || '').trim().toUpperCase();
      const cleanNopend = String(nopend || '').trim().toUpperCase();
      const needsRegionOrSearch = Boolean(searchTerm || wilayahKode || cleanNopend);
      const cursor = db.collection('master_kantor').find(query).sort(sort);
      const rawData = needsRegionOrSearch ? await cursor.toArray() : await cursor.skip(skip).limit(parsedLimit).toArray();
      const filtered = rawData.filter(o => {
        if (cleanNopend && String(o.nopend || '').trim().toUpperCase() !== cleanNopend) return false;
        const wilayah = wilayahIndex.resolveOffice(o);
        if (wilayahKode && !wilayahIndex.isInside(wilayah.kode, wilayahKode)) return false;
        if (!searchTerm) return true;
        const fields = [o.nopend, o.nama_nopend, o.nama_kantor, o.alamat, o.provinsi,
          o.kabupaten_kota, o.kabupaten, o.kota, o.kecamatan, o.kelurahan, o.wilayah_kode, o.kode_wilayah];
        return fields.some(value => String(value || '').toUpperCase().includes(searchTerm)) ||
          wilayahIndex.searchRegion(wilayah, searchTerm);
      });
      const total = needsRegionOrSearch ? filtered.length : await db.collection('master_kantor').countDocuments(query);

      // Normalize fields for UI
      const data = (needsRegionOrSearch ? filtered.slice(skip, skip + parsedLimit) : filtered).map(o => {
        const nameUpper = String(o.nama_nopend || o.nama_kantor || '').toUpperCase();
        let resolvedType = o.tipe || null;
        let resolvedJenis = o.jenis_kantor || o.tipe_kantor || null;

        if (o.nopend === '40400' || nameUpper.includes('SPP') || nameUpper.includes('SENTRAL')) {
          resolvedType = 'SPP_DC';
          resolvedJenis = 'Sentral Pengolahan Pos (Hub)';
        } else if (o.nopend === '40000' || nameUpper.includes('KCU') || nameUpper.includes('REGIONAL')) {
          resolvedType = 'KCU';
          resolvedJenis = 'Kantor Cabang Utama';
        } else if (o.nopend === '40100' || o.nopend === '40500' || nameUpper.includes('KC ')) {
          resolvedType = 'KC';
          resolvedJenis = 'Kantor Cabang';
        } else if (nameUpper.includes('AGEN') || nameUpper.includes('AGP') || nameUpper.includes('UNPAR') || nameUpper.includes('ETHALASE') || nameUpper.includes('SRIKANDI')) {
          resolvedType = 'AGENPOS';
          resolvedJenis = 'Agenpos Mitra Feeder';
        }

        return {
          _id: o._id,
          nopend: o.nopend,
          nama_nopend: o.nama_nopend || o.nama_kantor || '-',
          nama_kantor: o.nama_kantor || o.nama_nopend || '-',
          tipe: resolvedType,
          jenis_kantor: resolvedJenis,
          alamat: o.alamat || null,
          kelurahan: o.kelurahan || null,
          kecamatan: o.kecamatan || null,
          kabupaten_kota: o.kabupaten_kota || o.kabupaten || o.kota || null,
          provinsi: o.provinsi || null,
          wilayah: wilayahIndex.resolveOffice(o),
          contact_center: o.contact_center || o.telepon || null,
          latitude: o.latitude,
          longitude: o.longitude,
          has_gps: !!(o.latitude && o.longitude),
          is_real_verified: !!o.is_real_verified,
          status: o.status || null
        };
      });

      // Quick aggregate summary
      const summaryStats = { total: await db.collection('master_kantor').countDocuments({}),
        active: await db.collection('master_kantor').countDocuments({ status: 'AKTIF' }) };

      res.json({
        success: true,
        data,
        summary: summaryStats,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit) || 1
        }
      });
    } catch (error) {
      console.error('Error in KantorController.getAll:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getFilters(req, res) {
    try {
      const db = await DbConnection.getDb();
      const regionals = await db.collection('master_kantor').distinct('kdregional', { kdregional: { $ne: '' } });
      res.json({
        success: true,
        data: {
          regionals: regionals.sort(),
          types: ['KCU', 'KC', 'KCP', 'AGENPOS', 'SPP_DC']
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWilayahOptions(req, res) {
    try {
      const result = await KantorWilayah.getOptions(req.query.parent || null);
      res.json({ success: true, ...result });
    } catch (error) { res.status(503).json({ success: false, message: error.message }); }
  }

  async getWilayahNopens(req, res) {
    try {
      const result = await KantorWilayah.getWilayahNopens(req.query.kode || '');
      res.json({ success: true, count: result.count, data: result.data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  }

  async getWilayahMap(req, res) {
    try {
      const data = await KantorWilayah.getMapScene(req.params.kode || req.query.kode || '');
      res.json({ success: true, data });
    } catch (error) { res.status(503).json({ success: false, message: error.message }); }
  }

  async reverseWilayah(req, res) {
    if (req.query.lat === undefined || req.query.lng === undefined || req.query.lat === '' || req.query.lng === '') {
      return res.status(400).json({ success: false, message: 'Koordinat wajib diisi' });
    }
    try {
      const data = await KantorWilayah.reverseLookup(Number(req.query.lat), Number(req.query.lng));
      res.json({ success: true, data });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
  }

  async create(req, res) {
    if (req.body.wilayah_kode) {
      try {
        const wilayahIndex = await KantorWilayah.getIndex();
        if (!wilayahIndex.byCode.has(String(req.body.wilayah_kode))) {
          return res.status(400).json({ success: false, message: 'Kode wilayah Kemendagri tidak valid' });
        }
      } catch (error) { return res.status(503).json({ success: false, message: error.message }); }
    }
    return super.create(req, res);
  }

  async update(req, res) {
    if (req.body.wilayah_kode) {
      try {
        const wilayahIndex = await KantorWilayah.getIndex();
        if (!wilayahIndex.byCode.has(String(req.body.wilayah_kode))) {
          return res.status(400).json({ success: false, message: 'Kode wilayah Kemendagri tidak valid' });
        }
      } catch (error) { return res.status(503).json({ success: false, message: error.message }); }
    }
    return super.update(req, res);
  }
}

export default new KantorController();
