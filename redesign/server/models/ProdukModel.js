import BaseModel from './BaseModel.js';

class ProdukModel extends BaseModel {
  constructor() {
    super('master_produk');
  }
}

export default new ProdukModel();
