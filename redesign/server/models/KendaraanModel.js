import BaseModel from './BaseModel.js';

class KendaraanModel extends BaseModel {
  constructor() {
    super('master_kendaraan');
  }

  async generateNextId() {
    return await this.generateAutoId('KD', 'kendaraan_id', 4);
  }
}

export default new KendaraanModel();
