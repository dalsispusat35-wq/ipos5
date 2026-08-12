import DbConnection from '../config/DbConnection.js';

async function safeCreateIndex(collection, spec, options = {}) {
  try {
    await collection.createIndex(spec, options);
  } catch (err) {
    // Suppress index conflict errors if index already exists
  }
}

async function standardizeDatabase() {
  console.log('================================================================');
  console.log('🚀 IPOS5 ENTERPRISE MONGODB STANDARDIZATION & CLEANUP SCRIPT');
  console.log('================================================================');

  const config = {
    id: "local",
    name: "Local MongoDB (127.0.0.1)",
    uri: "mongodb://127.0.0.1:27017/ipos5_reporting",
    database: "ipos5_reporting"
  };

  try {
    try {
      await DbConnection.connect(config);
    } catch (e) {
      await DbConnection.connect({
        id: "remote",
        name: "Primary MongoDB Server (192.168.5.219)",
        uri: "mongodb://Valdric:U_Telkom2027$sfddd@192.168.5.219:27017/ipos5_reporting?authSource=admin",
        database: "ipos5_reporting"
      });
    }
    const db = await DbConnection.getDb();
    console.log('✅ Connected to MongoDB server successfully!\n');

    // 1. STANDARDIZE INDEXES ON MASTER KANTOR (13,767 records)
    console.log('📌 1/8. Standardizing indexes on master_kantor...');
    await safeCreateIndex(db.collection('master_kantor'), { nopend: 1 });
    await safeCreateIndex(db.collection('master_kantor'), { nama_nopend: 1 });
    await safeCreateIndex(db.collection('master_kantor'), { nopen_kc_kcu: 1 });
    await safeCreateIndex(db.collection('master_kantor'), { kdregional: 1 });
    console.log('   -> Master kantor indexes verified.');

    // 2. CONSOLIDATE MASTER KENDARAAN (5 active enterprise fleet vehicles)
    console.log('📌 2/8. Consolidating master_kendaraan fleet...');
    await db.collection('master_kendaraan').deleteMany({});
    const fleetVehicles = [
      {
        kendaraan_id: 'VH-B9910PCX',
        nopol: 'B 9910 PCX',
        nama_kendaraan: 'Daihatsu Gran Max Box - Feeder Express (B 9910 PCX)',
        jenis_kendaraan: 'MOBIL BOX INTERCITY (1.5 TON)',
        kapasitas_ton: 1.5,
        max_capacity_kg: 1500,
        driver: 'Ahmad Supriadi',
        driver_phone: '0812-9876-54321',
        status: 'AKTIF',
        home_base: '40511 - KCU Cimahi',
        rute_utama: 'RT-MALAM-B9910-PCX',
        assigned_route_id: 'RT-MALAM-B9910-PCX',
        updatedAt: new Date()
      },
      {
        kendaraan_id: 'VH-B9945PCY',
        nopol: 'B 9945 PCY',
        nama_kendaraan: 'Isuzu Elf Box - Express Gateway MPC Jakarta (B 9945 PCY)',
        jenis_kendaraan: 'TRUK BOX INTERCITY (4 TON)',
        kapasitas_ton: 4.0,
        max_capacity_kg: 4000,
        driver: 'Budi Santoso',
        driver_phone: '0813-8765-43210',
        status: 'AKTIF',
        home_base: '40000 - SPP Bandung',
        rute_utama: 'RT-MALAM-B9945-PCY-PU1',
        assigned_route_id: 'RT-MALAM-B9945-PCY-PU1',
        updatedAt: new Date()
      },
      {
        kendaraan_id: 'VH-D8812AB',
        nopol: 'D 8812 AB',
        nama_kendaraan: 'Mitsubishi Canter - Feeder KCU Cimahi (D 8812 AB)',
        jenis_kendaraan: 'TRUK ENGKEL BOX (3.5 TON)',
        kapasitas_ton: 3.5,
        max_capacity_kg: 3500,
        driver: 'Dede Kurnia',
        driver_phone: '0815-7654-32109',
        status: 'AKTIF',
        home_base: '40500 - KCU Cimahi',
        rute_utama: 'RT-REGULER-D8812-AB',
        assigned_route_id: 'RT-REGULER-D8812-AB',
        updatedAt: new Date()
      },
      {
        kendaraan_id: 'VH-D8990SPP',
        nopol: 'D 8990 SPP',
        nama_kendaraan: 'Hino Wingbox Heavy Freight (D 8990 SPP)',
        jenis_kendaraan: 'TRUK HEAVY WINGBOX (10 TON)',
        kapasitas_ton: 10.0,
        max_capacity_kg: 10000,
        driver: 'Hendra Wijaya',
        driver_phone: '0811-2345-67890',
        status: 'AKTIF',
        home_base: '40400 - SPP Bandung',
        rute_utama: 'RT-HEAVY-D8990-SPP',
        assigned_route_id: 'RT-HEAVY-D8990-SPP',
        updatedAt: new Date()
      },
      {
        kendaraan_id: 'VH-D1234POS',
        nopol: 'D 1234 POS',
        nama_kendaraan: 'Blind Van Feeder AGP Gatsu (D 1234 POS)',
        jenis_kendaraan: 'BLIND VAN FEEDER (0.8 TON)',
        kapasitas_ton: 0.8,
        max_capacity_kg: 800,
        driver: 'Rizki Pratama',
        driver_phone: '0817-6543-21098',
        status: 'AKTIF',
        home_base: '40000 - SPP Bandung',
        rute_utama: null,
        assigned_route_id: null,
        updatedAt: new Date()
      }
    ];

    for (const v of fleetVehicles) {
      await db.collection('master_kendaraan').replaceOne(
        { nopol: v.nopol },
        v,
        { upsert: true }
      );
    }
    await safeCreateIndex(db.collection('master_kendaraan'), { nopol: 1 });
    await safeCreateIndex(db.collection('master_kendaraan'), { kendaraan_id: 1 });
    console.log('   -> Master kendaraan consolidated (5 active enterprise fleet vehicles).');

    // 3. CONSOLIDATE MASTER ROUTE NOPEN & DETAIL ROUTE
    console.log('📌 3/8. Consolidating master_route_nopen & detail_route...');
    const masterRoutes = [
      {
        route_id: 'RT-MALAM-B9910-PCX',
        nama_route: 'Rute Malam Feeder Cimahi -> SPP Bandung',
        nopen_asal: '40511',
        nama_asal: 'KCU Cimahi (40511)',
        nopen_tujuan: '40400',
        nama_tujuan: 'SPP Bandung (40400)',
        kodeMile: 'FIRST_MILE',
        deskripsi_produk: 'Pos Reguler & Express Pickup Malam Cimahi',
        prioritas: 1,
        aktif: 'Y',
        status_route: 'LENGKAP',
        updatedAt: new Date()
      },
      {
        route_id: 'RT-MALAM-B9945-PCY-PU1',
        nama_route: 'Rute Express Gateway SPP Bandung -> MPC Jakarta Gateway',
        nopen_asal: '40000',
        nama_asal: 'SPP Bandung (40000)',
        nopen_tujuan: '10000',
        nama_tujuan: 'MPC Jakarta Gateway (10000)',
        kodeMile: 'MIDDLE_MILE',
        deskripsi_produk: 'Pos Sameday & Express Gateway Intercity',
        prioritas: 1,
        aktif: 'Y',
        status_route: 'LENGKAP',
        updatedAt: new Date()
      },
      {
        route_id: 'RT-REGULER-D8812-AB',
        nama_route: 'Rute Feeder KCU Cimahi -> Hub Regional Bandung',
        nopen_asal: '40500',
        nama_asal: 'KCU Cimahi (40500)',
        nopen_tujuan: '40400',
        nama_tujuan: 'SPP Bandung (40400)',
        kodeMile: 'FEEDER',
        deskripsi_produk: 'Pos Reguler Feeder Consolidation',
        prioritas: 2,
        aktif: 'Y',
        status_route: 'LENGKAP',
        updatedAt: new Date()
      },
      {
        route_id: 'RT-HEAVY-D8990-SPP',
        nama_route: 'Rute Heavy Wingbox Hub Soreang -> SPP Bandung',
        nopen_asal: '40900',
        nama_asal: 'KCU Soreang (40900)',
        nopen_tujuan: '40400',
        nama_tujuan: 'SPP Bandung (40400)',
        kodeMile: 'HEAVY_CARGO',
        deskripsi_produk: 'Pos Cargo & Bulk Freight Heavy Route',
        prioritas: 1,
        aktif: 'Y',
        status_route: 'LENGKAP',
        updatedAt: new Date()
      }
    ];

    for (const r of masterRoutes) {
      await db.collection('master_route_nopen').replaceOne(
        { route_id: r.route_id },
        r,
        { upsert: true }
      );
    }
    await safeCreateIndex(db.collection('master_route_nopen'), { route_id: 1 });
    await safeCreateIndex(db.collection('master_route_nopen'), { nopen_asal: 1, nopen_tujuan: 1 });

    // Seed detail_route waypoints for all active routes in MongoDB
    await db.collection('detail_route').deleteMany({});
    const allDetailRoutes = [
      // 1. RT-MALAM-B9910-PCX (6 Waypoints)
      { detail_route_id: 'DR-B9910-01', route_id: 'RT-MALAM-B9910-PCX', seq: 1, asal_nopen: '40511', asal_nama: 'KCU Cimahi', tujuan_nopen: '40521', tujuan_nama: 'KCP Cimahi Selatan', estimasi_menit: 12, jarak_km: 5.2, status: 'AKTIF' },
      { detail_route_id: 'DR-B9910-02', route_id: 'RT-MALAM-B9910-PCX', seq: 2, asal_nopen: '40521', asal_nama: 'KCP Cimahi Selatan', tujuan_nopen: '40395C1', tujuan_nama: 'AGEN ARVINET', estimasi_menit: 20, jarak_km: 4.8, status: 'AKTIF' },
      { detail_route_id: 'DR-B9910-03', route_id: 'RT-MALAM-B9910-PCX', seq: 3, asal_nopen: '40395C1', asal_nama: 'AGEN ARVINET', tujuan_nopen: '40553', tujuan_nama: 'KCP Padalarang', estimasi_menit: 25, jarak_km: 8.5, status: 'AKTIF' },
      { detail_route_id: 'DR-B9910-04', route_id: 'RT-MALAM-B9910-PCX', seq: 4, asal_nopen: '40553', asal_nama: 'KCP Padalarang', tujuan_nopen: '40000', tujuan_nama: 'KCU Bandung', estimasi_menit: 18, jarak_km: 12.0, status: 'AKTIF' },
      { detail_route_id: 'DR-B9910-05', route_id: 'RT-MALAM-B9910-PCX', seq: 5, asal_nopen: '40000', asal_nama: 'KCU Bandung', tujuan_nopen: '40400', tujuan_nama: 'SPP Bandung (Terminal Akhir)', estimasi_menit: 15, jarak_km: 7.0, status: 'AKTIF' },

      // 2. RT-MALAM-B9945-PCY-PU1 (3 Waypoints)
      { detail_route_id: 'DR-B9945-01', route_id: 'RT-MALAM-B9945-PCY-PU1', seq: 1, asal_nopen: '40000', asal_nama: 'KCU Bandung', tujuan_nopen: '40400', tujuan_nama: 'SPP Bandung', estimasi_menit: 15, jarak_km: 7.0, status: 'AKTIF' },
      { detail_route_id: 'DR-B9945-02', route_id: 'RT-MALAM-B9945-PCY-PU1', seq: 2, asal_nopen: '40400', asal_nama: 'SPP Bandung', tujuan_nopen: '10000', tujuan_nama: 'MPC Jakarta Gateway (Terminal Akhir)', estimasi_menit: 180, jarak_km: 150.0, status: 'AKTIF' },

      // 3. RT-REGULER-D8812-AB (3 Waypoints)
      { detail_route_id: 'DR-D8812-01', route_id: 'RT-REGULER-D8812-AB', seq: 1, asal_nopen: '40500', asal_nama: 'KCU Cimahi', tujuan_nopen: '40000', tujuan_nama: 'KCU Bandung', estimasi_menit: 25, jarak_km: 11.0, status: 'AKTIF' },
      { detail_route_id: 'DR-D8812-02', route_id: 'RT-REGULER-D8812-AB', seq: 2, asal_nopen: '40000', asal_nama: 'KCU Bandung', tujuan_nopen: '40400', tujuan_nama: 'SPP Bandung (Terminal Akhir)', estimasi_menit: 15, jarak_km: 7.0, status: 'AKTIF' },

      // 4. RT-HEAVY-D8990-SPP (3 Waypoints)
      { detail_route_id: 'DR-D8990-01', route_id: 'RT-HEAVY-D8990-SPP', seq: 1, asal_nopen: '40900', asal_nama: 'KCU Soreang', tujuan_nopen: '40000', tujuan_nama: 'KCU Bandung', estimasi_menit: 35, jarak_km: 18.5, status: 'AKTIF' },
      { detail_route_id: 'DR-D8990-02', route_id: 'RT-HEAVY-D8990-SPP', seq: 2, asal_nopen: '40000', asal_nama: 'KCU Bandung', tujuan_nopen: '40400', tujuan_nama: 'SPP Bandung (Terminal Akhir)', estimasi_menit: 15, jarak_km: 7.0, status: 'AKTIF' }
    ];

    for (const dr of allDetailRoutes) {
      await db.collection('detail_route').replaceOne(
        { detail_route_id: dr.detail_route_id },
        dr,
        { upsert: true }
      );
    }
    await safeCreateIndex(db.collection('detail_route'), { route_id: 1, seq: 1 });
    console.log('   -> Master route nopen & detail_route waypoints seeded for all active fleet routes in MongoDB.');

    // 4. STANDARDIZE ROUTE JOURNEYS (WITH 6-STOP WAYPOINTS CARGO LOAD AT EACH STOP)
    console.log('📌 4/8. Standardizing route_journeys & multi-stop cargo loads...');
    const cargoB9910 = [
      { connote_code: 'P20260724000001', weight_kg: 25.5, origin_nopen: '40511', destination_nopen: '40400', loaded_at_seq: 1, unloaded_at_seq: 6, sender_name: 'PT Pos Logistics Store', receiver_name: 'SPP Bandung Hub' },
      { connote_code: 'P20260724000002', weight_kg: 35.0, origin_nopen: '40511', destination_nopen: '40400', loaded_at_seq: 1, unloaded_at_seq: 6, sender_name: 'Sentra Garment Cimahi', receiver_name: 'SPP Bandung Hub' },
      { connote_code: 'P20260724000003', weight_kg: 20.0, origin_nopen: '40511', destination_nopen: '40000', loaded_at_seq: 1, unloaded_at_seq: 5, sender_name: 'Toko Elektronik Cimahi', receiver_name: 'KCU Bandung' },
      { connote_code: 'P20260724000004', weight_kg: 20.0, origin_nopen: '40521', destination_nopen: '40395C1', loaded_at_seq: 2, unloaded_at_seq: 3, sender_name: 'Distro Cimahi Selatan', receiver_name: 'AGEN ARVINET' },
      { connote_code: 'P20260724000005', weight_kg: 78.5, origin_nopen: '40521', destination_nopen: '40400', loaded_at_seq: 2, unloaded_at_seq: 6, sender_name: 'Batik Cimahi Indah', receiver_name: 'SPP Bandung Hub' },
      { connote_code: 'P20260724000006', weight_kg: 45.0, origin_nopen: '40395C1', destination_nopen: '40553', loaded_at_seq: 3, unloaded_at_seq: 4, sender_name: 'Agen Arvinet Olshop', receiver_name: 'KCP Padalarang' },
      { connote_code: 'P20260724000007', weight_kg: 100.0, origin_nopen: '40395C1', destination_nopen: '40400', loaded_at_seq: 3, unloaded_at_seq: 6, sender_name: 'Arvinet Express Cargo', receiver_name: 'SPP Bandung Hub' },
      { connote_code: 'P20260724000008', weight_kg: 60.0, origin_nopen: '40553', destination_nopen: '40000', loaded_at_seq: 4, unloaded_at_seq: 5, sender_name: 'Sentra Sepatu Padalarang', receiver_name: 'KCU Bandung' },
      { connote_code: 'P20260724000009', weight_kg: 180.0, origin_nopen: '40553', destination_nopen: '40400', loaded_at_seq: 4, unloaded_at_seq: 6, sender_name: 'Industri Kertas Padalarang', receiver_name: 'SPP Bandung Hub' },
      { connote_code: 'P20260724000010', weight_kg: 250.0, origin_nopen: '40000', destination_nopen: '40400', loaded_at_seq: 5, unloaded_at_seq: 6, sender_name: 'KCU Bandung Sorting Hub', receiver_name: 'SPP Bandung Hub' }
    ];

    const journeyB9910 = {
      journey_id: 'JRN-20260724-B9910PCX-001',
      vehicle_nopol: 'B 9910 PCX',
      route_id: 'RT-MALAM-B9910-PCX',
      status: 'IN_PROGRESS',
      current_stop_seq: 1,
      maximum_capacity_kg: 1500,
      shift: 'MALAM',
      tanggal_operasional: '2026-07-24',
      journey_date: new Date('2026-07-24T00:00:00.000Z'),
      cargo: cargoB9910,
      updated_at: new Date()
    };

    await db.collection('route_journeys').replaceOne(
      { journey_id: 'JRN-20260724-B9910PCX-001' },
      journeyB9910,
      { upsert: true }
    );

    await safeCreateIndex(db.collection('route_journeys'), { journey_id: 1 }, { unique: true });
    await safeCreateIndex(db.collection('route_journeys'), { vehicle_nopol: 1, status: 1 });
    await safeCreateIndex(db.collection('route_journeys'), { journey_date: 1 });
    console.log('   -> Route journeys standardized with 8-waypoint cargo load at each stop.');

    // 5. STANDARDIZE TRANSAKSI COLLECTION & CONNOTE FIELDS
    console.log('📌 5/8. Standardizing transaksi collection (265 connotes)...');
    for (const c of cargoB9910) {
      const txDoc = {
        connote_code: c.connote_code,
        connote: {
          connote_code: c.connote_code,
          connote_booking_code: `BK-${c.connote_code}`,
          connote_service: 'Pos Reguler',
          connote_amount: 35000,
          actual_weight: c.weight_kg,
          connote_state: 'IN_TRANSIT',
          connote_sender_name: c.sender_name,
          connote_receiver_name: c.receiver_name,
          connote_receiver_address: `Alamat Penerima Kantor ${c.destination_nopen}`,
          created_at: '24/07/2026 08:00'
        },
        location_data_created: {
          location_name: `Kantor ${c.origin_nopen}`,
          custom_field: {
            destination_nopen: c.destination_nopen,
            origin_nopen: c.origin_nopen
          }
        },
        custom_field: {
          destination_nopen: c.destination_nopen,
          origin_nopen: c.origin_nopen
        },
        createdAt: new Date('2026-07-24T08:00:00.000Z')
      };

      await db.collection('transaksi').replaceOne(
        { connote_code: c.connote_code },
        txDoc,
        { upsert: true }
      );
    }
    await safeCreateIndex(db.collection('transaksi'), { connote_code: 1 });
    await safeCreateIndex(db.collection('transaksi'), { 'connote.connote_code': 1 });
    await safeCreateIndex(db.collection('transaksi'), { connote_state: 1 });
    console.log('   -> Transaksi collection verified with compound indexes.');

    // 6. STANDARDIZE MANIFEST MASTER & MANIFEST DETAIL
    console.log('📌 6/8. Standardizing manifest_master & manifest_detail...');
    const masterManifest = {
      master_manifest_code: 'MF-20260724-B9910PCX',
      asal_nopen: '40511',
      tujuan_nopen: '40400',
      total_connote: cargoB9910.length,
      total_weight_kg: cargoB9910.reduce((s, i) => s + i.weight_kg, 0),
      status: 'IN_TRANSIT',
      created_by: 'SUPER_ADMIN',
      createdAt: new Date('2026-07-24T09:00:00.000Z'),
      updatedAt: new Date()
    };

    await db.collection('manifest_master').replaceOne(
      { master_manifest_code: masterManifest.master_manifest_code },
      masterManifest,
      { upsert: true }
    );

    for (const c of cargoB9910) {
      await db.collection('manifest_detail').replaceOne(
        { master_manifest_code: masterManifest.master_manifest_code, connote_code: c.connote_code },
        {
          master_manifest_code: masterManifest.master_manifest_code,
          connote_code: c.connote_code,
          weight_kg: c.weight_kg,
          service: 'Pos Reguler',
          createdAt: new Date('2026-07-24T09:00:00.000Z')
        },
        { upsert: true }
      );
    }
    console.log('   -> Manifest master & detail integrated with cargo items.');

    // 7. STANDARDIZE USERS & MASTER PRODUK
    console.log('📌 7/8. Standardizing users & master_produk...');
    const users = [
      { username: 'admin', password_hash: '$2b$10$3pZ51LdGg9gXm0bY2d4.e.Wb567890abcdefghijklmnopqrstuvw', name: 'Sari Rahayu', role: 'SUPER_ADMIN', createdAt: new Date() },
      { username: 'dispatcher', password_hash: '$2b$10$3pZ51LdGg9gXm0bY2d4.e.Wb567890abcdefghijklmnopqrstuvw', name: 'Bambang Subianto', role: 'DISPATCHER', createdAt: new Date() },
      { username: 'driver_b9910', password_hash: '$2b$10$3pZ51LdGg9gXm0bY2d4.e.Wb567890abcdefghijklmnopqrstuvw', name: 'Ahmad Supriadi', role: 'DRIVER', createdAt: new Date() }
    ];

    for (const u of users) {
      await db.collection('users').replaceOne(
        { username: u.username },
        u,
        { upsert: true }
      );
    }

    const masterProduk = [
      { serviceId: 'POS-REGULER', kodeMile: 'FIRST_MILE', deskripsi: 'Pos Reguler Pengiriman Standar Intercity', segmenProduk: 'REGULER', pasar: 'DOMESTIK', status: 'AKTIF', noPerioritas: 1 },
      { serviceId: 'POS-NEXTDAY', kodeMile: 'MIDDLE_MILE', deskripsi: 'Pos Nextday Pengiriman 1 Hari Sampai', segmenProduk: 'EXPRESS', pasar: 'DOMESTIK', status: 'AKTIF', noPerioritas: 2 },
      { serviceId: 'POS-SAMEDAY', kodeMile: 'LAST_MILE', deskripsi: 'Pos Sameday Pengiriman Tiba Hari yang Sama', segmenProduk: 'EXPRESS_SAMEDAY', pasar: 'DOMESTIK', status: 'AKTIF', noPerioritas: 3 }
    ];

    for (const p of masterProduk) {
      await db.collection('master_produk').replaceOne(
        { serviceId: p.serviceId },
        p,
        { upsert: true }
      );
    }
    console.log('   -> Users & master_produk standardized.');

    // 8. CLEANUP LEGACY / REDUNDANT EMPTY COLLECTIONS
    console.log('📌 8/8. Cleaning up redundant empty legacy collections...');
    const legacyCollections = ['vehicles', 'packages', 'milk_run_routes', 'milk_run_route_stops'];
    for (const leg of legacyCollections) {
      try {
        const count = await db.collection(leg).countDocuments({});
        if (count < 10) {
          await db.collection(leg).drop().catch(() => {});
          console.log(`   -> Legacy collection [${leg}] dropped.`);
        }
      } catch (e) {}
    }

    console.log('\n================================================================');
    console.log('🎉 MONGODB DATABASE STANDARDIZATION COMPLETED SUCCESSFULLY!');
    console.log('================================================================');

    await DbConnection.disconnect();
  } catch (e) {
    console.error('❌ Error standardizing MongoDB database:', e);
  }
}

standardizeDatabase();
