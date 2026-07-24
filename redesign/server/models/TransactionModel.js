import BaseModel from './BaseModel.js';

class TransactionModel extends BaseModel {
  constructor() {
    super('transaksi');
  }

  async findByConnoteCode(connoteCode) {
    const trimmed = String(connoteCode || '').trim();
    if (!trimmed) return { document: null };

    const regexExact = new RegExp(`^${trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
    const regexPartial = new RegExp(trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

    let document = await this.findOne({
      $or: [
        { 'connote.connote_code': regexExact },
        { connote_code: regexExact },
        { connoteCode: regexExact },
        { 'connote.connote_booking_code': regexExact },
        { _id: trimmed },
        { 'location_data_created.custom_field.idKorporatConnote': regexExact },
        { 'custom_field.idKorporatConnote': regexExact }
      ]
    });

    if (!document) {
      document = await this.findOne({
        $or: [
          { 'connote.connote_code': regexPartial },
          { connote_code: regexPartial },
          { connoteCode: regexPartial },
          { 'connote.connote_booking_code': regexPartial }
        ]
      });
    }

    return { document };
  }

  connoteFilter(connoteCode) {
    const trimmed = String(connoteCode || '').trim();
    const regexExact = new RegExp(`^${trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
    return {
      $or: [
        { 'connote.connote_code': regexExact },
        { connote_code: regexExact },
        { connoteCode: regexExact },
        { 'connote.connote_booking_code': regexExact }
      ]
    };
  }
}

export default new TransactionModel();
