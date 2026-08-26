import ManifestModel from '../models/ManifestModel.js';
import TransactionModel from '../models/TransactionModel.js';
import DbConnection from '../config/DbConnection.js';

const VALID_STATES = [
  'DITERIMA_DI_CIMAHI',
  'IN_MANIFEST',
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
    if (target === 'DITERIMA_DI_CIMAHI') {
      return true;
    }
    throw new Error(`Status saat ini "${currentState}" tidak berada dalam pipeline linear. Paket harus mulai dari KC Cimahi.`);
  }

  if (targetIndex !== currentIndex + 1) {
    throw new Error(`Transisi status tidak valid: tidak bisa melompati status atau mundur dari "${currentState}" ke "${newState}". Urutan harus: DITERIMA_DI_CIMAHI -> IN_MANIFEST -> TRANSIT_SPP_BANDUNG -> TIBA_DI_SPP_TUJUAN -> DELIVERED.`);
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

      const runInSessionOrFallback = async (workFn) => {
        try {
          const session = client.startSession();
          try {
            await session.withTransaction(async () => {
              await workFn(session);
            });
          } finally {
            await session.endSession();
          }
        } catch (err) {
          if (err.message && err.message.includes('Transaction numbers are only allowed')) {
            await workFn(null);
          } else {
            throw err;
          }
        }
      };

      await runInSessionOrFallback(async (session) => {
        const sessionOpt = session ? { session } : {};
        await db.collection('manifests').insertOne(newManifest, sessionOpt);
        const operations = connote_codes.map(code => ({
          updateOne: {
            filter: { $and: [TransactionModel.connoteFilter(code), { manifest_id: null }] },
            update: { 
              $set: { 
                manifest_id: manifestCode, 
                connote_state: 'IN_MANIFEST',
                'connote.connote_state': 'IN_MANIFEST',
                updatedAt: new Date() 
              },
              $push: {
                tracking_history: {
                  from_state: 'DITERIMA_DI_CIMAHI',
                  to_state: 'IN_MANIFEST',
                  from: 'DITERIMA_DI_CIMAHI',
                  to: 'IN_MANIFEST',
                  changedAt: new Date(),
                  manifest_id: manifestCode
                }
              }
            }
          }
        }));
        const updateResult = await db.collection('transaksi').bulkWrite(operations, sessionOpt);
        if (updateResult.matchedCount !== connote_codes.length) {
          throw new Error('Sebagian paket berubah atau sudah masuk manifest. Pembuatan dibatalkan.');
        }
      });

      res.status(201).json({
        success: true,
        message: `Manifest "${manifestCode}" berhasil dibuat dengan ${connote_codes.length} paket. Status resi berubah menjadi IN_MANIFEST.`,
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
      const connoteDocsMap = new Map();
      for (const code of manifest.connote_codes) {
        const { document } = await TransactionModel.findByConnoteCode(code);
        if (!document) {
          errorMessages.push(`Paket "${code}" tidak ditemukan.`);
          continue;
        }
        const currentState = document.connote?.connote_state || document.connote_state || '';
        try {
          validateStateTransition(currentState, 'TRANSIT_SPP_BANDUNG');
          connoteDocsMap.set(code, document);
        } catch (error) {
          errorMessages.push(`Paket "${code}": ${error.message}`);
        }
      }

      if (errorMessages.length) {
        return res.status(409).json({ success: false, message: 'Tidak ada data yang diubah karena isi manifest belum valid.', updatedCount: 0, errors: errorMessages });
      }

      const client = await DbConnection.getClient();
      const db = await DbConnection.getDb();
      const changedAt = new Date();
      let updatedCount = 0;

      const runInSessionOrFallback = async (workFn) => {
        try {
          const session = client.startSession();
          try {
            await session.withTransaction(async () => {
              await workFn(session);
            });
          } finally {
            await session.endSession();
          }
        } catch (err) {
          if (err.message && err.message.includes('Transaction numbers are only allowed')) {
            await workFn(null);
          } else {
            throw err;
          }
        }
      };

      await runInSessionOrFallback(async (session) => {
        const sessionOpt = session ? { session } : {};
        const updateManifestRes = await db.collection('manifests').updateOne(
          { master_manifest_code, status_perjalanan: 'Draft' },
          { $set: { status_perjalanan: 'Transit', updatedAt: changedAt } },
          sessionOpt
        );

        if (updateManifestRes.matchedCount === 0) {
          throw new Error('Manifest status_perjalanan bukan Draft atau manifest telah berubah.');
        }

        const operations = manifest.connote_codes.map(code => {
          const doc = connoteDocsMap.get(code);
          const prevState = doc ? (doc.connote?.connote_state || doc.connote_state || 'IN_MANIFEST') : 'IN_MANIFEST';
          return {
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
                    from_state: prevState,
                    to_state: 'TRANSIT_SPP_BANDUNG',
                    from: prevState,
                    to: 'TRANSIT_SPP_BANDUNG',
                    changedAt,
                    manifest_id: master_manifest_code
                  }
                }
              }
            }
          };
        });

        const updateResult = await db.collection('transaksi').bulkWrite(operations, sessionOpt);
        updatedCount = updateResult.matchedCount;

        if (updatedCount !== manifest.connote_codes.length) {
          throw new Error('Sebagian paket dalam manifest gagal diperbarui di database.');
        }
      });

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
      const connoteDocsMap = new Map();
      for (const code of manifest.connote_codes) {
        const { document } = await TransactionModel.findByConnoteCode(code);
        if (!document) {
          errorMessages.push(`Paket "${code}" tidak ditemukan.`);
          continue;
        }
        const currentState = document.connote?.connote_state || document.connote_state || '';
        try {
          validateStateTransition(currentState, 'TIBA_DI_SPP_TUJUAN');
          connoteDocsMap.set(code, document);
        } catch (error) {
          errorMessages.push(`Paket "${code}": ${error.message}`);
        }
      }

      if (errorMessages.length) {
        return res.status(409).json({ success: false, message: 'Tidak ada data yang diubah karena isi manifest belum valid.', updatedCount: 0, errors: errorMessages });
      }

      const client = await DbConnection.getClient();
      const db = await DbConnection.getDb();
      const changedAt = new Date();
      let updatedCount = 0;

      const runInSessionOrFallback = async (workFn) => {
        try {
          const session = client.startSession();
          try {
            await session.withTransaction(async () => {
              await workFn(session);
            });
          } finally {
            await session.endSession();
          }
        } catch (err) {
          if (err.message && err.message.includes('Transaction numbers are only allowed')) {
            await workFn(null);
          } else {
            throw err;
          }
        }
      };

      await runInSessionOrFallback(async (session) => {
        const sessionOpt = session ? { session } : {};
        const updateManifestRes = await db.collection('manifests').updateOne(
          { master_manifest_code, status_perjalanan: 'Transit' },
          { $set: { status_perjalanan: 'Arrived', updatedAt: changedAt } },
          sessionOpt
        );

        if (updateManifestRes.matchedCount === 0) {
          throw new Error('Manifest status_perjalanan bukan Transit atau manifest telah berubah.');
        }

        const operations = manifest.connote_codes.map(code => {
          const doc = connoteDocsMap.get(code);
          const prevState = doc ? (doc.connote?.connote_state || doc.connote_state || 'TRANSIT_SPP_BANDUNG') : 'TRANSIT_SPP_BANDUNG';
          return {
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
                    from_state: prevState,
                    to_state: 'TIBA_DI_SPP_TUJUAN',
                    from: prevState,
                    to: 'TIBA_DI_SPP_TUJUAN',
                    changedAt,
                    manifest_id: master_manifest_code
                  }
                }
              }
            }
          };
        });

        const updateResult = await db.collection('transaksi').bulkWrite(operations, sessionOpt);
        updatedCount = updateResult.matchedCount;

        if (updatedCount !== manifest.connote_codes.length) {
          throw new Error('Sebagian paket dalam manifest gagal diperbarui di database.');
        }
      });

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

  // ─── Real-Time Gate & Transit Pipeline Hub ──────────────────────────────────
  async getGatePipeline(req, res) {
    try {
      const db = await DbConnection.getDb();
      
      // 1. Fetch active/latest vehicle info
      const vehicles = await db.collection('master_kendaraan').find({ status: 'AKTIF' }).toArray();
      const vehicle = vehicles.find(v => v.nopol === 'B 9910 PCX') || vehicles[0] || {
        nopol: 'D 9021 AB',
        nama_kendaraan: 'Mitsubishi Canter Box',
        driver: 'Hendra Kusuma',
        assigned_route_id: 'Cimahi → Bandung SC (Main)'
      };

      // 2. Fetch all manifests to determine active manifest
      const manifests = await db.collection('manifests').find({}).sort({ createdAt: -1 }).limit(10).toArray();
      const activeManifest = manifests.find(m => m.status_perjalanan === 'Draft' || m.status_perjalanan === 'Transit') || manifests[0];

      // 3. Query all relevant transactions
      const allTx = await db.collection('transaksi').find({}).sort({ createdAt: -1, _id: -1 }).limit(100).toArray();

      // Normalize transaction item helper
      const formatItem = (t) => {
        const connote = t.connote_code || t.connote?.connote_code || String(t._id);
        const city = t.connote?.connote_receiver_city || t.destination_city || '';
        const destNopen = t.custom_field?.destination_nopen || t.location_data_created?.custom_field?.destination_nopen || t.destination_nopen || '40400';
        const destName = city ? `${city} (${destNopen})` : (t.connote?.connote_receiver_address || `SPP Bandung (${destNopen})`);
        const weightKg = Number(t.connote?.actual_weight || t.actual_weight || t.weight || 1.5);
        const service = t.connote?.connote_service || t.service || 'Pos Reguler';
        
        let timeStr = '08:00 WIB';
        const rawDate = t.connote?.created_at || t.createdAt || t.created_at;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
            }
          } catch (e) {
            timeStr = '08:00 WIB';
          }
        }

        const state = (t.connote?.connote_state || t.connote_state || 'DITERIMA_DI_CIMAHI').toUpperCase();

        return {
          connote,
          dest: destName,
          weight: `${weightKg.toFixed(1)} kg`,
          weightNum: weightKg,
          service,
          time: timeStr,
          state,
          manifest_id: t.manifest_id || null,
          sender: t.connote?.connote_sender_name || t.sender_name || 'KCU Cimahi',
          amount: t.connote?.connote_amount || 0
        };
      };

      const s1Items = [];
      const s2Items = [];
      const s3Items = [];

      allTx.forEach(t => {
        const item = formatItem(t);
        const state = item.state;

        if (state === 'DITERIMA_DI_CIMAHI' || state === 'ENTRY' || (!item.manifest_id && !['IN_MANIFEST', 'TRANSIT_SPP_BANDUNG', 'IN_TRANSIT', 'TIBA_DI_SPP_TUJUAN', 'DELIVERED'].includes(state))) {
          if (s1Items.length < 20) s1Items.push(item);
        } else if (state === 'IN_MANIFEST' || state === 'TRANSIT_SPP_BANDUNG' || state === 'IN_TRANSIT' || state === 'TRANSIT' || state === 'LOADED') {
          if (s2Items.length < 20) s2Items.push(item);
        } else if (state === 'TIBA_DI_SPP_TUJUAN' || state === 'ARRIVED' || state === 'DELIVERED' || state === 'TERKIRIM') {
          if (s3Items.length < 20) s3Items.push(item);
        } else {
          if (s1Items.length < 20) s1Items.push(item);
        }
      });

      // If S1 is empty and no active pipeline items, seed top items into S1
      if (s1Items.length === 0 && s2Items.length === 0) {
        allTx.slice(0, 5).forEach(t => s1Items.push(formatItem(t)));
      }

      const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

      res.json({
        success: true,
        message: 'Real-time gate pipeline loaded from MongoDB database',
        data: {
          session: {
            dispatch_id: `TRP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-008`,
            date: todayStr,
            vehicle: `${vehicle.nopol} — ${vehicle.nama_kendaraan || 'Truk Box Canter'}`,
            driver: vehicle.driver || 'Hendra Kusuma',
            route: vehicle.assigned_route_id || 'Cimahi → Bandung SC (Main)',
            departure_time: '08:30 WIB'
          },
          active_manifest_code: activeManifest ? activeManifest.master_manifest_code : `MNFST-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-001`,
          active_manifest_status: activeManifest ? activeManifest.status_perjalanan : 'Draft',
          stage1_items: s1Items,
          stage2_items: s2Items,
          stage3_items: s3Items,
          total_db_transactions: allTx.length,
          last_sync: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error loading gate pipeline:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── Reset Gate Pipeline In MongoDB ─────────────────────────────────────────
  async resetGatePipeline(req, res) {
    try {
      const db = await DbConnection.getDb();
      const col = db.collection('transaksi');
      
      // Reset top 15 records in MongoDB back to DITERIMA_DI_CIMAHI and unmanifested
      const sampleDocs = await col.find({}).sort({ createdAt: -1 }).limit(15).toArray();
      const ids = sampleDocs.map(d => d._id);

      if (ids.length > 0) {
        await col.updateMany(
          { _id: { $in: ids } },
          { 
            $set: { 
              connote_state: 'DITERIMA_DI_CIMAHI', 
              'connote.connote_state': 'DITERIMA_DI_CIMAHI',
              manifest_id: null,
              updatedAt: new Date()
            } 
          }
        );
      }

      res.json({
        success: true,
        message: `${ids.length} paket di database berhasil di-reset ke status DITERIMA_DI_CIMAHI untuk pengujian real-time.`,
        resetCount: ids.length
      });
    } catch (error) {
      console.error('Error resetting gate pipeline:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ManifestController();
