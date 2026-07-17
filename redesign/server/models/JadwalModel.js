import BaseModel from './BaseModel.js';

class JadwalModel extends BaseModel {
  constructor() {
    super('jadwal_transportasi');
  }
}

export default new JadwalModel();
