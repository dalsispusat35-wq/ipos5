import BaseController from './BaseController.js';
import DetailRouteModel from '../models/DetailRouteModel.js';

class DetailRouteController extends BaseController {
  constructor() {
    super(DetailRouteModel, 'detail_route_id');
  }

  getSearchFilter(search) {
    const regex = { $regex: search, $options: 'i' };
    return {
      $or: [
        { detail_route_id: regex },
        { route_id: regex },
        { asal_nopen: regex },
        { asal_nama: regex },
        { tujuan_nopen: regex },
        { tujuan_nama: regex }
      ]
    };
  }
}

export default new DetailRouteController();
