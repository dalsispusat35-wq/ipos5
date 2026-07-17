import BaseModel from './BaseModel.js';

class TemplateModel extends BaseModel {
  constructor() {
    super('template_jadwal_transportasi');
  }

  async generateNextId() {
    return await this.generateAutoId('T', 'template_id', 6);
  }
}

export default new TemplateModel();
