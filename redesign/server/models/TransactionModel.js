import BaseModel from './BaseModel.js';

class TransactionModel extends BaseModel {
  constructor() {
    super('transaksi');
  }

  async findByConnoteCode(connoteCode) {
    const document = await this.findOne({
      $or: [
        { 'connote.connote_code': connoteCode },
        { connote_code: connoteCode },
        { connoteCode: connoteCode },
        { 'connote.connote_booking_code': connoteCode }
      ]
    });
    return { document };
  }

  connoteFilter(connoteCode) {
    return {
      $or: [
        { 'connote.connote_code': connoteCode },
        { connote_code: connoteCode },
        { connoteCode: connoteCode },
        { 'connote.connote_booking_code': connoteCode }
      ]
    };
  }
}

export default new TransactionModel();
