import BaseController from './BaseController.js';
import RouteModel from '../models/RouteModel.js';

class RouteController extends BaseController {
  constructor() {
    super(RouteModel, 'route_id');
  }

  getSearchFilter(search) {
    const regex = { $regex: search, $options: 'i' };
    return {
      $or: [
        { route_id: regex },
        { nopen_asal: regex },
        { nama_asal: regex },
        { nopen_tujuan: regex },
        { nama_tujuan: regex },
        { kodeMile: regex },
        { deskripsi_produk: regex }
      ]
    };
  }
}

export default new RouteController();
