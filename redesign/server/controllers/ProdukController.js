import BaseController from './BaseController.js';
import ProdukModel from '../models/ProdukModel.js';

class ProdukController extends BaseController {
  constructor() {
    super(ProdukModel, 'kodeMile');
  }

  getSearchFilter(search) {
    const regex = { $regex: search, $options: 'i' };
    return {
      $or: [
        { kodeMile: regex },
        { serviceId: regex },
        { segmenProduk: regex },
        { pasar: regex },
        { status: regex }
      ]
    };
  }

  async getFilters(req, res) {
    try {
      const segmen = await this.model.distinct('segmenProduk', { segmenProduk: { $ne: '' } });
      const pasarList = await this.model.distinct('pasar', { pasar: { $ne: '' } });
      res.json({
        success: true,
        data: {
          segmen: segmen.sort(),
          pasar: pasarList.sort()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ProdukController();
