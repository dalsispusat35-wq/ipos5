import BaseModel from './BaseModel.js';

class RouteModel extends BaseModel {
  constructor() {
    super('master_route_nopen');
  }

  async generateNextId() {
    return await this.generateAutoId('R', 'route_id', 6);
  }
}

export default new RouteModel();
