import BaseModel from './BaseModel.js';

class DetailRouteModel extends BaseModel {
  constructor() {
    super('detail_route');
  }

  async generateNextId() {
    return await this.generateAutoId('DR', 'detail_route_id', 6);
  }
}

export default new DetailRouteModel();
