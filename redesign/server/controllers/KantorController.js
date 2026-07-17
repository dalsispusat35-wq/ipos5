import BaseController from './BaseController.js';
import KantorModel from '../models/KantorModel.js';

class KantorController extends BaseController {
  constructor() {
    // Primary ID field is nopend in the actual DB schema
    super(KantorModel, 'nopend');
  }

  getSearchFilter(search) {
    const regex = { $regex: search, $options: 'i' };
    return {
      $or: [
        { nopend: regex },
        { nama_nopend: regex },
        { nopen_kc_kcu: regex },
        { nama_kcu_kc: regex },
        { nopen_kcu: regex },
        { nama_kcu: regex },
        { kdregional: regex },
        { nama_regional: regex }
      ]
    };
  }

  async getAll(req, res) {
    try {
      const { search, page, limit, sortField, sortOrder, status, ...filters } = req.query;
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
      const skip = (parsedPage - 1) * parsedLimit;
      
      let filter = {};
      
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          filter[key] = value;
        }
      }

      // Status filter logic: treat absent status or 'AKTIF' as active
      if (status === 'AKTIF') {
        filter.$or = [
          { status: 'AKTIF' },
          { status: { $exists: false } }
        ];
      } else if (status === 'NONAKTIF') {
        filter.status = 'NONAKTIF';
      }

      if (search) {
        const searchFilter = this.getSearchFilter(search);
        if (filter.$or) {
          filter = {
            $and: [
              { $or: filter.$or },
              searchFilter
            ]
          };
        } else {
          filter = { ...filter, ...searchFilter };
        }
      }

      const total = await this.model.count(filter);
      
      const sort = {};
      if (sortField) {
        sort[sortField] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort[this.idField] = 1;
      }

      const data = await this.model.find(filter, {
        skip,
        limit: parsedLimit,
        sort
      });

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit)
        }
      });
    } catch (error) {
      console.error('Error in KantorController.getAll:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async getFilters(req, res) {
    try {
      const regionals = await this.model.distinct('kdregional', { kdregional: { $ne: '' } });
      res.json({
        success: true,
        data: {
          regionals: regionals.sort(),
          types: [] // No typekantor in actual schema
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new KantorController();
