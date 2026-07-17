import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONNECTIONS_FILE = path.join(__dirname, 'connections.json');

const DEFAULT_CONNECTIONS = [
  {
    id: 'default',
    name: 'R (192.168.5.219)',
    uri: 'mongodb://admin:Pos3eu8XDH6BJ8LBB6XUpZ8bhWVCqCgErxD@192.168.5.219:27017/?authSource=admin',
    database: 'ipos5_reporting',
    color: '#059669'
  },
  {
    id: 'local',
    name: 'Local MongoDB',
    uri: 'mongodb://localhost:27017',
    database: 'ipos5_reporting',
    color: '#4f46e5'
  }
];

class DbConnection {
  static client = null;
  static db = null;
  static activeConnection = null;

  static loadConnections() {
    try {
      if (fs.existsSync(CONNECTIONS_FILE)) {
        const data = fs.readFileSync(CONNECTIONS_FILE, 'utf8');
        return JSON.parse(data);
      } else {
        fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(DEFAULT_CONNECTIONS, null, 2), 'utf8');
        return DEFAULT_CONNECTIONS;
      }
    } catch (error) {
      console.error('Error loading connections list:', error);
      return DEFAULT_CONNECTIONS;
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
