import DbConnection from './config/DbConnection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PickupScheduleController from './controllers/PickupScheduleController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONNECTIONS_FILE = path.join(__dirname, 'config', 'connections.json');

async function main() {
  const connections = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, 'utf8'));
  let connected = false;

  for (const conn of connections) {
    try {
      await DbConnection.connect(conn);
      connected = true;
      break;
    } catch (e) {
      // ignore
    }
  }

  if (!connected) {
    console.error('Semua koneksi database gagal.');
    process.exit(1);
  }

  // Run the getSlide2Night controller simulation
  const req = {};
  const res = {
    json: (data) => {
      console.log(JSON.stringify(data, null, 2));
      fs.writeFileSync(path.join(__dirname, 'slide2_resolved.json'), JSON.stringify(data, null, 2), 'utf8');
    },
    status: (code) => {
      console.log(`STATUS CODE: ${code}`);
      return res;
    }
  };

  await PickupScheduleController.getSlide2Night(req, res);
  await DbConnection.disconnect();
}

main().catch(console.error);
