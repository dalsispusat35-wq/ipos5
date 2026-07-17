import ManifestModel from '../models/ManifestModel.js';
import TransactionModel from '../models/TransactionModel.js';
import DbConnection from '../config/DbConnection.js';

const VALID_STATES = [
  'DITERIMA_DI_CILILIN',
  'DITERIMA_DI_CIMAHI',
  'TRANSIT_SPP_BANDUNG',
  'TIBA_DI_SPP_TUJUAN',
  'DELIVERED'
];

export function validateStateTransition(currentState, newState) {
  const current = (currentState || '').toUpperCase().trim();
  const target = (newState || '').toUpperCase().trim();

  const currentIndex = VALID_STATES.indexOf(current);
  const targetIndex = VALID_STATES.indexOf(target);

  if (targetIndex === -1) {
    throw new Error(`Status tujuan "${newState}" tidak valid.`);
  }

  if (currentIndex === -1) {
    if (target === 'DITERIMA_DI_CILILIN' || target === 'DITERIMA_DI_CIMAHI') {
      return true;
    }
    throw new Error(`Status saat ini "${currentState}" tidak berada dalam pipeline linear. Paket harus mulai dari KCP Cililin atau KC Cimahi.`);
  }

  if (targetIndex !== currentIndex + 1) {
    throw new Error(`Transisi status tidak valid: tidak bisa melompati status atau mundur dari "${currentState}" ke "${newState}". Urutan harus: KCP Cililin -> KC Cimahi -> Transit SPP Bandung -> SPP Tujuan -> Delivered.`);
  }

  return true;
}

class ManifestController {
  
  // List all manifests
  async getAll(req, res) {
    try {
      const filter = {};
      if (req.query.status) filter.status_perjalanan = req.query.status;
      if (req.query.code) filter.master_manifest_code = req.query.code;
      const manifests = await ManifestModel.find(filter, { sort: { createdAt: -1 } });
      res.json({ success: true, data: manifests });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getByCode(req, res) {
    try {
      const manifest = await ManifestModel.findOne({ master_manifest_code: req.params.code });
      if (!manifest) return res.status(404).json({ success: false, message: 'Manifest tidak ditemukan' });
      res.json({ success: true, data: manifest });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Checkpoint 1: Bagging (Create Manifest)
  async create(req, res) {
    try {
      const connote_codes = [...new Set(req.body.connote_codes || [])];
      if (!connote_codes || !Array.isArray(connote_codes) || connote_codes.length === 0) {
        return res.status(400).json({ success: false, message: 'Daftar connote_codes diperlukan' });
      }

      // Validate all connotes are currently in DITERIMA_DI_CIMAHI status
      const connoteDocs = [];
      for (const code of connote_codes) {
        const { document } = await TransactionModel.findByConnoteCode(code);
        if (!document) {
          return res.status(404).json({ success: false, message: `Connote "${code}" tidak ditemukan di database` });
        }
        
        const state = (document.connote?.connote_state || document.connote_state || '').toUpperCase().trim();
        if (state !== 'DITERIMA_DI_CIMAHI') {
          return res.status(400).json({
            success: false,
            message: `Connote "${code}" berstatus "${state}". Hanya paket berstatus "DITERIMA_DI_CIMAHI" yang dapat dimasukkan ke dalam manifest.`
          });
        }
        if (document.manifest_id) {
          return res.status(409).json({ success: false, message: `Connote "${code}" sudah berada dalam manifest "${document.manifest_id}".` });
        }
        connoteDocs.push(document);
      }

      // Generate Manifest Code
      const manifestCode = await ManifestModel.generateNextId();
      
      const newManifest = {
        master_manifest_code: manifestCode,
        status_perjalanan: 'Draft',
        connote_codes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const client = await DbConnection.getClient();
      const db = await DbConnection.getDb();
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          await db.collection('manifests').insertOne(newManifest, { session });
          const operations = connote_codes.map(code => ({
            updateOne: {
              filter: { $and: [TransactionModel.connoteFilter(code), { manifest_id: null }] },
              update: { $set: { manifest_id: manifestCode, updatedAt: new Date() } }
            }
          }));
          const updateResult = await db.collection('transaksi').bulkWrite(operations, { session });
          if (updateResult.matchedCount !== connote_codes.length) {
            throw new Error('Sebagian paket berubah atau sudah masuk manifest. Pembuatan dibatalkan.');
          }
        });
      } finally {
        await session.endSession();
      }

      res.status(201).json({
        success: true,
        message: `Manifest "${manifestCode}" berhasil dibuat dengan ${connote_codes.length} paket.`,
        data: newManifest
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Checkpoint 2: Transit SPP Bandung
  async transit(req, res) {
    try {
      const { master_manifest_code } = req.body;
      if (!master_manifest_code) {
        return res.status(400).json({ success: false, message: 'master_manifest_code harus diisi' });
      }

      const manifest = await ManifestModel.findOne({ master_manifest_code });
      if (!manifest) {
        return res.status(404).json({ success: false, message: `Manifest "${master_manifest_code}" tidak ditemukan` });
      }
      if (manifest.status_perjalanan !== 'Draft') {
        return res.status(409).json({ success: false, message: `Manifest harus berstatus "Draft", status saat ini "${manifest.status_perjalanan}".` });
      }

      // Validate the complete manifest before starting transaction
      let errorMessages = [];
      for (const code of manifest.connote_codes) {
        const { document } = await TransactionModel.findByConnoteCode(code);
        if (!document) {
          errorMessages.push(`Paket "${code}" tidak ditemukan.`);
          continue;
        }
        try {
          validateStateTransition(document.connote?.connote_state || document.connote_state || '', 'TRANSIT_SPP_BANDUNG');
        } catch (error) {
          errorMessages.push(`Paket "${code}": ${error.message}`);
        }
      }

      if (errorMessages.length) {
        return res.status(409).json({ success: false, message: 'Tidak ada data yang diubah karena isi manifest belum valid.', updatedCount: 0, errors: errorMessages });
      }

      const client = await DbConnection.getClient();
      const db = await DbConnection.getDb();
      const session = client.startSession();
      const changedAt = new Date();
      let updatedCount = 0;

      try {
        await session.withTransaction(async () => {
          // 1. Update manifest status to Transit
          const updateManifestRes = await db.collection('manifests').updateOne(
            { master_manifest_code, status_perjalanan: 'Draft' },
            { $set: { status_perjalanan: 'Transit', updatedAt: changedAt } },
            { session }
          );

          if (updateManifestRes.matchedCount === 0) {
            throw new Error('Manifest status_perjalanan bukan Draft atau manifest telah berubah.');
          }

          // 2. Bulk update connotes status & history
          const operations = manifest.connote_codes.map(code => ({
            updateOne: {
              filter: TransactionModel.connoteFilter(code),
              update: {
                $set: {
                  'connote.connote_state': 'TRANSIT_SPP_BANDUNG',
                  connote_state: 'TRANSIT_SPP_BANDUNG',
                  updatedAt: changedAt
                },
                $push: {
                  tracking_history: {
                    from: 'DITERIMA_DI_CIMAHI',
                    to: 'TRANSIT_SPP_BANDUNG',
                    changedAt,
                    manifest_id: master_manifest_code
                  }
                }
              }
            }
          }));

          const updateResult = await db.collection('transaksi').bulkWrite(operations, { session });
          updatedCount = updateResult.matchedCount;

          if (updatedCount !== manifest.connote_codes.length) {
            throw new Error('Sebagian paket dalam manifest gagal diperbarui di database.');
          }
        });
      } finally {
        await session.endSession();
      }

      res.json({
        success: true,
        message: `Manifest "${master_manifest_code}" diproses transit di SPP Bandung.`,
        updatedCount,
        errors: []
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Checkpoint 3 Helper: Arrive Manifest at Destination SPP
  async arrive(req, res) {
    try {
      const { master_manifest_code } = req.body;
      if (!master_manifest_code) {
        return res.status(400).json({ success: false, message: 'master_manifest_code harus diisi' });
      }

      const manifest = await ManifestModel.findOne({ master_manifest_code });
      if (!manifest) {
        return res.status(404).json({ success: false, message: `Manifest "${master_manifest_code}" tidak ditemukan` });
      }
      if (manifest.status_perjalanan !== 'Transit') {
        return res.status(409).json({ success: false, message: `Manifest harus berstatus "Transit", status saat ini "${manifest.status_perjalanan}".` });
      }

      // Validate the complete manifest before starting transaction
      let errorMessages = [];
      for (const code of manifest.connote_codes) {
        const { document } = await TransactionModel.findByConnoteCode(code);
        if (!document) {
          errorMessages.push(`Paket "${code}" tidak ditemukan.`);
          continue;
        }
        try {
          validateStateTransition(document.connote?.connote_state || document.connote_state || '', 'TIBA_DI_SPP_TUJUAN');
        } catch (error) {
          errorMessages.push(`Paket "${code}": ${error.message}`);
        }
      }

      if (errorMessages.length) {
        return res.status(409).json({ success: false, message: 'Tidak ada data yang diubah karena isi manifest belum valid.', updatedCount: 0, errors: errorMessages });
      }

      const client = await DbConnection.getClient();
      const db = await DbConnection.getDb();
      const session = client.startSession();
      const changedAt = new Date();
      let updatedCount = 0;

      try {
        await session.withTransaction(async () => {
          // 1. Update manifest status to Arrived
          const updateManifestRes = await db.collection('manifests').updateOne(
            { master_manifest_code, status_perjalanan: 'Transit' },
            { $set: { status_perjalanan: 'Arrived', updatedAt: changedAt } },
            { session }
          );

          if (updateManifestRes.matchedCount === 0) {
            throw new Error('Manifest status_perjalanan bukan Transit atau manifest telah berubah.');
          }

          // 2. Bulk update connotes status & history
          const operations = manifest.connote_codes.map(code => ({
            updateOne: {
              filter: TransactionModel.connoteFilter(code),
              update: {
                $set: {
                  'connote.connote_state': 'TIBA_DI_SPP_TUJUAN',
                  connote_state: 'TIBA_DI_SPP_TUJUAN',
                  updatedAt: changedAt
                },
                $push: {
                  tracking_history: {
                    from: 'TRANSIT_SPP_BANDUNG',
                    to: 'TIBA_DI_SPP_TUJUAN',
                    changedAt,
                    manifest_id: master_manifest_code
                  }
                }
              }
            }
          }));

          const updateResult = await db.collection('transaksi').bulkWrite(operations, { session });
          updatedCount = updateResult.matchedCount;

          if (updatedCount !== manifest.connote_codes.length) {
            throw new Error('Sebagian paket dalam manifest gagal diperbarui di database.');
          }
        });
      } finally {
        await session.endSession();
      }

      res.json({
        success: true,
        message: `Manifest "${master_manifest_code}" telah tiba di SPP Tujuan.`,
        updatedCount,
        errors: []
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ManifestController();
