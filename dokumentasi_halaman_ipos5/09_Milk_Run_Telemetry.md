# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 9 — MILK RUN TELEMETRY & EXECUTION

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Milk Run Telemetry & Execution (/route-journey) |
| **Kategori Menu** | LOGISTICS / REAL-TIME OPERATIONS |
| **Route URL** | /route-journey |
| **File Komponen React** | src/pages/RouteJourney.jsx |
| **Backend API Endpoints** | GET /api/route-journeys/active, POST /api/route-journeys/start, POST /api/route-journeys/:id/process-stop/:seq, GET /api/kendaraan/capacity/:nopol |
| **Koleksi MongoDB** | route_journeys, detail_route, transaksi, master_kantor, master_kendaraan |
| **Hak Akses Role** | Operator, Dispatcher, & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Milk Run Telemetry merupakan jantung dari eksekusi perjalanan armada pengumpul logistik multi-stop (feeder pickup run). Modul ini menangani simulasi dan eksekusi ACID transaction penambahan muatan di setiap kantor pos persinggahan (Stop 1 sampai Stop 10) secara berurutan, memantau utilisasi beban kg vs daya tampung 1.500 kg, serta mendeteksi stop yang dilewati (skipped).

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Milk Run Telemetry & Execution disusun dalam urutan alur kontrol operasional:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] TOP HEADER & CONTEXT STRIP                                                                          |
| - Judul: "Visualisasi Rute Milk Run Logistics (Telemetri Armada B 9910 PCX)"                            |
| - Context Chips: Armada [B 9910 PCX] | Shift [MALAM 16.00–21.00] | Tujuan [SPP BANDUNG 40400]           |
| - Action Buttons: [▶ Lanjut ke Stop Berikutnya]  |  [🔄 Reset Rute]                                     |
+---------------------------------------------------------------------------------------------------------+
| [B1] Current Stop Location        | [B2] Vehicle Load Meter           | [B3] Remaining Capacity         |
|      AGEN ARVINET (40395C1)       |      468 kg / 1500 kg (31%)       |      1032 kg Tersedia           |
|      Muatan Masuk: +240 kg        |      [||||||||||                ] |      Status: NORMAL AMAN        |
+-----------------------------------+-----------------------------------+---------------------------------+
| [C] VISUAL MILK RUN SEQUENCE MAP & STEPPER (10 Waypoints Path)                                          |
| [1. AGP ONG] -> [2. ARVINET]* -> [3. CICALENGKA] -> [4. CIPARAY] -> [5. MAJALAYA] -> [6. KCP MAJALAYA]  |
| -> [7. AGP OMEGA] -> [8. CILEUNYI] -> [9. CINUNUK] -> [10. SPP BANDUNG 40400 (Tujuan Akhir)]            |
| (*Node Status Badges: COMPLETED [✓], CURRENT ACTIVE [🚚], WAITING [⏳], SKIPPED [✕])                     |
+---------------------------------------------------------------------------------------------------------+
| [D] WAYPOINT MANIFEST & ACID LOAD VALIDATION TABLE                                                      |
| - Tabel Urutan Stop, Nopend, Nama Kantor, Status Singgah, Muatan Masuk (kg), Kumulatif Beban, Validasi  |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Top Header & Controls** | Header Context Strip | Menampilkan judul modul, informasi armada (B 9910 PCX Gran Max 1.5 Ton), shift kerja (Malam 16.00-21.00 WIB), tujuan akhir, dan tombol eksekusi perjalanan. | Dokumen `route_journeys` aktif | Tombol '▶ Lanjut ke [Nama Stop]' memajukan armada ke stop berikutnya, tombol '🔄 Reset Rute' mengembalikan posisi ke titik awal. |
| **Kotak [B1]: Current Stop Location Card** | Telemetry KPI Card Kiri | Menampilkan nama kantor pos lokasi armada saat ini berada (e.g. AGEN ARVINET 40395C1) dan jumlah muatan masuk di stop ini (+240 kg). | Array `stops[currentStopIndex]` | Memberikan kepastian posisi armada terkini. |
| **Kotak [B2]: Vehicle Load Meter Card** | Telemetry KPI Card Tengah | Menghitung total berat muatan yang sedang berada di dalam boks mobil (468 kg / 1500 kg) beserta bar visual persentase utilisasi (31%). | Field `capacityData.total_berat_terpakai_kg` | Bar berubah warna dari Hijau (<70%), Kuning (70-90%), hingga Merah (>90%). |
| **Kotak [B3]: Remaining Capacity Card** | Telemetry KPI Card Kanan | Menampilkan sisa daya tampung mobil yang masih aman dimuati paket (1.032 kg) dan status keselamatan beban (NORMAL AMAN). | Kalkulasi `maxCapacity - currentLoad` | Memastikan armada tidak mengalami overcapacity. |
| **Kotak [C]: Visual Milk Run Stepper Track** | Sequential Stepper Path (10 Stop Nodes) | Memvisualisasikan alur 10 stasiun singgah: 1. AGP Ong (Skipped), 2. Arvinet (Aktif), 3. Cicalengka, 4. Ciparay, 5. Majalaya, 6. KCP Majalaya, 7. AGP Omega (Skipped), 8. Cileunyi, 9. Cinunuk, 10. SPP Bandung (Tujuan Akhir). | Koleksi `detail_route` & status perjalanan | Node memiliki penanda status: COMPLETED (Centang Hijau), CURRENT ACTIVE (Truk Bergerak), WAITING (Jam Pasir), SKIPPED (Silang Abu-abu), DESTINATION (Bendera Finis). |
| **Kotak [D]: Waypoint Manifest Table** | Tabel Rincian Muatan per Stop | Tabel rincian beban muatan di setiap perhentian kantor pos, mencakup volume kg paket yang diangkut, akumulasi kargo di mobil, dan status transaksi MongoDB. | Array `stops` & data kargo | Transparansi audit muatan di setiap titik singgah rantai pasok pos. |

## 3. Aturan Bisnis & ACID Idempotency Transaction

- Transaksi Atomik MongoDB: Setiap pemrosesan stop mengeksekusi ACID transaction untuk mengunci dokumen journey dan mengupdate status resi secara atomik.
- Penanganan Skip Stop: Sistem otomatis melompati (skip) agen pos yang tidak memiliki paket pickup tanpa menghentikan kelanjutan rute.
- Proteksi Idempotensi: Menggunakan Idempotency Key unik untuk mencegah pemrosesan muatan ganda saat koneksi jaringan tidak stabil.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator memantau armada B 9910 PCX yang sedang menjalankan rute Pickup Malam.
- 2. Setiap kali armada tiba dan selesai memuat paket di suatu kantor pos, operator mengklik tombol 'Lanjut ke Stop Berikutnya'.
- 3. Sistem memperbarui meteran beban muatan (kg) dan memajukan indikator truk pada stepper rute.
- 4. Saat tiba di SPP Bandung (Stop 10), sistem menandai perjalanan selesai dan siap diproses di Gate Monitoring.
