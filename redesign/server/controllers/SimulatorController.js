import DbConnection from '../config/DbConnection.js';
import PackageTrackingService from '../services/PackageTrackingService.js';

const INDONESIAN_SENDERS = [
  { name: 'Budi Santoso', origin: 'Toko Berkah Elektronik Cimahi', phone: '0812-3456-7890' },
  { name: 'Siti Rahmawati', origin: 'Az-Zahra Hijab & Busana Bandung', phone: '0813-9876-5432' },
  { name: 'Dedi Mulyadi', origin: 'Batik Priangan Express', phone: '0857-1122-3344' },
  { name: 'Rizky Firmansyah', origin: 'Distro Bandung Heritage', phone: '0819-5566-7788' },
  { name: 'Dewi Lestari', origin: 'Sentra Rajut Melong Asri', phone: '0821-4433-2211' },
  { name: 'Ahmad Hidayat', origin: 'Kopi Sangkuriang Roastery', phone: '0812-7788-9900' },
  { name: 'Anisa Putri', origin: 'Glow Skincare Herbal Bandung', phone: '0856-3344-5566' },
  { name: 'Hendra Gunawan', origin: 'Sentra Sparepart Cimindi', phone: '0878-9900-1122' },
  { name: 'Linda Kusuma', origin: 'Bordir Srikandi Cipageran', phone: '0813-2233-4455' },
  { name: 'Fajar Ramadhan', origin: 'Penerbit Dago Book Store', phone: '0852-6677-8899' },
  { name: 'Rina Marlina', origin: 'Keripik Tempe Cisangkan', phone: '0818-0011-2233' },
  { name: 'Yudi Prasetyo', origin: 'Cibaduyut Leather Craft', phone: '0822-5566-7788' },
  { name: 'Mega Permata', origin: 'Konveksi Bandung Creative', phone: '0812-8899-0011' },
  { name: 'Dimas Aditya', origin: 'Surya Jaya Gadget Store', phone: '0857-4455-6677' },
  { name: 'Sri Wahyuni', origin: 'Oleh-Oleh Priangan Cihapit', phone: '0813-1122-3344' },
  { name: 'Agus Setiawan', origin: 'Percetakan & ATK Sangkuriang', phone: '0877-3344-5566' },
  { name: 'Maya Anggraini', origin: 'Tas Rajut Etnik Bandung', phone: '0821-6677-8899' },
  { name: 'Eka Saputra', origin: 'Ethalase Nisrazka Craft', phone: '0856-7788-9900' }
];

const INDONESIAN_RECEIVERS_NATIONAL = [
  { name: 'Anisa Rahmawati', address: 'Jl. Malioboro No. 45, Danurejan', city: 'Kota Yogyakarta', province: 'DI Yogyakarta', postal: '55213' },
  { name: 'Bambang Sudiro', address: 'Jl. Pemuda No. 12, Sekayu, Semarang Tengah', city: 'Kota Semarang', province: 'Jawa Tengah', postal: '50132' },
  { name: 'Dewi Lestari', address: 'Jl. Jenderal Sudirman No. 88, Senayan', city: 'Jakarta Selatan', province: 'DKI Jakarta', postal: '12190' },
  { name: 'Rizky Pratama', address: 'Jl. Tunjungan No. 24, Genteng', city: 'Kota Surabaya', province: 'Jawa Timur', postal: '60275' },
  { name: 'Nurul Hidayah', address: 'Jl. Gajah Mada No. 10, Denpasar Barat', city: 'Kota Denpasar', province: 'Bali', postal: '80112' },
  { name: 'Ahmad Fauzi', address: 'Jl. Ahmad Yani No. 50, Medan Barat', city: 'Kota Medan', province: 'Sumatera Utara', postal: '20111' },
  { name: 'Dian Anggraini', address: 'Jl. Urip Sumoharjo No. 77, Panakkukang', city: 'Kota Makassar', province: 'Sulawesi Selatan', postal: '90232' },
  { name: 'Eko Prasetyo', address: 'Jl. Pahlawan No. 15, Klojen', city: 'Kota Malang', province: 'Jawa Timur', postal: '65111' },
  { name: 'Maya Safitri', address: 'Jl. R.E. Martadinata No. 30, Cipedes', city: 'Kota Tasikmalaya', province: 'Jawa Barat', postal: '46112' },
  { name: 'Hendra Saputra', address: 'Jl. Jenderal Sudirman No. 5, Ilir Timur I', city: 'Kota Palembang', province: 'Sumatera Selatan', postal: '30126' },
  { name: 'Farhan Maulana', address: 'Jl. Siliwangi No. 18, Kejaksan', city: 'Kota Cirebon', province: 'Jawa Barat', postal: '45121' },
  { name: 'Citra Kirana', address: 'Jl. Diponegoro No. 33, Banjarsari', city: 'Kota Surakarta', province: 'Jawa Tengah', postal: '57115' },
  { name: 'Agus Setiawan', address: 'Jl. Veteran No. 8, Padang Barat', city: 'Kota Padang', province: 'Sumatera Barat', postal: '25115' },
  { name: 'Putri Handayani', address: 'Jl. Gatot Subroto No. 40, Banjarmasin Timur', city: 'Kota Banjarmasin', province: 'Kalimantan Selatan', postal: '70235' },
  { name: 'Bayu Wicaksono', address: 'Jl. Jenderal Sudirman No. 102, Klandasan Ulu', city: 'Kota Balikpapan', province: 'Kalimantan Timur', postal: '76112' },
  { name: 'Ratna Sari', address: 'Jl. Diponegoro No. 65, Telukbetung Utara', city: 'Kota Bandar Lampung', province: 'Lampung', postal: '35214' },
  { name: 'Fikri Ramadhan', address: 'Jl. Sam Ratulangi No. 42, Wenang', city: 'Kota Manado', province: 'Sulawesi Utara', postal: '95111' },
  { name: 'Indah Permatasari', address: 'Jl. Slamet Riyadi No. 90, Telanaipura', city: 'Kota Jambi', province: 'Jambi', postal: '36122' },
  { name: 'Kevin Sanjaya', address: 'Jl. Gajah Mada No. 80, Pontianak Selatan', city: 'Kota Pontianak', province: 'Kalimantan Barat', postal: '78121' },
  { name: 'Nadya Amanda', address: 'Jl. WR. Supratman No. 25, Mataram Timur', city: 'Kota Mataram', province: 'Nusa Tenggara Barat', postal: '83121' },
  { name: 'Arif Rahman', address: 'Jl. Sudirman No. 14, Sukajadi', city: 'Kota Pekanbaru', province: 'Riau', postal: '28111' },
  { name: 'Tiara Lestari', address: 'Jl. Teuku Umar No. 55, Baiturrahman', city: 'Kota Banda Aceh', province: 'Aceh', postal: '23242' },
  { name: 'Wulan Guritno', address: 'Jl. Ir. H. Juanda No. 120, Dago', city: 'Kota Bandung', province: 'Jawa Barat', postal: '40135' },
  { name: 'Gilang Dirga', address: 'Jl. Kolonel Masturi No. 85, Cipageran', city: 'Kota Cimahi', province: 'Jawa Barat', postal: '40511' }
];

const SAMPLE_CONTENTS = [
  'Pakaian & Tekstil Fashion', 'Produk Skincare & Herbal', 'Aksesoris Gadget & Elektronik',
  'Camilan & Makanan Kering Khas', 'Buku, Dokumen & Cetakan', 'Kerajinan Tangan Souvenir',
  'Sepatu & Sandal Kulit', 'Sparepart Motor & Perkakas', 'Bordir & Mukena Tasik', 'Kopi Robusta Sangkuriang'
];

const FLEET_VEHICLES = [
  { nopol: 'B 9910 PCX', route_id: 'RT-B9910-CIMAHI-RAYA', stops: ['40511A', '40511CB', '40511U3', '40511CA', '40511U1', '40511U4'] },
  { nopol: 'D 8812 AB', route_id: 'RT-D8812-BARAT-UTARA', stops: ['40512', '40511A', '40116A', '40115B', '40135', '40141C3'] },
  { nopol: 'B 9945 PCY', route_id: 'RT-B9945-TIMUR-PUSAT', stops: ['40000', '40114A', '40115A', '40122B', '40123A', '40100'] }
];

class SimulatorController {
  getWibDateStr(inputDate) {
    if (inputDate) {
      const d = new Date(inputDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
      }
    }
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  }

  async getStats(req, res) {
    try {
      const dateStr = this.getWibDateStr(req.query.date);
      const db = await DbConnection.getDb();
      const fleetData = await PackageTrackingService.getFleetList(dateStr);
      
      const startDate = new Date(`${dateStr}T00:00:00.000+07:00`);
      const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);

      const totalTransactions = await db.collection('transaksi').countDocuments({
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { 'connote.created_at': { $regex: dateStr } },
          { created_at: { $regex: dateStr } }
        ]
      });

      const recentInjected = await db.collection('transaksi')
        .find({
          $or: [
            { createdAt: { $gte: startDate, $lte: endDate } },
            { 'connote.created_at': { $regex: dateStr } },
            { created_at: { $regex: dateStr } }
          ]
        })
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .toArray();

      return res.json({
        success: true,
        data: {
          operational_date: dateStr,
          total_transactions: totalTransactions,
          fleet: fleetData.fleet || [],
          recent_injected: recentInjected.map(t => ({
            connote_code: t.connote_code || t.connote?.connote_code,
            weight_kg: t.connote?.actual_weight || t.actual_weight || 1.0,
            service: t.connote?.connote_service || 'Pos Nextday',
            origin_name: t.location_data_created?.location_name || t.origin_name || 'Kantor Pos',
            destination_name: t.connote?.connote_receiver_city ? `${t.connote.connote_receiver_name} (${t.connote.connote_receiver_city})` : (t.connote?.connote_receiver_name || 'SPP Bandung (40400)'),
            vehicle_nopol: t.custom_field?.vehicle_nopol || '-',
            state: t.connote?.connote_state || 'IN_TRANSIT',
            created_at: t.connote?.created_at || t.createdAt
          }))
        }
      });
    } catch (error) {
      console.error('Error in SimulatorController.getStats:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOptions(req, res) {
    try {
      const db = await DbConnection.getDb();
      const offices = await db.collection('master_kantor')
        .find({ status: 'AKTIF' })
        .sort({ is_real_verified: -1, priority: 1, nopend: 1 })
        .toArray();

      const vehicles = await db.collection('master_kendaraan')
        .find({ status: 'AKTIF' })
        .sort({ nopol: 1 })
        .toArray();

      return res.json({
        success: true,
        data: {
          offices: offices.map(o => ({
            nopend: o.nopend,
            nama: o.nama_nopend || o.nama_kantor,
            tipe: o.tipe_kantor || o.tipe,
            alamat: o.alamat,
            kecamatan: o.kecamatan
          })),
          vehicles: vehicles.map(v => ({
            nopol: v.nopol,
            nama: v.nama_kendaraan,
            max_capacity_kg: v.max_capacity_kg || 1500,
            assigned_route_id: v.assigned_route_id || v.rute_utama,
            driver: v.driver || v.driver_utama?.nama
          }))
        }
      });
    } catch (error) {
      console.error('Error in SimulatorController.getOptions:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  getOfficeAssignment(nopend, targetNopol) {
    if (targetNopol && ['B 9910 PCX', 'D 8812 AB', 'B 9945 PCY'].includes(targetNopol)) {
      const fleet = FLEET_VEHICLES.find(f => f.nopol === targetNopol) || FLEET_VEHICLES[0];
      const stopIndex = fleet.stops.indexOf(nopend);
      const seq = stopIndex >= 0 ? stopIndex + 1 : Math.floor(1 + Math.random() * 6);
      return { nopol: fleet.nopol, route_id: fleet.route_id, loaded_at_seq: seq, total_stops: 7 };
    }

    for (const fleet of FLEET_VEHICLES) {
      const idx = fleet.stops.indexOf(nopend);
      if (idx >= 0) {
        return { nopol: fleet.nopol, route_id: fleet.route_id, loaded_at_seq: idx + 1, total_stops: 7 };
      }
    }

    const randomFleet = FLEET_VEHICLES[Math.floor(Math.random() * FLEET_VEHICLES.length)];
    return { nopol: randomFleet.nopol, route_id: randomFleet.route_id, loaded_at_seq: Math.floor(1 + Math.random() * 6), total_stops: 7 };
  }

  async injectBulk(req, res) {
    try {
      const {
        count = 5,
        target_date,
        target_nopol,
        origin_nopen,
        destination_mode = 'RANDOM_NATIONAL', // 'RANDOM_NATIONAL', 'SPP_BANDUNG', 'JABODETABEK', 'JAWA_BALI', 'LUAR_JAWA'
        weight_range = 'MEDIUM',
        service = 'Pos Nextday'
      } = req.body;

      const dateStr = this.getWibDateStr(target_date);
      const db = await DbConnection.getDb();
      const numToInject = Math.min(Math.max(1, parseInt(count, 10) || 1), 200);

      let offices = await db.collection('master_kantor')
        .find({ status: 'AKTIF', is_real_verified: true, nopend: { $ne: '40400' } })
        .toArray();

      if (!offices || offices.length === 0) {
        offices = await db.collection('master_kantor')
          .find({ status: 'AKTIF', nopend: { $ne: '40400' } })
          .limit(50)
          .toArray();
      }

      const officeMap = new Map();
      offices.forEach(o => officeMap.set(o.nopend, o));

      const cleanDateCompact = dateStr.replace(/-/g, '').slice(2);
      const startDate = new Date(`${dateStr}T08:00:00.000+07:00`);
      const injectedConnotes = [];
      const txBulkOps = [];
      const evtBulkOps = [];
      const journeysToUpdate = new Map();

      const SERVICE_POOL = ['Pos Nextday', 'Pos Reguler', 'Pos Sameday', 'Pos Jumbo Cargo'];

      for (let i = 0; i < numToInject; i++) {
        // 1. Pick Origin Office
        let selectedOffice;
        if (origin_nopen && officeMap.has(origin_nopen)) {
          selectedOffice = officeMap.get(origin_nopen);
        } else {
          selectedOffice = offices[Math.floor(Math.random() * offices.length)] || offices[0];
        }

        // 2. Pick Vehicle Assignment
        const assignment = this.getOfficeAssignment(selectedOffice.nopend, target_nopol);

        // 3. Resolve Service (Support RANDOM / Acak Merata)
        let chosenService = service;
        if (!chosenService || chosenService === 'RANDOM' || chosenService === 'ACAK' || chosenService === 'ALL') {
          chosenService = SERVICE_POOL[i % SERVICE_POOL.length];
        }

        // 4. Generate Weight & Amount based on chosen service & weight range
        let weightKg = 2.5;
        let amount = 15000;

        if (chosenService === 'Pos Jumbo Cargo') {
          weightKg = Number((12.0 + Math.random() * 28.0).toFixed(1));
          amount = 45000 + Math.round(weightKg * 4500);
        } else if (chosenService === 'Pos Sameday') {
          weightKg = weight_range === 'LIGHT' ? Number((0.5 + Math.random() * 1.5).toFixed(1)) : Number((1.0 + Math.random() * 3.5).toFixed(1));
          amount = 25000 + Math.round(weightKg * 14000);
        } else if (chosenService === 'Pos Nextday') {
          weightKg = weight_range === 'LIGHT' ? Number((0.4 + Math.random() * 1.6).toFixed(1)) : (weight_range === 'HEAVY' ? Number((8.0 + Math.random() * 12.0).toFixed(1)) : Number((1.0 + Math.random() * 4.0).toFixed(1)));
          amount = 18000 + Math.round(weightKg * 11000);
        } else {
          // Pos Reguler
          weightKg = weight_range === 'LIGHT' ? Number((0.5 + Math.random() * 2.0).toFixed(1)) : (weight_range === 'HEAVY' ? Number((10.0 + Math.random() * 15.0).toFixed(1)) : Number((1.5 + Math.random() * 6.0).toFixed(1)));
          amount = 10000 + Math.round(weightKg * 8000);
        }

        // 5. Generate Random Indonesian Individual Sender & Customer Receiver
        const senderObj = INDONESIAN_SENDERS[Math.floor(Math.random() * INDONESIAN_SENDERS.length)];
        const receiverObj = INDONESIAN_RECEIVERS_NATIONAL[Math.floor(Math.random() * INDONESIAN_RECEIVERS_NATIONAL.length)];
        const contentDesc = SAMPLE_CONTENTS[Math.floor(Math.random() * SAMPLE_CONTENTS.length)];

        const randHex = Math.floor(100000 + Math.random() * 900000);
        const connoteCode = `P${cleanDateCompact}${randHex}`;
        const bookingCode = `BK-POS-${randHex}`;

        const senderName = `${senderObj.name} (${senderObj.origin})`;
        const receiverName = receiverObj.name;
        const receiverAddr = `${receiverObj.address}, ${receiverObj.city}, ${receiverObj.province} ${receiverObj.postal}`;

        const pad = (n) => String(n).padStart(2, '0');
        const hour = pad(Math.floor(8 + Math.random() * 12));
        const minute = pad(Math.floor(Math.random() * 60));
        const second = pad(Math.floor(Math.random() * 60));
        const standardTimeStr = `${hour}:${minute}:${second}`;
        const exactDateObj = new Date(`${dateStr}T${standardTimeStr}+07:00`);

        // 6. Create Cargo Item
        const cargoItem = {
          connote_code: connoteCode,
          weight_kg: weightKg,
          origin_nopen: selectedOffice.nopend,
          origin_name: selectedOffice.nama_nopend || selectedOffice.nama_kantor,
          destination_nopen: '40400',
          destination_name: 'SPP Bandung (Sorting Hub)',
          final_destination_city: receiverObj.city,
          final_destination_address: receiverAddr,
          loaded_at_seq: assignment.loaded_at_seq,
          unloaded_at_seq: assignment.total_stops,
          sender_name: senderName,
          receiver_name: receiverName,
          content: contentDesc
        };

        // 7. Push to Transaksi Bulk Ops
        const txDoc = {
          connote_code: connoteCode,
          connote: {
            connote_code: connoteCode,
            connote_booking_code: bookingCode,
            connote_service: chosenService,
            connote_amount: amount,
            actual_weight: weightKg,
            connote_state: 'IN_TRANSIT',
            connote_sender_name: senderName,
            connote_sender_phone: senderObj.phone,
            connote_receiver_name: receiverName,
            connote_receiver_address: receiverAddr,
            connote_receiver_city: receiverObj.city,
            connote_receiver_province: receiverObj.province,
            connote_receiver_postal: receiverObj.postal,
            content_description: contentDesc,
            assigned_vehicle: assignment.nopol,
            created_at: `${dateStr} ${standardTimeStr}`
          },
          location_data_created: {
            location_name: cargoItem.origin_name,
            custom_field: {
              nopen: selectedOffice.nopend,
              destination_nopen: '40400',
              destination_city: receiverObj.city
            }
          },
          custom_field: {
            origin_nopen: selectedOffice.nopend,
            destination_nopen: '40400',
            vehicle_nopol: assignment.nopol,
            route_id: assignment.route_id,
            destination_city: receiverObj.city
          },
          assigned_vehicle: assignment.nopol,
          vehicle_nopol: assignment.nopol,
          createdAt: exactDateObj,
          updatedAt: exactDateObj
        };

        txBulkOps.push({
          replaceOne: {
            filter: { connote_code: connoteCode },
            replacement: txDoc,
            upsert: true
          }
        });

        // 8. Push to Tracking Events Bulk Ops
        const evt1 = {
          event_id: `EVT-${connoteCode}-01`,
          connote_code: connoteCode,
          event_type: 'POSTING_LOKET',
          office_code: selectedOffice.nopend,
          office_name: cargoItem.origin_name,
          vehicle_code: assignment.nopol,
          route_code: assignment.route_id,
          note: `Paket diterima di loket ${cargoItem.origin_name} dari pengirim ${senderName} tujuan ${receiverName} (${receiverObj.city}).`,
          event_datetime: exactDateObj
        };

        const evt2 = {
          event_id: `EVT-${connoteCode}-02`,
          connote_code: connoteCode,
          event_type: 'LOADED',
          office_code: selectedOffice.nopend,
          office_name: cargoItem.origin_name,
          vehicle_code: assignment.nopol,
          route_code: assignment.route_id,
          note: `Paket dimuat ke armada feeder ${assignment.nopol} (${assignment.route_id}) oleh Sopir untuk dibawa ke Hub Sentral SPP Bandung.`,
          event_datetime: exactDateObj
        };

        evtBulkOps.push({
          replaceOne: { filter: { event_id: evt1.event_id }, replacement: evt1, upsert: true }
        });
        evtBulkOps.push({
          replaceOne: { filter: { event_id: evt2.event_id }, replacement: evt2, upsert: true }
        });

        // 9. Accumulate Journey Update
        const cleanNopol = assignment.nopol.replace(/\s+/g, '');
        const journeyId = `JRN-${dateStr.replace(/-/g, '')}-${cleanNopol}-001`;
        if (!journeysToUpdate.has(journeyId)) {
          journeysToUpdate.set(journeyId, {
            journeyId,
            assignment,
            cargoItems: [],
            totalWeightKg: 0
          });
        }
        const jEntry = journeysToUpdate.get(journeyId);
        jEntry.cargoItems.push(cargoItem);
        jEntry.totalWeightKg += weightKg;

        injectedConnotes.push({
          connote_code: connoteCode,
          sender: senderName,
          receiver: receiverName,
          destination_city: receiverObj.city,
          origin: cargoItem.origin_name,
          vehicle: assignment.nopol,
          weight_kg: weightKg,
          service: chosenService,
          created_at: `${dateStr} ${standardTimeStr}`
        });
      }

      // Execute High-Speed Bulk Writes
      if (txBulkOps.length > 0) {
        await db.collection('transaksi').bulkWrite(txBulkOps, { ordered: false });
      }
      if (evtBulkOps.length > 0) {
        await db.collection('tracking_events').bulkWrite(evtBulkOps, { ordered: false });
      }

      // Update Journeys in Parallel
      const journeyPromises = Array.from(journeysToUpdate.values()).map(async (j) => {
        return db.collection('route_journeys').updateOne(
          { journey_id: j.journeyId },
          {
            $push: { cargo: { $each: j.cargoItems } },
            $inc: { current_load_kg: j.totalWeightKg },
            $setOnInsert: {
              journey_id: j.journeyId,
              vehicle_nopol: j.assignment.nopol,
              resolved_vehicle_nopol: j.assignment.nopol,
              route_id: j.assignment.route_id,
              shift: 'MALAM',
              status: 'IN_PROGRESS',
              current_stop_seq: j.assignment.loaded_at_seq,
              max_capacity_kg: j.assignment.nopol === 'D 8812 AB' ? 3500 : (j.assignment.nopol === 'B 9945 PCY' ? 4000 : 1500),
              maximum_capacity_kg: j.assignment.nopol === 'D 8812 AB' ? 3500 : (j.assignment.nopol === 'B 9945 PCY' ? 4000 : 1500),
              tanggal_operasional: dateStr,
              journey_date: startDate,
              version: 1,
              createdAt: startDate
            },
            $set: { updatedAt: new Date() }
          },
          { upsert: true }
        );
      });
      await Promise.all(journeyPromises);

      return res.json({
        success: true,
        message: `Berhasil menyuntikkan ${injectedConnotes.length} resi individu secara merata ke database MongoDB.`,
        data: {
          injected_count: injectedConnotes.length,
          operational_date: dateStr,
          connotes: injectedConnotes
        }
      });
    } catch (error) {
      console.error('Error in SimulatorController.injectBulk:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async injectSingle(req, res) {
    try {
      const {
        connote_code,
        target_date,
        target_nopol,
        origin_nopen,
        weight_kg = 2.5,
        service = 'Pos Nextday',
        sender_name,
        receiver_name
      } = req.body;

      const dateStr = this.getWibDateStr(target_date);
      const db = await DbConnection.getDb();
      const cleanDateCompact = dateStr.replace(/-/g, '').slice(2);

      const codeToUse = (connote_code && connote_code.trim())
        ? connote_code.trim().toUpperCase()
        : `P${cleanDateCompact}${Math.floor(100000 + Math.random() * 900000)}`;

      // Resolve office
      let selectedOffice;
      if (origin_nopen) {
        selectedOffice = await db.collection('master_kantor').findOne({ nopend: origin_nopen });
      }
      if (!selectedOffice) {
        const sampleOffices = await db.collection('master_kantor').find({ is_real_verified: true }).toArray();
        selectedOffice = sampleOffices[Math.floor(Math.random() * sampleOffices.length)] || { nopend: '40511A', nama_nopend: 'KCP Cimahicisangkan' };
      }

      // Resolve service
      const SERVICE_POOL = ['Pos Nextday', 'Pos Reguler', 'Pos Sameday', 'Pos Jumbo Cargo'];
      let chosenService = service;
      if (!chosenService || chosenService === 'RANDOM' || chosenService === 'ACAK' || chosenService === 'ALL') {
        chosenService = SERVICE_POOL[Math.floor(Math.random() * SERVICE_POOL.length)];
      }

      // Resolve vehicle & assignment
      const assignment = this.getOfficeAssignment(selectedOffice.nopend, target_nopol);
      const numWeight = parseFloat(weight_kg) || Number((1.5 + Math.random() * 4.5).toFixed(1));
      const pad = (n) => String(n).padStart(2, '0');
      const hour = pad(Math.floor(8 + Math.random() * 12));
      const minute = pad(Math.floor(Math.random() * 60));
      const second = pad(Math.floor(Math.random() * 60));
      const standardTimeStr = `${hour}:${minute}:${second}`;
      const exactDateObj = new Date(`${dateStr}T${standardTimeStr}+07:00`);
      const startDate = new Date(`${dateStr}T08:00:00.000+07:00`);

      // Random Indonesian Customer if not provided
      const senderObj = INDONESIAN_SENDERS[Math.floor(Math.random() * INDONESIAN_SENDERS.length)];
      const receiverObj = INDONESIAN_RECEIVERS_NATIONAL[Math.floor(Math.random() * INDONESIAN_RECEIVERS_NATIONAL.length)];
      const contentDesc = SAMPLE_CONTENTS[Math.floor(Math.random() * SAMPLE_CONTENTS.length)];

      const finalSender = sender_name || `${senderObj.name} (${senderObj.origin})`;
      const finalReceiver = receiver_name || receiverObj.name;
      const finalAddress = `${receiverObj.address}, ${receiverObj.city}, ${receiverObj.province} ${receiverObj.postal}`;

      const cargoItem = {
        connote_code: codeToUse,
        weight_kg: numWeight,
        origin_nopen: selectedOffice.nopend,
        origin_name: selectedOffice.nama_nopend || selectedOffice.nama_kantor,
        destination_nopen: '40400',
        destination_name: 'SPP Bandung (Sorting Hub)',
        final_destination_city: receiverObj.city,
        final_destination_address: finalAddress,
        loaded_at_seq: assignment.loaded_at_seq,
        unloaded_at_seq: assignment.total_stops,
        sender_name: finalSender,
        receiver_name: finalReceiver,
        content: contentDesc
      };

      // 1. Upsert transaksi
      const txDoc = {
        connote_code: codeToUse,
        connote: {
          connote_code: codeToUse,
          connote_booking_code: `BK-POS-${Math.floor(100000 + Math.random() * 900000)}`,
          connote_service: chosenService,
          connote_amount: 15000 + Math.round(numWeight * 8000),
          actual_weight: numWeight,
          connote_state: 'IN_TRANSIT',
          connote_sender_name: finalSender,
          connote_receiver_name: finalReceiver,
          connote_receiver_address: finalAddress,
          connote_receiver_city: receiverObj.city,
          connote_receiver_province: receiverObj.province,
          connote_receiver_postal: receiverObj.postal,
          content_description: contentDesc,
          assigned_vehicle: assignment.nopol,
          created_at: `${dateStr} ${standardTimeStr}`
        },
        location_data_created: {
          location_name: cargoItem.origin_name,
          custom_field: {
            nopen: selectedOffice.nopend,
            destination_nopen: '40400',
            destination_city: receiverObj.city
          }
        },
        custom_field: {
          origin_nopen: selectedOffice.nopend,
          destination_nopen: '40400',
          vehicle_nopol: assignment.nopol,
          route_id: assignment.route_id,
          destination_city: receiverObj.city
        },
        assigned_vehicle: assignment.nopol,
        vehicle_nopol: assignment.nopol,
        createdAt: exactDateObj,
        updatedAt: exactDateObj
      };

      await db.collection('transaksi').replaceOne({ connote_code: codeToUse }, txDoc, { upsert: true });

      // 2. Tracking events
      const evt1 = {
        event_id: `EVT-${codeToUse}-01`,
        connote_code: codeToUse,
        event_type: 'POSTING_LOKET',
        office_code: selectedOffice.nopend,
        office_name: cargoItem.origin_name,
        vehicle_code: assignment.nopol,
        route_code: assignment.route_id,
        note: `Paket diterima di loket ${cargoItem.origin_name} dari pengirim ${finalSender} tujuan ${finalReceiver} (${receiverObj.city}).`,
        event_datetime: exactDateObj
      };

      const evt2 = {
        event_id: `EVT-${codeToUse}-02`,
        connote_code: codeToUse,
        event_type: 'LOADED',
        office_code: selectedOffice.nopend,
        office_name: cargoItem.origin_name,
        vehicle_code: assignment.nopol,
        route_code: assignment.route_id,
        note: `Paket dimuat ke armada feeder ${assignment.nopol} (${assignment.route_id}) tujuan SPP Bandung.`,
        event_datetime: exactDateObj
      };

      await db.collection('tracking_events').replaceOne({ event_id: evt1.event_id }, evt1, { upsert: true });
      await db.collection('tracking_events').replaceOne({ event_id: evt2.event_id }, evt2, { upsert: true });

      // 3. Update route_journeys
      const cleanNopol = assignment.nopol.replace(/\s+/g, '');
      const journeyId = `JRN-${dateStr.replace(/-/g, '')}-${cleanNopol}-001`;

      await db.collection('route_journeys').updateOne(
        { journey_id: journeyId },
        {
          $push: { cargo: cargoItem },
          $inc: { current_load_kg: numWeight },
          $setOnInsert: {
            journey_id: journeyId,
            vehicle_nopol: assignment.nopol,
            resolved_vehicle_nopol: assignment.nopol,
            route_id: assignment.route_id,
            shift: 'MALAM',
            status: 'IN_PROGRESS',
            current_stop_seq: assignment.loaded_at_seq,
            max_capacity_kg: assignment.nopol === 'D 8812 AB' ? 3500 : (assignment.nopol === 'B 9945 PCY' ? 4000 : 1500),
            maximum_capacity_kg: assignment.nopol === 'D 8812 AB' ? 3500 : (assignment.nopol === 'B 9945 PCY' ? 4000 : 1500),
            tanggal_operasional: dateStr,
            journey_date: startDate,
            version: 1,
            createdAt: startDate
          },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );

      return res.json({
        success: true,
        message: `Paket ${codeToUse} berhasil disuntikkan ke database! (${finalSender} ➔ ${finalReceiver}, ${receiverObj.city})`,
        data: {
          connote_code: codeToUse,
          sender: finalSender,
          receiver: finalReceiver,
          destination_city: receiverObj.city,
          weight_kg: numWeight,
          origin: cargoItem.origin_name,
          vehicle: assignment.nopol,
          service
        }
      });
    } catch (error) {
      console.error('Error in SimulatorController.injectSingle:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/simulator/clear-date
   * Reset / clear transactions and cargo for a specific date (back to 0 packages)
   */
  async clearDate(req, res) {
    try {
      const { target_date } = req.body;
      const dateStr = this.getWibDateStr(target_date);
      const db = await DbConnection.getDb();

      const startDate = new Date(`${dateStr}T00:00:00.000+07:00`);
      const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);

      // Delete transactions for dateStr
      const txResult = await db.collection('transaksi').deleteMany({
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { 'connote.created_at': { $regex: dateStr } },
          { created_at: { $regex: dateStr } }
        ]
      });

      // Reset cargo array & current_load_kg on route_journeys for dateStr
      const journeyResult = await db.collection('route_journeys').updateMany(
        {
          $or: [
            { tanggal_operasional: dateStr },
            { journey_date: { $gte: startDate, $lte: endDate } },
            { journey_id: { $regex: dateStr.replace(/-/g, '') } }
          ]
        },
        {
          $set: {
            cargo: [],
            current_load_kg: 0,
            status: 'READY',
            updatedAt: new Date()
          }
        }
      );

      return res.json({
        success: true,
        message: `Data resi dan muatan armada untuk tanggal ${dateStr} berhasil dibersihkan (kembali ke 0 paket).`,
        data: {
          operational_date: dateStr,
          deleted_transactions_count: txResult.deletedCount,
          reset_journeys_count: journeyResult.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error in SimulatorController.clearDate:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new SimulatorController();
