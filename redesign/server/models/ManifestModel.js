import BaseModel from './BaseModel.js';

class ManifestModel extends BaseModel {
  constructor() {
    super('manifests');
  }

  async generateNextId() {
    return await this.generateAutoId('MNF', 'master_manifest_code', 6);
  }
}

export default new ManifestModel();
