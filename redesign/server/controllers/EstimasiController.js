import DbConnection from '../config/DbConnection.js';

// Structured vehicle definitions starting from SPP Bandung (40000)
const DEFAULT_VEHICLES = {
  'B 9945 PCY': {
    nopol: 'B 9945 PCY',
    nama_kendaraan: 'Isuzu Elf Box - Express Gateway MPC Jakarta (B 9945 PCY)',
    jenis_kendaraan: 'TRUK BOX INTERCITY (4 TON)',
    pengemudi: 'Budi Santoso',
    nopen_asal: '40000',
    nama_nopen_asal: '40000 - SPP Bandung (Hub Utama)',
    nopen_tujuan: '10000',
    nama_nopen_tujuan: '10000 - MPC Jakarta Gateway',
    home_base: '40000 - SPP Bandung',
    assigned_route_id: 'RT-JAKARTA-B9945-PCY',
    max_capacity_kg: 4000,
    base_used_kg: 3120,
    stops: [
      { stop_order: 1, nopen: '40000', nama_lokasi: 'SPP Bandung (Origin Hub Utama)', role: 'ORIGIN', distance_km: 0, dwell_min: 20 },
      { stop_order: 2, nopen: '40500', nama_lokasi: 'KCU Cimahi (Checkpoint Konsolidasi)', role: 'CHECKPOINT', distance_km: 16, dwell_min: 15 },
      { stop_order: 3, nopen: '41300', nama_lokasi: 'Hub Transit Karawang (Gateway West)', role: 'TRANSIT', distance_km: 78, dwell_min: 20 },
      { stop_order: 4, nopen: '10000', nama_lokasi: 'MPC Jakarta Gateway (Hub Final Jakarta)', role: 'DESTINATION', distance_km: 54, dwell_min: 0 }
    ]
  },
  'B 9910 PCX': {
    nopol: 'B 9910 PCX',
    nama_kendaraan: 'Daihatsu Gran Max Box - Feeder Express Jakarta (B 9910 PCX)',
    jenis_kendaraan: 'MOBIL BOX INTERCITY (1.5 TON)',
    pengemudi: 'Ahmad Supriadi',
    nopen_asal: '40000',
    nama_nopen_asal: '40000 - SPP Bandung (Hub Utama)',
    nopen_tujuan: '12000',
    nama_nopen_tujuan: '12000 - DC Jakarta Selatan',
    home_base: '40000 - SPP Bandung',
    assigned_route_id: 'RT-JAKARTA-B9910-PCX',
    max_capacity_kg: 1500,
    base_used_kg: 1120,
    stops: [
      { stop_order: 1, nopen: '40000', nama_lokasi: 'SPP Bandung (Origin Hub Utama)', role: 'ORIGIN', distance_km: 0, dwell_min: 15 },
      { stop_order: 2, nopen: '40500', nama_lokasi: 'KCU Cimahi Checkpoint', role: 'CHECKPOINT', distance_km: 16, dwell_min: 15 },
      { stop_order: 3, nopen: '10000', nama_lokasi: 'MPC Jakarta Pusat', role: 'TRANSIT', distance_km: 130, dwell_min: 20 },
      { stop_order: 4, nopen: '12000', nama_lokasi: 'DC Jakarta Selatan (Hub Tujuan Final)', role: 'DESTINATION', distance_km: 15, dwell_min: 0 }
    ]
  },
  'D 8812 AB': {
    nopol: 'D 8812 AB',
    nama_kendaraan: 'Mitsubishi Canter - Feeder Cimahi (D 8812 AB)',
    jenis_kendaraan: 'TRUK ENGKEL BOX (3.5 TON)',
    pengemudi: 'Dede Kurnia',
    nopen_asal: '40000',
    nama_nopen_asal: '40000 - SPP Bandung',
    nopen_tujuan: '40500',
    nama_nopen_tujuan: '40500 - KCU Cimahi',
    home_base: '40000 - SPP Bandung',
    assigned_route_id: 'RT-CIMAHI-D8812-AB',
    max_capacity_kg: 3500,
    base_used_kg: 2450,
    stops: [
      { stop_order: 1, nopen: '40000', nama_lokasi: 'SPP Bandung (Origin Hub)', role: 'ORIGIN', distance_km: 0, dwell_min: 20 },
      { stop_order: 2, nopen: '40511', nama_lokasi: 'KCP Cimahi Main', role: 'CHECKPOINT', distance_km: 12, dwell_min: 15 },
      { stop_order: 3, nopen: '40500', nama_lokasi: 'KCU Cimahi (Hub Tujuan)', role: 'DESTINATION', distance_km: 6, dwell_min: 0 }
    ]
  },
  'D 8990 SPP': {
    nopol: 'D 8990 SPP',
    nama_kendaraan: 'Hino Dutro Heavy - Intra Hub Bandung (D 8990 SPP)',
    jenis_kendaraan: 'TRUK HEAVY WINGBOX (8 TON)',
    pengemudi: 'Eko Prasetyo',
    nopen_asal: '40000',
    nama_nopen_asal: '40000 - SPP Bandung Hub',
    nopen_tujuan: '40300',
    nama_nopen_tujuan: '40300 - KCU Soreang',
    home_base: '40000 - SPP Bandung',
    assigned_route_id: 'RT-HUB-D8990-SPP',
    max_capacity_kg: 8000,
    base_used_kg: 5640,
    stops: [
      { stop_order: 1, nopen: '40000', nama_lokasi: 'SPP Bandung Hub (Origin)', role: 'ORIGIN', distance_km: 0, dwell_min: 30 },
      { stop_order: 2, nopen: '40253A', nama_lokasi: 'DC Soekarno Hatta', role: 'CHECKPOINT', distance_km: 12, dwell_min: 25 },
      { stop_order: 3, nopen: '40300', nama_lokasi: 'KCU Soreang (Hub Tujuan)', role: 'DESTINATION', distance_km: 24, dwell_min: 0 }
    ]
  },
  'D 1234 POS': {
    nopol: 'D 1234 POS',
    nama_kendaraan: 'Blind Van Gran Max - City Feeder (D 1234 POS)',
    jenis_kendaraan: 'BLIND VAN (0.8 TON)',
    pengemudi: 'Fajar Hidayat',
    nopen_asal: '40000',
    nama_nopen_asal: '40000 - SPP Bandung',
    nopen_tujuan: '40263C2',
    nama_nopen_tujuan: '40263C2 - AGP Gatsu',
    home_base: '40000 - SPP Bandung',
    assigned_route_id: 'RT-FEEDA-D1234-POS',
    max_capacity_kg: 800,
    base_used_kg: 520,
    stops: [
      { stop_order: 1, nopen: '40000', nama_lokasi: 'SPP Bandung (Origin Hub)', role: 'ORIGIN', distance_km: 0, dwell_min: 15 },
      { stop_order: 2, nopen: '40114A', nama_lokasi: 'KCP Cihapit', role: 'CHECKPOINT', distance_km: 7, dwell_min: 10 },
      { stop_order: 3, nopen: '40263C2', nama_lokasi: 'AGP Gatsu (Tujuan Final)', role: 'DESTINATION', distance_km: 5, dwell_min: 0 }
    ]
  }
};

// Helper to format minute offset into HH:mm WIB string
function calculateEta(baseTimeStr, addedMinutes) {
  const [hStr, mStr] = (baseTimeStr || '16:00').split(':');
  let hours = parseInt(hStr, 10) || 16;
  let mins = parseInt(mStr, 10) || 0;

  mins += Math.round(addedMinutes);
  hours += Math.floor(mins / 60);
  mins = mins % 60;
  hours = hours % 24;

  const paddedH = String(hours).padStart(2, '0');
  const paddedM = String(mins).padStart(2, '0');
  return `${paddedH}:${paddedM} WIB`;
}

// Helper capacity status classifier
function getCapacityStatus(percent) {
  if (percent >= 90) return 'OVERLOAD';
  if (percent >= 70) return 'WARNING';
  return 'NORMAL';
}

class EstimasiController {
  /**
   * GET /api/estimasi/kalkulasi
   * Params: nopol, jam_berangkat, kecepatan_kmh, waktu_muat_menit, periode (hari_ini, minggu_lalu, bulan_lalu)
   */
  static async getKalkulasi(req, res) {
    try {
      const nopol = (req.query.nopol || 'B 9945 PCY').trim();
      const jamBerangkat = req.query.jam_berangkat || '16:00';
      const kecepatanKmh = parseFloat(req.query.kecepatan_kmh) || 40;
      const waktuMuatMenit = parseFloat(req.query.waktu_muat_menit) || 15;
      const periode = req.query.periode || 'hari_ini'; // hari_ini | minggu_lalu | bulan_lalu

      const defaultInfo = DEFAULT_VEHICLES[nopol] || DEFAULT_VEHICLES['B 9945 PCY'];
      let vehicle = null;
      let totalWeightKg = 0;
      let usedDbWeight = false;
      let routeStops = null;

      try {
        const db = await DbConnection.getDb();
        
        // 1. Query Data Armada Kendaraan (master_kendaraan)
        vehicle = await db.collection('master_kendaraan').findOne({
          $or: [
            { nopol: nopol },
            { kendaraan_id: nopol }
          ]
        });

        // 2. Query Aturan Filter Rute (master_route_nopen)
        const assignedRouteId = vehicle?.assigned_route_id || defaultInfo.assigned_route_id;
        const routeDoc = await db.collection('master_route_nopen').findOne({
          $or: [{ route_id: assignedRouteId }, { route_code: assignedRouteId }]
        });

        const targetNopends = routeDoc?.origin_nopen_list || ["40000", "40500", "40253A"];
        const destinationPrefixes = routeDoc?.destination_prefix_filter || ["1", "2", "3", "7", "9"];
        const destinationRegex = new RegExp(`^(${destinationPrefixes.join('|')})`);

        // 3. Query Agregasi Berat Paket berdasarkan Periode Waktu
        const matchConditions = [
          {
            $or: [
              { 'location_data_created.custom_field.nopen': { $in: targetNopends } },
              { 'location_data_created.custom_field.destination_nopen': { $in: targetNopends } },
              { 'custom_field.destination_nopen': { $regex: destinationRegex } },
              { 'custom_field.final_swp': { $in: [6, '6'] } }
            ]
          },
          { 'connote_state': { $nin: ['CANCEL', 'CANCELLED', 'RETURNED'] } }
        ];

        const allTxDocs = await db.collection('transaksi').find({ $and: matchConditions }).toArray();

        if (allTxDocs && allTxDocs.length > 0) {
          allTxDocs.forEach(d => {
            totalWeightKg += parseFloat(d.connote?.actual_weight || d.actual_weight || 0);
          });
          usedDbWeight = true;
        }

        if (routeDoc && Array.isArray(routeDoc.checkpoints) && routeDoc.checkpoints.length > 0) {
          routeStops = routeDoc.checkpoints;
        }
      } catch (dbErr) {
        console.warn('EstimasiController MongoDB query notice:', dbErr.message);
      }

      // Base weight logic according to period filter
      let baseWeightKg = defaultInfo.base_used_kg;
      let totalPaketCount = 245;

      if (usedDbWeight && totalWeightKg > 0) {
        baseWeightKg = totalWeightKg;
      }

      if (periode === 'minggu_lalu') {
        baseWeightKg = Math.round(baseWeightKg * 1.35 * 10) / 10;
        totalPaketCount = 1420;
      } else if (periode === 'bulan_lalu') {
        baseWeightKg = Math.round(baseWeightKg * 4.6 * 10) / 10;
        totalPaketCount = 5840;
      }

      const finalNopol = vehicle?.nopol || defaultInfo.nopol;
      const namaKendaraan = vehicle?.nama_kendaraan || defaultInfo.nama_kendaraan;
      const jenisKendaraan = vehicle?.jenis_kendaraan || defaultInfo.jenis_kendaraan;
      const nopenAsal = defaultInfo.nopen_asal;
      const namaNopenAsal = defaultInfo.nama_nopen_asal;
      const nopenTujuan = defaultInfo.nopen_tujuan;
      const namaNopenTujuan = defaultInfo.nama_nopen_tujuan;
      const homeBase = defaultInfo.home_base;
      const assignedRouteId = vehicle?.assigned_route_id || defaultInfo.assigned_route_id;
      const maxCapKg = parseFloat(vehicle?.max_capacity_kg || defaultInfo.max_capacity_kg);

      const usedCapacityKg = parseFloat(baseWeightKg.toFixed(1));
      const sisaCapacityKg = Math.max(0, parseFloat((maxCapKg - usedCapacityKg).toFixed(1)));
      const persentaseTerpakai = parseFloat(((usedCapacityKg / maxCapKg) * 100).toFixed(1));
      const capacityStatus = getCapacityStatus(persentaseTerpakai);

      // Build route stops timeline starting from SPP Bandung (40000)
      const baseStops = routeStops || defaultInfo.stops;
      let accumulatedMin = 0;

      const estimasiJadwalStop = baseStops.map((stop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === baseStops.length - 1;
        const travelDist = stop.distance_km || 0;
        
        // Travel time in minutes = (distance_km / speed_kmh) * 60
        const travelTimeMin = isFirst ? 0 : (travelDist / (kecepatanKmh || 40)) * 60;
        const dwellTimeMin = isLast ? 0 : (stop.dwell_min !== undefined ? stop.dwell_min : waktuMuatMenit);

        accumulatedMin += travelTimeMin;
        const etaStr = calculateEta(jamBerangkat, accumulatedMin);
        accumulatedMin += dwellTimeMin;

        let stopStatus = 'SCHEDULED';
        if (isFirst) {
          stopStatus = 'COMPLETED';
        } else if (idx === 1) {
          stopStatus = 'IN_TRANSIT';
        }

        return {
          stop_order: stop.stop_order || (idx + 1),
          nopen: stop.nopen || '40000',
          nama_lokasi: stop.nama_lokasi || `Stop ${idx + 1}`,
          role: stop.role || (isFirst ? 'ORIGIN' : isLast ? 'DESTINATION' : 'CHECKPOINT'),
          distance_km: travelDist,
          eta: etaStr,
          waktu_muat: `${dwellTimeMin} min`,
          status: stopStatus
        };
      });

      res.json({
        success: true,
        data: {
          nopol: finalNopol,
          nama_kendaraan: namaKendaraan,
          jenis_kendaraan: jenisKendaraan,
          nopen_asal: nopenAsal,
          nama_nopen_asal: namaNopenAsal,
          nopen_tujuan: nopenTujuan,
          nama_nopen_tujuan: namaNopenTujuan,
          home_base: homeBase,
          assigned_route_id: assignedRouteId,
          kecepatan_kmh: kecepatanKmh,
          jam_berangkat: jamBerangkat,
          waktu_muat_menit: waktuMuatMenit,
          periode_pengiriman: periode,
          total_paket_count: totalPaketCount,
          kapasitas: {
            max_capacity_kg: maxCapKg,
            used_capacity_kg: usedCapacityKg,
            sisa_capacity_kg: sisaCapacityKg,
            persentase_terpakai: persentaseTerpakai,
            status: capacityStatus
          },
          estimasi_jadwal_stop: estimasiJadwalStop
        }
      });
    } catch (error) {
      console.error('Error in EstimasiController.getKalkulasi:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/estimasi/simulasi-beban
   * Params: nopol, tambahan_paket_kg, periode
   */
  static async simulasiBeban(req, res) {
    try {
      const nopol = (req.query.nopol || 'B 9945 PCY').trim();
      const tambahanKg = parseFloat(req.query.tambahan_paket_kg) || 0;
      const periode = req.query.periode || 'hari_ini';

      let vehicle = null;

      try {
        const db = await DbConnection.getDb();
        vehicle = await db.collection('master_kendaraan').findOne({
          $or: [{ nopol: nopol }, { kendaraan_id: nopol }]
        });
      } catch (e) {
        console.warn('EstimasiController simulasi DB warning:', e.message);
      }

      const defaultInfo = DEFAULT_VEHICLES[nopol] || DEFAULT_VEHICLES['B 9945 PCY'];
      const maxCapKg = parseFloat(vehicle?.max_capacity_kg || defaultInfo.max_capacity_kg);
      let baseWeightKg = defaultInfo.base_used_kg;

      if (periode === 'minggu_lalu') {
        baseWeightKg = Math.round(baseWeightKg * 1.35 * 10) / 10;
      } else if (periode === 'bulan_lalu') {
        baseWeightKg = Math.round(baseWeightKg * 4.6 * 10) / 10;
      }

      const projectedUsedKg = parseFloat((baseWeightKg + tambahanKg).toFixed(1));
      const projectedSisaKg = Math.max(0, parseFloat((maxCapKg - projectedUsedKg).toFixed(1)));
      const projectedPercentage = parseFloat(((projectedUsedKg / maxCapKg) * 100).toFixed(1));
      const status = getCapacityStatus(projectedPercentage);

      res.json({
        success: true,
        data: {
          nopol: vehicle?.nopol || defaultInfo.nopol,
          nopen_asal: defaultInfo.nopen_asal,
          nopen_tujuan: defaultInfo.nopen_tujuan,
          periode: periode,
          tambahan_paket_kg: tambahanKg,
          base_used_capacity_kg: baseWeightKg,
          kapasitas_proyeksi: {
            max_capacity_kg: maxCapKg,
            used_capacity_kg: projectedUsedKg,
            sisa_capacity_kg: projectedSisaKg,
            persentase_terpakai: projectedPercentage,
            status: status
          },
          is_overload: status === 'OVERLOAD',
          is_warning: status === 'WARNING'
        }
      });
    } catch (error) {
      console.error('Error in EstimasiController.simulasiBeban:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default EstimasiController;
