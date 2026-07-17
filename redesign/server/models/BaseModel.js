import DbConnection from '../config/DbConnection.js';

class BaseModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async getCollection() {
    const db = await DbConnection.getDb();
    return db.collection(this.collectionName);
  }

  async find(filter = {}, options = {}) {
    const col = await this.getCollection();
    const { sort, limit, skip, projection, ...findOptions } = options;
    let cursor = col.find(filter, findOptions);
    if (projection) cursor = cursor.project(projection);
    if (sort) cursor = cursor.sort(sort);
    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);
    return await cursor.toArray();
  }

  async findOne(filter = {}, options = {}) {
    const col = await this.getCollection();
    return await col.findOne(filter, options);
  }

  async insertOne(doc) {
    const col = await this.getCollection();
    // Add timestamps
    const documentWithTimestamps = {
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await col.insertOne(documentWithTimestamps);
    return {
      ...result,
      insertedId: result.insertedId.toString()
    };
  }

  async updateOne(filter, update, options = {}) {
    const col = await this.getCollection();
    // Add updatedAt if using $set
    let finalUpdate = update;
    if (update.$set) {
      finalUpdate = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      };
    } else {
      finalUpdate = {
        $set: {
          ...update,
          updatedAt: new Date()
        }
      };
    }
    const result = await col.updateOne(filter, finalUpdate, options);
    return result;
  }

  async deleteOne(filter) {
    const col = await this.getCollection();
    const result = await col.deleteOne(filter);
    return result;
  }

  async count(filter = {}, options = {}) {
    const col = await this.getCollection();
    return await col.countDocuments(filter, options);
  }

  async distinct(key, filter = {}, options = {}) {
    const col = await this.getCollection();
    return await col.distinct(key, filter, options);
  }

  async deleteMany(filter) {
    const col = await this.getCollection();
    return await col.deleteMany(filter);
  }

  async insertMany(docs) {
    const col = await this.getCollection();
    const docsWithTimestamps = docs.map(d => ({
      ...d,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    return await col.insertMany(docsWithTimestamps);
  }

  async generateAutoId(prefix, field, padding = 6) {
    const col = await this.getCollection();
    const cursor = await col.find({}, {
      projection: { [field]: 1 },
      sort: { [field]: -1 },
      limit: 1
    }).toArray();
    
    let lastNum = 0;
    if (cursor.length > 0 && cursor[0][field]) {
      const match = cursor[0][field].match(/(\d+)$/);
      if (match) {
        lastNum = parseInt(match[1], 10);
      }
    }
    
    const newNum = lastNum + 1;
    return prefix + String(newNum).padStart(padding, '0');
  }
}

export default BaseModel;
