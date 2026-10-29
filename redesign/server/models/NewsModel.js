import BaseModel from './BaseModel.js';
import { ObjectId } from 'mongodb';

class NewsModel extends BaseModel {
  constructor() {
    super('news');
  }

  toObjectId(id) {
    if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
      try {
        return new ObjectId(id);
      } catch (e) {
        return id;
      }
    }
    return id;
  }

  buildIdFilter(id) {
    const objId = this.toObjectId(id);
    if (objId instanceof ObjectId) {
      return { $or: [{ _id: objId }, { _id: String(id) }] };
    }
    return { _id: String(id) };
  }

  async getAll(options = {}) {
    const { 
      filter = {}, 
      sort = { publishedAt: -1, createdAt: -1 }, 
      limit = 50, 
      skip = 0 
    } = options;

    return await this.find(filter, { sort, limit, skip });
  }

  async getById(id) {
    if (!id) return null;
    return await this.findOne(this.buildIdFilter(id));
  }

  async create(doc) {
    const newsDoc = {
      title: doc.title || '',
      imageUrl: doc.imageUrl || '',
      summary: doc.summary || '',
      sourceUrl: doc.sourceUrl || '',
      sourceName: doc.sourceName || 'PT Pos Indonesia',
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : new Date(),
      isManual: Boolean(doc.isManual)
    };
    return await this.insertOne(newsDoc);
  }

  async update(id, updateData) {
    if (!id) throw new Error('News ID is required for update');
    
    const cleanData = { ...updateData };
    delete cleanData._id;
    
    if (cleanData.publishedAt) {
      cleanData.publishedAt = new Date(cleanData.publishedAt);
    }
    if (cleanData.isManual !== undefined) {
      cleanData.isManual = Boolean(cleanData.isManual);
    }

    return await this.updateOne(this.buildIdFilter(id), cleanData);
  }

  async delete(id) {
    if (!id) throw new Error('News ID is required for deletion');
    return await this.deleteOne(this.buildIdFilter(id));
  }

  async findBySourceUrl(sourceUrl) {
    if (!sourceUrl) return null;
    const trimmed = String(sourceUrl).trim();
    return await this.findOne({
      $or: [
        { sourceUrl: trimmed },
        { sourceUrl: trimmed.replace(/^https?:\/\//, '') }
      ]
    });
  }
}

export default new NewsModel();
