import BaseController from './BaseController.js';
import TemplateModel from '../models/TemplateModel.js';

class TemplateController extends BaseController {
  constructor() {
    super(TemplateModel, 'template_id');
  }

  getSearchFilter(search) {
    const regex = { $regex: search, $options: 'i' };
    return {
      $or: [
        { template_id: regex },
        { route_id: regex },
        { kendaraan_id: regex },
        { nama_kendaraan: regex },
        { moda: regex },
        { asal_nopen: regex },
        { asal_nama: regex },
        { tujuan_nopen: regex },
        { tujuan_nama: regex }
      ]
    };
  }
}

export default new TemplateController();
