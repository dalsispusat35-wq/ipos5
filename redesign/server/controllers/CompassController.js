import { ObjectId } from 'mongodb';
import DbConnection from '../config/DbConnection.js';

class CompassController {
  
  // List all saved connection profiles
  async listConnections(req, res) {
    try {
      const connections = DbConnection.loadConnections();
      res.json({ success: true, data: connections });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Save/Edit a connection profile
  async saveConnection(req, res) {
    try {
      const conn = req.body;
      if (!conn.name || !conn.uri || !conn.database) {
        return res.status(400).json({ success: false, message: 'Nama, URI, dan Database diperlukan' });
      }

      const connections = DbConnection.loadConnections();
      if (conn.id) {
        // Edit
        const index = connections.findIndex(c => c.id === conn.id);
        if (index !== -1) {
          connections[index] = conn;
        } else {
          connections.push(conn);
        }
      } else {
        // Add
        conn.id = 'conn_' + Date.now();
        connections.push(conn);
      }

      DbConnection.saveConnections(connections);
      res.json({ success: true, message: 'Koneksi berhasil disimpan', data: conn });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete a connection profile
  async deleteConnection(req, res) {
    try {
      const { id } = req.params;
      const connections = DbConnection.loadConnections();
      const filtered = connections.filter(c => c.id !== id);
      DbConnection.saveConnections(filtered);
      res.json({ success: true, message: 'Koneksi berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Switch/Connect to a connection profile
  async connect(req, res) {
    try {
      const connConfig = req.body;
      if (!connConfig.uri || !connConfig.database) {
        return res.status(400).json({ success: false, message: 'URI dan Database diperlukan' });
      }
      
      const result = await DbConnection.connect(connConfig);
      res.json({ 
        success: true, 
        message: result.message, 
        activeConnection: DbConnection.getActiveConnection() 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get active connection status
  async getActiveConnection(req, res) {
    try {
      const active = DbConnection.getActiveConnection();
      res.json({ success: true, data: active, connected: DbConnection.isConnected() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Disconnect from MongoDB
  async disconnect(req, res) {
    try {
      await DbConnection.disconnect();
      res.json({ success: true, message: 'Koneksi MongoDB berhasil diputus.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // List databases
  async listDatabases(req, res) {
    try {
      const client = await DbConnection.getClient();
      const result = await client.db().admin().listDatabases();
      res.json({ success: true, data: result.databases });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // List collections in active database (or a specific one via ?database= query)
  async listCollections(req, res) {
    try {
      const client = await DbConnection.getClient();
      const dbName = req.query.database || null;
      const db = dbName ? client.db(dbName) : await DbConnection.getDb();
      const collections = await db.listCollections().toArray();
      res.json({ success: true, data: collections });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // List documents with pagination, filters, sort, projection
  async listDocuments(req, res) {
    try {
      const { collectionName } = req.params;
      const { filter, projection, sort, limit, skip } = req.query;

      const db = await DbConnection.getDb();
      const col = db.collection(collectionName);

      // Parse JSON inputs safely
      let parsedFilter = {};
      if (filter) {
        try {
          parsedFilter = JSON.parse(filter);
          // Recursively convert 24-char hex strings in filter to ObjectIds where appropriate
          const convertToObjectId = (obj) => {
            for (const key in obj) {
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                convertToObjectId(obj[key]);
              } else if (typeof obj[key] === 'string' && ObjectId.isValid(obj[key]) && obj[key].length === 24) {
                obj[key] = new ObjectId(obj[key]);
              }
            }
          };
          convertToObjectId(parsedFilter);
        } catch (e) {
          return res.status(400).json({ success: false, message: `Format Filter JSON tidak valid: ${e.message}` });
        }
      }

      let parsedProjection = {};
      if (projection) {
        try {
          parsedProjection = JSON.parse(projection);
        } catch (e) {
          return res.status(400).json({ success: false, message: `Format Projection JSON tidak valid: ${e.message}` });
        }
      }

      let parsedSort = {};
      if (sort) {
        try {
          parsedSort = JSON.parse(sort);
        } catch (e) {
          return res.status(400).json({ success: false, message: `Format Sort JSON tidak valid: ${e.message}` });
        }
      }

      const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
      const parsedSkip = Math.max(0, parseInt(skip, 10) || 0);

      const total = await col.countDocuments(parsedFilter);
      const documents = await col.find(parsedFilter)
        .project(parsedProjection)
        .sort(parsedSort)
        .skip(parsedSkip)
        .limit(parsedLimit)
        .toArray();

      res.json({
        success: true,
        data: documents,
        total,
        limit: parsedLimit,
        skip: parsedSkip
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Insert a document in a collection
  async insertDocument(req, res) {
    try {
      const { collectionName } = req.params;
      const document = req.body;

      const db = await DbConnection.getDb();
      const col = db.collection(collectionName);

      // Convert id if valid ObjectId
      if (document._id && ObjectId.isValid(document._id)) {
        document._id = new ObjectId(document._id);
      }

      const result = await col.insertOne(document);
      res.json({ success: true, message: 'Dokumen berhasil ditambahkan', result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update a document in a collection
  async updateDocument(req, res) {
    try {
      const { collectionName, id } = req.params;
      const updateData = req.body;

      const db = await DbConnection.getDb();
      const col = db.collection(collectionName);

      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
      
      // Prevent id overwrite
      delete updateData._id;

      const result = await col.replaceOne(query, updateData);
      res.json({ success: true, message: 'Dokumen berhasil diperbarui', result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete a document in a collection
  async deleteDocument(req, res) {
    try {
      const { collectionName, id } = req.params;

      const db = await DbConnection.getDb();
      const col = db.collection(collectionName);

      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

      const result = await col.deleteOne(query);
      res.json({ success: true, message: 'Dokumen berhasil dihapus', result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // List indexes for a collection
  async listIndexes(req, res) {
    try {
      const { collectionName } = req.params;
      const db = await DbConnection.getDb();
      const col = db.collection(collectionName);
      const indexes = await col.indexes();
      res.json({ success: true, data: indexes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new CompassController();
