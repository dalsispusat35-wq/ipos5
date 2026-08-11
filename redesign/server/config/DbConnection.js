import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONNECTIONS_FILE = path.join(__dirname, 'connections.json');

const getDefaultConnections = () => [
  {
    id: 'default',
    name: 'Primary MongoDB Server',
    uri: process.env.MONGO_URI_DEFAULT || 'mongodb://127.0.0.1:27017/ipos5_reporting',
    database: process.env.MONGO_DB_NAME || 'ipos5_reporting',
    color: '#059669'
  },
  {
    id: 'local',
    name: 'Local MongoDB',
    uri: process.env.MONGO_URI_LOCAL || 'mongodb://127.0.0.1:27017/ipos5_reporting',
    database: process.env.MONGO_DB_NAME || 'ipos5_reporting',
    color: '#4f46e5'
  }
];

class DbConnection {
  static client = null;
  static db = null;
  static activeConnection = null;

  static loadConnections() {
    try {
      const defaults = getDefaultConnections();
      if (fs.existsSync(CONNECTIONS_FILE)) {
        const data = fs.readFileSync(CONNECTIONS_FILE, 'utf8');
        return JSON.parse(data);
      } else {
        fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(defaults, null, 2), 'utf8');
        return defaults;
      }
    } catch (error) {
      console.error('Error loading connections list:', error);
      return getDefaultConnections();
    }
  }

  static saveConnections(connections) {
    try {
      fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connections, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving connections list:', error);
      return false;
    }
  }

  static async connect(connectionConfig) {
    // Close existing connection if any
    if (DbConnection.client) {
      try {
        await DbConnection.client.close();
      } catch (e) {
        console.error('Error closing current client:', e);
      }
    }

    try {
      const client = new MongoClient(connectionConfig.uri, {
        serverSelectionTimeoutMS: 5000
      });
      await client.connect();
      
      // Ping database to verify connection
      await client.db('admin').command({ ping: 1 });

      DbConnection.client = client;
      DbConnection.db = client.db(connectionConfig.database);
      DbConnection.activeConnection = connectionConfig;
      console.log(`Connected successfully to database "${connectionConfig.database}" via connection "${connectionConfig.name}"`);
      return { success: true, message: 'Connected successfully!' };
    } catch (error) {
      console.error(`Failed to connect to connection "${connectionConfig.name}":`, error);
      DbConnection.client = null;
      DbConnection.db = null;
      DbConnection.activeConnection = null;
      throw new Error(`Koneksi Gagal: ${error.message}`);
    }
  }

  static async getDb() {
    if (!DbConnection.db) {
      throw new Error('DATABASE_NOT_CONNECTED');
    }
    return DbConnection.db;
  }

  static async getClient() {
    if (!DbConnection.client) {
      throw new Error('DATABASE_NOT_CONNECTED');
    }
    return DbConnection.client;
  }

  static getActiveConnection() {
    return DbConnection.activeConnection;
  }

  static async disconnect() {

    if (DbConnection.client) {
      try {
        await DbConnection.client.close();
        console.log('MongoDB connection closed.');
      } catch (e) {
        console.error('Error closing client:', e);
      }
    }
    DbConnection.client = null;
    DbConnection.db = null;
    DbConnection.activeConnection = null;
  }

  static isConnected() {
    return DbConnection.db !== null && DbConnection.client !== null;
  }
}

export default DbConnection;
