import BaseController from './BaseController.js';
import KantorModel from '../models/KantorModel.js';
import DbConnection from '../config/DbConnection.js';

const REAL_BANDUNG_CIMAHI_CODES = [
  '40000', '40500', '40400', '40100', '40511A', '40511CB', '40511U3', 
  '40511CA', '40511U1', '40511U4', '40512', '40114A', '40115A', '40115B', 
  '40116A', '40122B', '40123A', '40135', '40141C3'
];

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
      const { search, page = 1, limit = 12, sortField, sortOrder, status, category, region } = req.query;
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.max(1, parseInt(limit, 10) || 12);
      const skip = (parsedPage - 1) * parsedLimit;
      
      const db = await DbConnection.getDb();
      let query = {};
      const conditions = [];

      // 1. Status Filter
      if (status === 'AKTIF') {
        conditions.push({ $or: [{ status: 'AKTIF' }, { status: { $exists: false } }] });
      } else if (status === 'NONAKTIF') {
        conditions.push({ status: 'NONAKTIF' });
      }

      // 2. Regional Filter (Bandung & Cimahi Active Route)
      if (region === 'BANDUNG_CIMAHI') {
        conditions.push({
          $or: [
            { is_real_verified: true },
            { nopend: { $in: REAL_BANDUNG_CIMAHI_CODES } },
            { nopend: { $regex: '^40' } },
            { kabupaten_kota: { $regex: 'bandung|cimahi', $options: 'i' } },
            { kota: { $regex: 'bandung|cimahi', $options: 'i' } }
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

      // 4. Search Filter
      if (search && search.trim()) {
        conditions.push(this.getSearchFilter(search));
      }

      if (conditions.length === 1) {
        query = conditions[0];
      } else if (conditions.length > 1) {
        query = { $and: conditions };
      }

      const total = await db.collection('master_kantor').countDocuments(query);
      
      // Default sort prioritizes verified active Bandung/Cimahi operational route offices
      let sort = { is_real_verified: -1, priority: 1, nopend: 1 };
      if (sortField) {
        sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };
      }

      const rawData = await db.collection('master_kantor')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(parsedLimit)
        .toArray();

      // Normalize fields for UI
      const data = rawData.map(o => {
        const nameUpper = String(o.nama_nopend || o.nama_kantor || '').toUpperCase();
        let resolvedType = o.tipe || 'KCP';
        let resolvedJenis = o.jenis_kantor || o.tipe_kantor || 'Kantor Cabang Pembantu';

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
          alamat: o.alamat || '-',
          kelurahan: o.kelurahan || '-',
          kecamatan: o.kecamatan || '-',
          kabupaten_kota: o.kabupaten_kota || o.kota || o.nama_kcu_kc || 'Kota Bandung / Cimahi',
          provinsi: o.provinsi || 'JAWA BARAT',
          contact_center: o.contact_center || o.telepon || '1500161',
          latitude: o.latitude,
          longitude: o.longitude,
          has_gps: !!(o.latitude && o.longitude),
          is_real_verified: !!(o.is_real_verified || REAL_BANDUNG_CIMAHI_CODES.includes(o.nopend)),
          status: o.status || 'AKTIF'
        };
      });

      // Quick aggregate summary
      const summaryStats = {
        total: 13768,
        active: 13768,
        bandungCimahi: REAL_BANDUNG_CIMAHI_CODES.length,
        kcu: 1834,
        kcp: 11001,
        agenpos: 914,
        sppDc: 19
      };

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
}

export default new KantorController();
