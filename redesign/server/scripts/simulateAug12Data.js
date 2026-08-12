import DbConnection from '../config/DbConnection.js';

async function seedSimulasi100() {
  console.log('================================================================');
  console.log('🚀 SEEDING 100 SIMULATION TRANSACTIONS FOR TODAY: 12 AUGUST 2026');
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

    const targetDateStr = '2026-08-12';
    const targetDateObj = new Date('2026-08-12T00:00:00.000Z');

    const senders = [
      'PT Pos Logistics Store', 'Sentra Garment Cimahi', 'Toko Elektronik Cimahi', 'Distro Cimahi Selatan',
      'Batik Cimahi Indah', 'Agen Arvinet Olshop', 'Arvinet Express Cargo', 'Sentra Sepatu Padalarang',
      'Industri Kertas Padalarang', 'KCU Bandung Sorting Hub', 'PT Eiger Adventure', 'Pabrik Tekstil Majalaya',
      'Toko Buku Palasari', 'Sentra Kerajinan Rajapolah', 'Dinas Pendidikan Jabar', 'Grosir Pasar Baru Bandung'
    ];

    const receivers = [
      'SPP Bandung Hub', 'KCU Bandung Gateway', 'MPC Jakarta Gateway', 'KCP UNPAR Logistics',
      'KCP ITB Research Express', 'AGEN ARVINET Center', 'KCP Padalarang Hub', 'SPP Surabaya Gateway',
      'KCU Semarang Logistics', 'MPC Tangerang Hub', 'KCP Cimahi Selatan Intake', 'KCU Soreang Drop Point'
    ];

    const services = ['Pos Reguler', 'Pos Nextday', 'Pos Sameday'];
    const states = ['LOADED', 'IN_TRANSIT', 'DELIVERED', 'INVEHICLE', 'ENTRY'];

    const originNodes = [
      { nopen: '40511', name: 'KCU Cimahi' },
      { nopen: '40521', name: 'KCP Cimahi Selatan' },
      { nopen: '40395C1', name: 'AGEN ARVINET' },
      { nopen: '40553', name: 'KCP Padalarang' },
      { nopen: '40000', name: 'KCU Bandung' },
      { nopen: '40900', name: 'KCU Soreang' }
    ];

    const destNodes = [
      { nopen: '40400', name: 'SPP Bandung' },
      { nopen: '10000', name: 'MPC Jakarta Gateway' },
      { nopen: '40000', name: 'KCU Bandung' },
      { nopen: '40553', name: 'KCP Padalarang' },
      { nopen: '40141C3', name: 'KCP UNPAR' },
      { nopen: '40135U1', name: 'KCP ITB' }
    ];

    const cargoB9910 = [];
    const transactionsToInsert = [];
    const trackingEventsToInsert = [];

    console.log('📌 Generating 100 connote transactions...');
    for (let i = 1; i <= 100; i++) {
      const padNum = String(i).padStart(6, '0');
      const connoteCode = `P260812${padNum}`;
      const bookingCode = `BK-${connoteCode}`;

      const originObj = originNodes[(i - 1) % originNodes.length];
      const destObj = destNodes[i % destNodes.length];
      const sender = senders[i % senders.length];
      const receiver = receivers[i % receivers.length];
      const service = services[i % services.length];
      const state = states[i % states.length];
      const weightKg = Number((1.5 + (i * 0.85) % 45.0).toFixed(1));
      const amount = 15000 + (Math.floor(weightKg) * 8000);

      // Distribute stop sequences across 6-stop waypoints for B 9910 PCX (Terminal Akhir: Stop #6 SPP Bandung)
      const loadedSeq = ((i - 1) % 5) + 1;
      const unloadedSeq = 6;

      const cargoItem = {
        connote_code: connoteCode,
        weight_kg: weightKg,
        origin_nopen: originObj.nopen,
        destination_nopen: destObj.nopen,
        loaded_at_seq: loadedSeq,
        unloaded_at_seq: unloadedSeq,
        sender_name: sender,
        receiver_name: receiver
      };

      if (i <= 35) {
        cargoB9910.push(cargoItem);
      }

      // 1. Transaction Document
      const txDoc = {
        connote_code: connoteCode,
        connote: {
          connote_code: connoteCode,
          connote_booking_code: bookingCode,
          connote_service: service,
          connote_amount: amount,
          actual_weight: weightKg,
          connote_state: state,
          connote_sender_name: sender,
          connote_receiver_name: receiver,
          connote_receiver_address: `Jl. Raya Pos No. ${i * 12}, ${destObj.name}`,
          created_at: `12/08/2026 08:${String(i % 60).padStart(2, '0')}`
        },
        location_data_created: {
          location_name: originObj.name,
          custom_field: {
            destination_nopen: destObj.nopen,
            origin_nopen: originObj.nopen
          }
        },
        custom_field: {
          destination_nopen: destObj.nopen,
          origin_nopen: originObj.nopen
        },
        createdAt: new Date(`2026-08-12T08:${String(i % 60).padStart(2, '0')}:00.000Z`)
      };

      transactionsToInsert.push(txDoc);

      // 2. Tracking Event Document
      const trackingDoc = {
        event_id: `EVT-20260812-${connoteCode}`,
        connote_code: connoteCode,
        event_type: state,
        event_datetime: new Date(`2026-08-12T08:${String(i % 60).padStart(2, '0')}:00.000Z`),
        office_code: originObj.nopen,
        office_name: originObj.name,
        route_code: 'RT-MALAM-B9910-PCX',
        vehicle_code: 'B 9910 PCX',
        stop_sequence: loadedSeq,
        weight_kg: weightKg,
        origin_office: originObj.nopen,
        destination_office: destObj.nopen,
        import_batch_id: 'BATCH-20260812-SIM100',
        source: 'SYSTEM_SIMULATION',
        createdAt: new Date()
      };

      trackingEventsToInsert.push(trackingDoc);
    }

    // Write 100 Transactions into `transaksi`
    for (const tx of transactionsToInsert) {
      await db.collection('transaksi').replaceOne(
        { connote_code: tx.connote_code },
        tx,
        { upsert: true }
      );
    }
    console.log(`   -> Successfully written 100 transactions into MongoDB "transaksi" collection.`);

    // Write Tracking Events
    for (const evt of trackingEventsToInsert) {
      await db.collection('tracking_events').replaceOne(
        { event_id: evt.event_id },
        evt,
        { upsert: true }
      );
    }
    console.log(`   -> Successfully written 100 tracking events into MongoDB "tracking_events" collection.`);

    // 3. Upsert Today's Active Route Journey for B 9910 PCX
    const journeyB9910Today = {
      journey_id: 'JRN-20260812-B9910PCX-001',
      vehicle_nopol: 'B 9910 PCX',
      route_id: 'RT-MALAM-B9910-PCX',
      status: 'IN_PROGRESS',
      current_stop_seq: 4,
      maximum_capacity_kg: 1500,
      shift: 'MALAM',
      tanggal_operasional: targetDateStr,
      journey_date: targetDateObj,
      cargo: cargoB9910,
      updated_at: new Date()
    };

    await db.collection('route_journeys').replaceOne(
      { journey_id: 'JRN-20260812-B9910PCX-001' },
      journeyB9910Today,
      { upsert: true }
    );
    console.log(`   -> Successfully created active route_journey "JRN-20260812-B9910PCX-001" for 12 Aug 2026 with ${cargoB9910.length} loaded packages.`);

    // 4. Upsert Today's Active Route Journey for B 9945 PCY
    const journeyB9945Today = {
      journey_id: 'JRN-20260812-B9945PCY-001',
      vehicle_nopol: 'B 9945 PCY',
      route_id: 'RT-MALAM-B9945-PCY-PU1',
      status: 'IN_PROGRESS',
      current_stop_seq: 2,
      maximum_capacity_kg: 4000,
      shift: 'MALAM',
      tanggal_operasional: targetDateStr,
      journey_date: targetDateObj,
      cargo: transactionsToInsert.slice(35, 60).map((t, idx) => ({
        connote_code: t.connote_code,
        weight_kg: t.connote.actual_weight,
        origin_nopen: '40000',
        destination_nopen: '10000',
        loaded_at_seq: 1,
        unloaded_at_seq: 4,
        sender_name: t.connote.connote_sender_name,
        receiver_name: t.connote.connote_receiver_name
      })),
      updated_at: new Date()
    };

    await db.collection('route_journeys').replaceOne(
      { journey_id: 'JRN-20260812-B9945PCY-001' },
      journeyB9945Today,
      { upsert: true }
    );
    console.log(`   -> Successfully created active route_journey "JRN-20260812-B9945PCY-001" for 12 Aug 2026.`);

    console.log('\n================================================================');
    console.log('🎉 100 SIMULATION TRANSACTIONS FOR 12 AUGUST 2026 CREATED SUCCESSFULLY!');
    console.log('================================================================');

    await DbConnection.disconnect();
  } catch (e) {
    console.error('❌ Error seeding simulation data:', e);
  }
}

seedSimulasi100();
