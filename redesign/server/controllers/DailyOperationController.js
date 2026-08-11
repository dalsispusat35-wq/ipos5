import DbConnection from '../config/DbConnection.js';

class DailyOperationController {
  // Middleware check for Dev or Admin access
  requireDevOrAdmin(req, res, next) {
    const isDevEnv = process.env.NODE_ENV !== 'production';
    const isDevQuery = req.query.dev === 'true' || req.query.dev === '1';
    const hasDevHeader = req.headers['x-dev-access'] === 'true' || req.headers['x-dev-access'] === '1';
    const isAdminUser = req.user?.role === 'admin' || req.user?.isAdmin === true;
    const processDevKey = process.env.PROCESS_DEV_KEY;
    const hasSecretKey = processDevKey && req.headers['x-dev-secret'] === processDevKey;

    if (isDevEnv || isDevQuery || hasDevHeader || isAdminUser || hasSecretKey) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ACCESS',
      message: 'Akses ditolak. Fitur CSV Import Daily Operation hanya diizinkan untuk lingkungan Non-Production atau Pengguna Admin/QA.'
    });
  }

  async importCsv(req, res) {
    try {
      const db = await DbConnection.getDb();
      const csvText = req.body.csv || req.body.csvText || '';

      if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Data CSV kosong atau tidak valid.'
        });
      }

      // Generate unique import batch ID
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const importBatchId = `BATCH-${timestamp}-${randHex}`;

      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length <= 1) {
        return res.status(400).json({
          success: false,
          message: 'CSV harus memiliki header dan minimal 1 baris data.'
        });
      }

      // Parse Header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const colIdx = {
        connote: headers.indexOf('connote'),
        office_code: headers.indexOf('office_code'),
        office_name: headers.indexOf('office_name'),
        event_type: headers.indexOf('event_type'),
        event_datetime: headers.indexOf('event_datetime'),
        weight_kg: headers.indexOf('weight_kg'),
        origin_office: headers.indexOf('origin_office'),
        destination_office: headers.indexOf('destination_office'),
        route_code: headers.indexOf('route_code'),
        vehicle_code: headers.indexOf('vehicle_code'),
        stop_sequence: headers.indexOf('stop_sequence'),
        stop_office: headers.indexOf('stop_office')
      };

      if (colIdx.connote === -1 || colIdx.event_type === -1 || colIdx.event_datetime === -1) {
        return res.status(400).json({
          success: false,
          message: 'Header CSV tidak valid. Kolom wajib: connote, event_type, event_datetime, weight_kg.'
        });
      }

      const errors = [];
      const validRows = [];
      const datesCoveredSet = new Set();
      const officesCoveredSet = new Set();
      const connoteSet = new Set();

      // Line-by-line validation
      for (let i = 1; i < lines.length; i++) {
        const lineStr = lines[i].trim();
        if (!lineStr) continue;

        const cells = lineStr.split(',').map(c => c.trim());
        const getCell = (colKey) => colIdx[colKey] !== -1 ? (cells[colIdx[colKey]] || '') : '';

        const connote = getCell('connote');
        const eventType = getCell('event_type').toUpperCase();
        const eventDatetimeStr = getCell('event_datetime');
        const weightKgStr = getCell('weight_kg');
        const officeCode = getCell('office_code');
        const officeName = getCell('office_name') || `KANTOR ${officeCode}`;
        const originOffice = getCell('origin_office');
        const destOffice = getCell('destination_office');
        const routeCode = getCell('route_code') || 'RT-MALAM-B9910-PCX';
        const vehicleCode = getCell('vehicle_code') || 'B 9910 PCX';
        const stopSeq = parseInt(getCell('stop_sequence') || '1', 10);
        const stopOffice = getCell('stop_office') || officeCode;

        // Validation checks
        if (!connote) {
          errors.push({ line: i + 1, column: 'connote', value: connote, reason: 'Nomor connote/resi tidak boleh kosong.' });
          continue;
        }

        if (!eventType) {
          errors.push({ line: i + 1, column: 'event_type', value: eventType, reason: 'Tipe event tidak boleh kosong.' });
          continue;
        }

        const dt = new Date(eventDatetimeStr);
        if (isNaN(dt.getTime())) {
          errors.push({ line: i + 1, column: 'event_datetime', value: eventDatetimeStr, reason: 'Format tanggal/waktu tidak valid.' });
          continue;
        }

        const weightKg = parseFloat(weightKgStr || '1.0');
        if (isNaN(weightKg) || weightKg <= 0) {
          errors.push({ line: i + 1, column: 'weight_kg', value: weightKgStr, reason: 'Berat paket harus bernilai angka positif > 0.' });
          continue;
        }

        const dateOnlyStr = dt.toISOString().slice(0, 10);
        datesCoveredSet.add(dateOnlyStr);
        if (officeCode) officesCoveredSet.add(officeCode);
        connoteSet.add(connote);

        validRows.push({
          line: i + 1,
          connote,
          officeCode,
          officeName,
          eventType,
          eventDatetime: dt,
          dateOnlyStr,
          weightKg,
          originOffice,
          destOffice,
          routeCode,
          vehicleCode,
          stopSeq: isNaN(stopSeq) ? 1 : stopSeq,
          stopOffice
        });
      }

      // Process Partial Import for Valid Rows
      let processedEventsCount = 0;
      const affectedJourneysMap = new Map(); // key: `${routeCode}_${vehicleCode}_${dateOnlyStr}`

      for (const row of validRows) {
        // 1. Auto-create master_kantor if missing
        if (row.officeCode) {
          await db.collection('master_kantor').updateOne(
            { nopend: row.officeCode },
            {
              $setOnInsert: {
                nopend: row.officeCode,
                nama_nopend: row.officeName,
                tipe: 'KCP',
                status: 'AKTIF',
                is_seed_data: true,
                source: 'CSV_IMPORT'
              }
            },
            { upsert: true }
          );
        }

        // 2. Auto-create master_kendaraan if missing
        if (row.vehicleCode) {
          await db.collection('master_kendaraan').updateOne(
            { nopol: row.vehicleCode },
            {
              $setOnInsert: {
                nopol: row.vehicleCode,
                jenis: 'Grand Max Blind Van',
                kapasitas_kg: 1500,
                max_capacity_kg: 1500,
                status: 'AKTIF',
                is_seed_data: true,
                source: 'CSV_IMPORT'
              }
            },
            { upsert: true }
          );
        }

        // 3. Auto-create detail_route stop if missing
        if (row.routeCode && row.stopSeq) {
          await db.collection('detail_route').updateOne(
            { route_id: row.routeCode, seq: row.stopSeq },
            {
              $setOnInsert: {
                route_id: row.routeCode,
                seq: row.stopSeq,
                asal_nopen: row.stopOffice || row.officeCode,
                asal_nama: row.officeName,
                tujuan_nopen: row.destOffice || row.stopOffice || row.officeCode,
                tujuan_nama: row.destOffice ? `KANTOR ${row.destOffice}` : row.officeName,
                status: 'AKTIF',
                is_seed_data: true,
                source: 'CSV_IMPORT'
              }
            },
            { upsert: true }
          );
        }

        // 4. Idempotent Upsert into tracking_events (Unique event_id)
        const eventId = `${row.connote}_${row.eventType}_${row.eventDatetime.toISOString()}_${row.officeCode}`;
        const trackingEventDoc = {
          event_id: eventId,
          connote_code: row.connote,
          event_type: row.eventType,
          event_datetime: row.eventDatetime,
          office_code: row.officeCode,
          office_name: row.officeName,
          route_code: row.routeCode,
          vehicle_code: row.vehicleCode,
          stop_sequence: row.stopSeq,
          weight_kg: row.weightKg,
          origin_office: row.originOffice,
          destination_office: row.destOffice,
          import_batch_id: importBatchId,
          source: 'CSV_IMPORT',
          createdAt: new Date()
        };

        const upsertRes = await db.collection('tracking_events').updateOne(
          { event_id: eventId },
          { $set: trackingEventDoc },
          { upsert: true }
        );
        if (upsertRes.upsertedCount > 0 || upsertRes.modifiedCount > 0) {
          processedEventsCount++;
        }

        // 5. Upsert Transaksi & append tracking_history
        const historyItem = {
          stage: row.eventType,
          note: `Event ${row.eventType} tercatat via CSV Import di ${row.officeName}`,
          time: row.eventDatetime.toISOString(),
          location: row.officeCode
        };

        await db.collection('transaksi').updateOne(
          { connote_code: row.connote },
          {
            $set: {
              connote_code: row.connote,
              actual_weight: row.weightKg,
              connote_state: row.eventType,
              location_name: row.officeName,
              import_batch_id: importBatchId,
              updatedAt: new Date()
            },
            $setOnInsert: {
              connote_booking_code: `BK-${row.connote.slice(-6)}`,
              connote_service: 'Pos Reguler',
              connote_sender_name: 'Pengirim POS',
              connote_receiver_name: 'Penerima POS',
              createdAt: row.eventDatetime,
              is_seed_data: true,
              location_data_created: {
                custom_field: {
                  destination_nopen: row.destOffice,
                  origin_nopen: row.originOffice
                }
              }
            },
            $addToSet: { tracking_history: historyItem }
          },
          { upsert: true }
        );

        // Record journey target for batch recomputation
        const jKey = `${row.routeCode}__${row.vehicleCode}__${row.dateOnlyStr}`;
        affectedJourneysMap.set(jKey, {
          routeCode: row.routeCode,
          vehicleCode: row.vehicleCode,
          dateOnlyStr: row.dateOnlyStr
        });
      }

      // Recompute derived current_load_kg and current_stop_seq for all affected journeys
      for (const jInfo of affectedJourneysMap.values()) {
        await this.recomputeJourneyState(db, jInfo.routeCode, jInfo.vehicleCode, jInfo.dateOnlyStr, importBatchId);
      }

      return res.json({
        success: true,
        message: `Import CSV selesai. ${validRows.length} event berhasil diproses (${errors.length} baris ditolak/error).`,
        summary: {
          import_batch_id: importBatchId,
          totalLines: lines.length - 1,
          processedLines: validRows.length,
          errorLines: errors.length,
          packagesCount: connoteSet.size,
          eventsCount: processedEventsCount,
          datesCovered: Array.from(datesCoveredSet),
          officesCovered: Array.from(officesCoveredSet)
        },
        errors
      });
    } catch (error) {
      console.error('DailyOperationController importCsv Error:', error);
      return res.status(500).json({
        success: false,
        error: 'IMPORT_FAILED',
        message: `Gagal memproses import CSV: ${error.message}`
      });
    }
  }

  // Recompute derived load & stop sequence for a journey on a date
  async recomputeJourneyState(db, routeCode, vehicleCode, dateOnlyStr, importBatchId) {
    const journeyId = `JRN-${dateOnlyStr.replace(/-/g, '')}-${vehicleCode.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-001`;

    const startDate = new Date(dateOnlyStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateOnlyStr);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all tracking_events for this route & vehicle on date
    const events = await db.collection('tracking_events').find({
      vehicle_code: vehicleCode,
      event_datetime: { $gte: startDate, $lte: endDate }
    }).sort({ event_datetime: 1 }).toArray();

    // Recompute current cargo and current_stop_seq according to rules:
    // Rule: Before 1st ARRIVED -> current_stop_seq = 1. ARRIVED/DELIVERED at stop N -> current_stop_seq = N. LOADED/UNLOADED does not shift sequence.
    const cargoMap = new Map(); // connote -> weight
    let currentStopSeq = 1;
    let currentStatus = 'IN_PROGRESS';

    for (const ev of events) {
      const type = (ev.event_type || '').toUpperCase();
      if (type === 'LOADED' || type === 'IN_TRANSIT') {
        cargoMap.set(ev.connote_code, {
          connote_code: ev.connote_code,
          weight_kg: ev.weight_kg || 1.0,
          origin_nopen: ev.origin_office || ev.office_code,
          destination_nopen: ev.destination_office || '-'
        });
      } else if (type === 'UNLOADED' || type === 'DELIVERED') {
        cargoMap.delete(ev.connote_code);
      }

      if (type === 'ARRIVED' || type === 'DELIVERED') {
        if (ev.stop_sequence && ev.stop_sequence > 0) {
          currentStopSeq = Math.max(currentStopSeq, ev.stop_sequence);
        }
      }
    }

    const cargo = Array.from(cargoMap.values());
    const derivedLoadKg = cargo.reduce((sum, item) => sum + (item.weight_kg || 0), 0);

    // Check vehicle max capacity
    const vehicleDoc = await db.collection('master_kendaraan').findOne({ nopol: vehicleCode });
    const maxCapacityKg = vehicleDoc?.kapasitas_kg || vehicleDoc?.max_capacity_kg || 1500;

    const journeyDoc = {
      journey_id: journeyId,
      route_id: routeCode,
      vehicle_nopol: vehicleCode,
      resolved_vehicle_nopol: vehicleCode,
      journey_date: startDate,
      shift: 'MALAM',
      status: currentStatus,
      current_stop_seq: currentStopSeq,
      maximum_capacity_kg: maxCapacityKg,
      current_load_kg: derivedLoadKg,
      cargo,
      import_batch_id: importBatchId,
      updatedAt: new Date()
    };

    await db.collection('route_journeys').updateOne(
      { journey_id: journeyId },
      { $set: journeyDoc },
      { upsert: true }
    );
  }

  // Rollback/delete an import batch
  async deleteBatch(req, res) {
    try {
      const db = await DbConnection.getDb();
      const { batchId } = req.params;

      if (!batchId) {
        return res.status(400).json({ success: false, message: 'Parameter batchId diperlukan.' });
      }

      // Delete tracking_events
      const delEvents = await db.collection('tracking_events').deleteMany({ import_batch_id: batchId });
      
      // Delete transaksi created by this batch
      const delTx = await db.collection('transaksi').deleteMany({ import_batch_id: batchId });

      // Clean up seed master data created by this batch
      await db.collection('master_kantor').deleteMany({ source: 'CSV_IMPORT', import_batch_id: batchId });
      await db.collection('master_kendaraan').deleteMany({ source: 'CSV_IMPORT', import_batch_id: batchId });
      await db.collection('detail_route').deleteMany({ source: 'CSV_IMPORT', import_batch_id: batchId });

      // Clean up route_journeys created by this batch
      await db.collection('route_journeys').deleteMany({ import_batch_id: batchId });

      return res.json({
        success: true,
        message: `Batch import "${batchId}" berhasil dihapus. (${delEvents.deletedCount} tracking events, ${delTx.deletedCount} transaksi dihapus).`
      });
    } catch (error) {
      console.error('DailyOperationController deleteBatch Error:', error);
      return res.status(500).json({
        success: false,
        error: 'DELETE_BATCH_FAILED',
        message: `Gagal menghapus batch import: ${error.message}`
      });
    }
  }
}

export default new DailyOperationController();
