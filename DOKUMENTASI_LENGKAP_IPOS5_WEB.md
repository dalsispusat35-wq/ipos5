# 📦 DOKUMENTASI LENGKAP & SPESIFIKASI TEKNIS APLIKASI WEB IPOS5
## Integrated Postal Operational System Redesign (Cimahi Origin Delivery & Control Tower)

> **Sistem:** IPOS5 Redesign (Web Enterprise Control Tower & Logistics Suite)  
> **Pemilik Sistem:** PT Pos Indonesia (Persero) — KCU Cimahi 40500 & SPP Bandung 40400  
> **Versi Dokumentasi:** 3.5.0 (Full Production, Multi-Device Universal Responsive & MongoDB Integration)  
> **Tanggal Rilis:** 26 Agustus 2026  
> **Arsitektur:** Cross-Platform Web SPA (React 19 + Vite 8) + REST & WebSocket API (Express Node.js) + Database MongoDB (`ipos5_reporting`)

---

## 📑 DAFTAR ISI

1. [Bab 1: Ringkasan Eksekutif & Arsitektur Sistem](#bab-1-ringkasan-eksekutif--arsitektur-sistem)
   - 1.1 Visi Produk & Latar Belakang
   - 1.2 Tech Stack & Ekosistem Teknologi
   - 1.3 Diagram Arsitektur & Alur Logistik
2. [Bab 2: Arsitektur Basis Data MongoDB (`ipos5_reporting`)](#bab-2-arsitektur-basis-data-mongodb-ipos5_reporting)
   - 2.1 Konfigurasi Koneksi & Remote Cluster
   - 2.2 Skema 12 Koleksi MongoDB Terperinci
   - 2.3 Prinsip Transaksi Atomik (ACID Session Transactions)
   - 2.4 Strategi Pengindeksan & Optimasi Query
3. [Bab 3: Dokumentasi Backend REST API & WebSocket](#bab-3-dokumentasi-backend-rest-api--websocket)
   - 3.1 Otentikasi & Autorisasi (JWT & RBAC)
   - 3.2 Endpoint Transaksi, Tracking & Manifesting
   - 3.3 Endpoint Armada, GPS Telemetri & Simulasi
   - 3.4 Endpoint Master Data & Kalender Jadwal
4. [Bab 4: Dokumentasi Lengkap Modul Web Frontend (16 Halaman + 5 Modal)](#bab-4-dokumentasi-lengkap-modul-web-frontend)
   - 4.1 Login & Autentikasi RBAC (`Login.jsx`)
   - 4.2 Dashboard Eksekutif & Real-time KPI (`Dashboard.jsx`)
   - 4.3 Package Tracking & Connote Checker (`Checker.jsx`)
   - 4.4 Invoices & Data Transaksi Resi (`Transaksi.jsx`)
   - 4.5 Armada & Fleet Management (`MasterKendaraan.jsx` & `VehicleDetailModal.jsx`)
   - 4.6 Live GPS Radar & Peta Rute Riil (`LiveGpsMapModal.jsx`)
   - 4.7 Gate & Transit Inbound Monitoring Kanban (`GateMonitoring.jsx`)
   - 4.8 Master Kantor Pos & Nopend (`MasterKantor.jsx`)
   - 4.9 Master Rute & Koridor Logistik (`MasterRoute.jsx` & `RouteDetailModal.jsx`)
   - 4.10 Master Produk Layanan POSIND (`MasterProduk.jsx`)
   - 4.11 Jadwal Transportasi Bulanan (`JadwalTransportasi.jsx`)
   - 4.12 Jadwal Pickup Loket (`JadwalPickup.jsx`)
   - 4.13 Template Jadwal Mingguan (`TemplateJadwal.jsx`)
   - 4.14 Estimasi Rute Milk Run & Anti-Overload (`EstimasiMilkRun.jsx`)
   - 4.15 Route Journey Active Telemetry (`RouteJourney.jsx`)
   - 4.16 Laporan Analitik SLA Regional (`AnalyticsReport.jsx`)
   - 4.17 MongoDB Compass GUI Internal (`Compass.jsx`)
   - 4.18 Pengaturan Koneksi Sistem (`Settings.jsx`)
   - 4.19 Profil Pengguna & Log Audit (`Profile.jsx`)
   - 4.20 Pusat Notifikasi Sistem (`NotificationDrawer.jsx`)
   - 4.21 Import CSV Data Pengiriman (`CsvImportModal.jsx`)
5. [Bab 5: Arsitektur Desain Responsif & Interaktivitas Universal](#bab-5-arsitektur-desain-responsif--interaktivitas-universal)
   - 5.1 Sistem Breakpoint 6-Tier (HP, iPad, Tablet, Laptop, Ultra-Wide)
   - 5.2 Floating Mobile Bottom Navigation Bar (Tab Bar)
   - 5.3 Universal Responsive Table Container
   - 5.4 Micro-Animations & Live Pulse Telemetry
6. [Bab 6: Panduan Instalasi, Setup Lingkungan & Deployment](#bab-6-panduan-instalasi-setup-lingkungan--deployment)
7. [Bab 7: Standar Operasional Prosedur Pengguna (SOP Berdasarkan Peran)](#bab-7-standar-operasional-prosedur-pengguna-sop-berdasarkan-peran)

---

## BAB 1: RINGKASAN EKSEKUTIF & ARSITEKTUR SISTEM

### 1.1 Visi Produk & Latar Belakang
Platform **IPOS5 Redesign** dibangun sebagai pusat kendali (*Control Tower*) terintegrasi untuk operasi logistik PT Pos Indonesia (Persero), khususnya pada koridor strategis **KCU Cimahi 40500 → Hub Transit SPP Bandung 40400 → SPP Tujuan Nasional**.

Platform ini menyelesaikan tantangan operasional utama:
1. **Load Partitioning & Pencegahan Overload Armada:** Membatasi muatan fisik armada box (misal: B 9910 PCX) pada batas aman **1.500 kg (100% Utilisasi - SAFE)** dan membagi muatan berlebih (contoh: 12,9 Ton) ke dalam trip-trip lanjutan secara otomatis.
2. **Otomasi Konsolidasi Manifest (3 Checkpoint Gate Monitoring):** Menggantikan pencatatan manual buku ekspedisi dengan alur terpadu Checkpoint 1 (Bagging/Manifesting), Checkpoint 2 (Inbound Transit SPP Bandung), dan Checkpoint 3 (Arrival & POD Delivery).
3. **State Machine Status Linier yang Terkunci:** Menjamin transisi status paket berjalan urut:
   `DITERIMA_DI_CIMAHI` → `IN_MANIFEST` → `TRANSIT_SPP_BANDUNG` → `TIBA_DI_SPP_TUJUAN` → `DELIVERED`.
4. **Visibilitas GPS & Estimasi Kedatangan (ETA) Real-time:** Peta jalur OpenStreetMap dengan polylines riil koordinat kantor pos dan simulator waypoint Milk Run dengan pengaturan kecepatan (20/40/80 km/jam).
5. **Universal Responsive Experience:** Pengalaman konsisten, modern, dan sangat estetis di semua perangkat (iPhone, Android, iPad, Tablet, Laptop, Desktop).

### 1.2 Tech Stack & Ekosistem Teknologi
- **Frontend Core:** React 19.2, Vite 8.1, React Router DOM v6
- **Styling & Design System:** Vanilla CSS Modern dengan Variabel Desain Token, Glassmorphism, Dark/Light Mode Engine, Micro-Animations, dan Sistem Breakpoint 6-Tier.
- **Visualisasi & Ikon:** Leaflet 1.9.4 (Peta GIS), Lucide React (Ikon Vektor), Google Fonts (*Plus Jakarta Sans* & *JetBrains Mono*).
- **Backend API:** Node.js, Express.js, MongoDB Native Driver / Mongoose, JWT Authentication, bcryptjs, CSV Parser.
- **Database:** MongoDB Cluster Remote (`ipos5_reporting`).

---

## BAB 2: ARSITEKTUR BASIS DATA MONGODB (`ipos5_reporting`)

### 2.1 Konfigurasi Koneksi & Remote Cluster
- **Database Name:** `ipos5_reporting`
- **Driver:** Mongoose / MongoDB Native NodeJS Driver
- **Connection Manager:** Dikelola dinamis oleh `DbConnection.js` dengan konfigurasi di `connections.json` sehingga URI dapat dialihkan tanpa me-restart server.

### 2.2 Skema 12 Koleksi MongoDB Terperinci

| No | Nama Koleksi | Deskripsi & Peran Utama | File Controller Terkait |
| :--- | :--- | :--- | :--- |
| 1 | `transaksi` | Menyimpan seluruh data resi paket kiriman, berat, layanan, tarif, pengirim, penerima, dan status linier. | `TransactionController.js` |
| 2 | `master_kendaraan` | Profil armada truk/mobil: nopol, nama kendaraan, jenis, kapasitas maksimal (kg), driver, home base. | `KendaraanController.js` |
| 3 | `master_kantor` | Direktori 13.000+ kantor pos se-Indonesia (Nopend, nama kantor, tipe jaringan KCU/KC/KCP/Agenpos, koordinat GPS lat/lng). | `OfficeController.js` |
| 4 | `detail_route` | Titik-titik perhentian (*waypoints*) urut per koridor rute dengan nopen, nama stop, urutan sequence, dan status. | `RouteController.js` |
| 5 | `master_route_nopen` | Header rute operasional logistik, menghubungkan nopen asal ke nopen tujuan. | `RouteController.js` |
| 6 | `route_journeys` | Catatan perjalanan dinamis per armada per tanggal, muatan aktif, dan waypoint yang sudah diselesaikan. | `RouteJourneyController.js` |
| 7 | `manifests` | Data master manifest bagging kantong kiriman yang mengkonsolidasikan puluhan resi paket. | `ManifestController.js` |
| 8 | `jadwal_transportasi` | Jadwal perjalanan trip armada harian/bulanan beserta penugasan rute. | `JadwalTransportasiController.js` |
| 9 | `template_jadwal_transportasi`| Template jadwal operasional rutin mingguan sebagai pola generate jadwal. | `TemplateJadwalController.js` |
| 10 | `tracking_events` | Log riwayat audit perjalanan (*audit trail*) kronologis per connote resi. | `TransactionController.js` |
| 11 | `users` | Akun pengguna sistem terotentikasi (username, password hash bcrypt, role RBAC, NIP, kantor cabang). | `AuthController.js` |
| 12 | `master_produk` | Katalog layanan produk resmi PT Pos Indonesia (Pos Nextday, Pos Reguler, Jumbo Cargo, dll). | `MasterProdukController.js` |

### 2.3 Prinsip Transaksi Atomik (ACID Session Transactions)
Seluruh proses konsolidasi paket menjadi manifest pada Gate Monitoring menggunakan **MongoDB Session Transactions**:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Buat dokumen manifest baru
  await Manifest.create([manifestData], { session });
  // 2. Update status semua resi di dalam manifest
  await Transaksi.updateMany(
    { connote_code: { $in: connoteList } },
    { $set: { connote_state: 'IN_MANIFEST', manifest_id: newManifestId } },
    { session }
  );
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## BAB 3: DOKUMENTASI BACKEND REST API & WEBSOCKET

### 3.1 Endpoint Otentikasi & Akun
- `POST /api/auth/login`: Otentikasi username & password, mengembalikan token JWT dan profil user.
- `GET /api/auth/me`: Mengambil data sesi pengguna aktif berdasarkan header `Authorization: Bearer <token>`.
- `POST /api/auth/logout`: Membersihkan sesi aktif pengguna.

### 3.2 Endpoint Transaksi & Tracking
- `GET /api/dashboard-stats?datePreset=today`: Menghitung total paket, active, completed, returned, dan estimasi pendapatan.
- `GET /api/checker/:code?date=YYYY-MM-DD`: Pencarian ganda (Nomor Resi / Plat Nomor Kendaraan) dengan data rute lengkap.
- `GET /api/transaksi?limit=25&page=1&status=...`: Pencarian multi-parameter data kiriman dengan pagination.

### 3.3 Endpoint Armada & Rute
- `GET /api/kendaraan`: Mengambil seluruh daftar armada beserta status utilisasi muatan.
- `GET /api/kendaraan/:nopol/detail`: Detail komprehensif armada, manifest aktif, dan riwayat muatan.
- `GET /api/master/routes`: Mengambil seluruh master rute dan daftar waypoint.

### 3.4 Endpoint Gate Monitoring & Checkpoint
- `GET /api/gate/pipeline`: Mengambil status paket pada 3 checkpoint gate (Stage 1, Stage 2, Stage 3).
- `POST /api/gate/manifest`: Membentuk manifest baru dari paket terpilih.
- `POST /api/gate/transit`: Melakukan scan-in transit massal di SPP Bandung 40400.
- `POST /api/gate/deliver`: Konfirmasi serah terima akhir paket menjadi `DELIVERED`.

---

## BAB 4: DOKUMENTASI LENGKAP MODUL WEB FRONTEND

### 4.1 Login & Autentikasi RBAC (`Login.jsx`)
- **Route:** `/login`
- **Fitur Utama:** Form login modern, auto-fill demo akun (*Admin, Supervisor, Dispatcher, Loket*), verifikasi keamanan token, dan proteksi rute (`RequireAuth`).

### 4.2 Dashboard Eksekutif & Real-time KPI (`Dashboard.jsx`)
- **Route:** `/`
- **Fitur Utama:**
  - 5 Kartu KPI Pastel (Total Shipments, Active, Completed, Returned, Freight Value).
  - Date Preset Dropdown (Hari Ini, 7 Hari, 30 Hari, Kustom).
  - Grafik Batang Volume Pengiriman & Donut Chart Layanan.
  - Tabel Telemetri Live Connotes dengan status berdenyut (*pulsing badge*).

### 4.3 Package Tracking & Connote Checker (`Checker.jsx`)
- **Route:** `/checker`
- **Fitur Utama:**
  - Dual Mode: Pencarian Nomor Resi (`P2608...`) atau Plat Truk (`B 9910 PCX`).
  - Chips Sampel Resi Database yang dapat digeser (*swipeable*).
  - Stepper visualisasi rute multi-stop transit.
  - Accordion rincian paket per kantor tujuan dengan kontrol pagination.

### 4.4 Invoices & Data Transaksi Resi (`Transaksi.jsx`)
- **Route:** `/transaksi`
- **Fitur Utama:** Filter pencarian multi-kriteria (Layanan, KPRK, Regional, Nopol, Tanggal), sorting kolom, dan ekspor data laporan.

### 4.5 Armada & Fleet Management (`MasterKendaraan.jsx`)
- **Route:** `/kendaraan`
- **Fitur Utama:** Direktori armada operasional, bar meteran kapasitas muatan (*Load Gauge*), form tambah/edit armada, dan modal cockpit rincian kendaraan (`VehicleDetailModal.jsx`).

### 4.6 Live GPS Radar & Peta Rute Riil (`LiveGpsMapModal.jsx`)
- **Komponen:** Modal Radar GPS OpenStreetMap
- **Fitur Utama:** Visualisasi jalur rute polylines, marker koordinat kantor pos terverifikasi, kontrol simulasi pergerakan truk, tombol cepat WhatsApp dan Telepon ke supir.

### 4.7 Gate & Transit Inbound Monitoring Kanban (`GateMonitoring.jsx`)
- **Route:** `/transit-monitoring`
- **Fitur Utama:** Pipeline 3 Checkpoint operasional logistik:
  - Checkpoint 1: Pembuatan Manifest & Bagging Outbound Cimahi.
  - Checkpoint 2: Inbound Transit SPP Bandung 40400.
  - Checkpoint 3: Kedatangan SPP Tujuan & POD Final.

### 4.8 Master Kantor Pos & Nopend (`MasterKantor.jsx`)
- **Route:** `/kantor`
- **Fitur Utama:** Pencarian 13.000+ kantor pos, filter tipe jaringan (KCU, KC, KCP, Agenpos), koordinat GPS lat/lng, dan status verifikasi fisik.

### 4.9 Master Rute & Koridor Logistik (`MasterRoute.jsx`)
- **Route:** `/route`
- **Fitur Utama:** Manajemen rute pengiriman, urutan stop sequence, autocomplete nopend kantor pos, dan modal rincian rute (`RouteDetailModal.jsx`).

### 4.10 Master Produk Layanan POSIND (`MasterProduk.jsx`)
- **Route:** `/produk`
- **Fitur Utama:** Katalog produk pos (Sameday, Nextday, Reguler, Jumbo Cargo, Pos Shopee) dengan tombol toggle status aktif.

### 4.11 Jadwal Transportasi Bulanan (`JadwalTransportasi.jsx`)
- **Route:** `/jadwal`
- **Fitur Utama:** Kalender jadwal perjalanan armada 7 hari interaktif dengan generator jadwal bulanan otomatis.

### 4.12 Jadwal Pickup Loket (`JadwalPickup.jsx`)
- **Route:** `/jadwal-pickup`
- **Fitur Utama:** Pemantauan jadwal penjemputan rutin ke loket agenpos dan KCP feeder.

### 4.13 Template Jadwal Mingguan (`TemplateJadwal.jsx`)
- **Route:** `/template`
- **Fitur Utama:** Konfigurasi template jadwal rutin mingguan per armada.

### 4.14 Estimasi Rute Milk Run & Anti-Overload (`EstimasiMilkRun.jsx`)
- **Route:** `/estimasi`
- **Fitur Utama:** Simulator rute Milk Run dengan kalkulasi ETA kedatangan presisi, slider kecepatan armada (20/40/80 km/jam), dan pemisahan antrean muatan berlebih.

### 4.15 Route Journey Active Telemetry (`RouteJourney.jsx`)
- **Route:** `/route-journey`
- **Fitur Utama:** Telemetri aktif perjalanan armada harian dan status transit per stop.

### 4.16 Laporan Analitik SLA Regional (`AnalyticsReport.jsx`)
- **Route:** `/analytics`
- **Fitur Utama:** Grafik garis persentase SLA Regional dengan skala jujur 0%–100% dan fasilitas unduh laporan format CSV/Spreadsheet.

### 4.17 MongoDB Compass GUI Internal (`Compass.jsx`)
- **Route:** `/compass` (Khusus SUPER_ADMIN)
- **Fitur Utama:** Penampil GUI koleksi MongoDB internal, jumlah dokumen, dan query inspeksi JSON langsung dari antarmuka web.

### 4.18 Pengaturan Koneksi Sistem (`Settings.jsx`)
- **Route:** `/settings` (Khusus SUPER_ADMIN)
- **Fitur Utama:** Penggantian target URI string koneksi MongoDB secara instan tanpa perlu restart server.

### 4.19 Profil Pengguna & Log Audit (`Profile.jsx`)
- **Route:** `/profile`
- **Fitur Utama:** Informasi otoritas akun, manajemen user CRUD (khusus admin), log riwayat aktivitas, dan tema visual.

### 4.20 Pusat Notifikasi Real-time (`NotificationDrawer.jsx`)
- **Komponen:** Drawer Notifikasi Atas
- **Fitur Utama:** Peringatan kapasitas armada, notifikasi status keterlambatan SLA, dan peringatan koneksi database.

### 4.21 Import CSV Data Pengiriman (`CsvImportModal.jsx`)
- **Komponen:** Modal Import Data
- **Fitur Utama:** Fasilitas import file CSV data connote harian untuk pengujian sistem secara cepat.

---

## BAB 5: ARSITEKTUR DESAIN RESPONSIF & INTERAKTIVITAS UNIVERSAL

### 5.1 Sistem Breakpoint 6-Tier
Antarmuka IPOS5 mendukung seluruh spektrum resolusi perangkat tanpa distorsi:
- **XS (< 480px):** Smartphone ringkas (iPhone SE, Galaxy A). Layout 1 kolom, padding kompak, font fluid.
- **SM (480px – 640px):** Smartphone besar (iPhone Pro Max, Android Plus).
- **MD (640px – 768px):** Tablet kecil & Phablet.
- **LG (768px – 1024px):** iPad Portrait & Tablet 10–11". Split master-detail otomatis bertransisi menjadi format stacked.
- **XL (1024px – 1280px):** iPad Pro Landscape & Laptop 13".
- **2XL (> 1280px):** Desktop Monitor & Layar Ultra-Wide.

### 5.2 Floating Mobile Bottom Navigation Bar
Pada layar mobile (`<= 768px`), sistem memunculkan bilah navigasi bawah (*bottom bar*) mengambang bergaya iOS/Android native dengan 5 menu utama:
1. 📊 **Overview** (`/`)
2. 🔍 **Tracking** (`/checker`)
3. 🧾 **Invoices** (`/transaksi`)
4. 🚚 **Armada** (`/kendaraan`)
5. ☰ **Menu Drawer** (Akses cepat seluruh modul operasional)

### 5.3 Universal Responsive Table Container (`.table-responsive-container`)
Seluruh tabel data panjang dilengkapi wrapper scroll momentum horizontal dengan header tetap (*sticky header*) sehingga tabel tidak pernah merusak padding viewport pada smartphone.

---

## BAB 6: PANDUAN INSTALASI, SETUP LINGKUNGAN & DEPLOYMENT

### 6.1 Prasyarat Sistem
- Node.js versi 18.x / 20.x LTS
- NPM versi 9.x / 10.x
- Akses basis data MongoDB `ipos5_reporting`

### 6.2 Langkah Menjalankan Server Backend
```bash
cd c:\ipos5edesign\server
npm install
npm start
# Server berjalan pada port 5000 (http://localhost:5000)
```

### 6.3 Langkah Menjalankan Client Frontend
```bash
cd c:\ipos5edesign\client
npm install
npm run dev
# Aplikasi web terbuka di http://localhost:5173
```

### 6.4 Langkah Build Produksi
```bash
cd c:\ipos5edesign\client
npm run build
# Hasil bundle produksi berada di direktori dist/
```

---

## BAB 7: STANDAR OPERASIONAL PROSEDUR PENGGUNA (SOP)

1. **SOP Petugas Loket (Counter Operator):**
   - Buka menu **Invoices & Transaksi** atau **Tracking Checker**.
   - Input nomor resi pengiriman paket dari pelanggan.
   - Pastikan status awal tercatat sebagai `DITERIMA_DI_CIMAHI`.
2. **SOP Dispatcher (Outbound Manifesting):**
   - Buka menu **Gate & Transit Monitoring** → **Checkpoint 1**.
   - Pilih paket-paket yang siap diberangkatkan ke SPP Bandung.
   - Klik **Cetak & Finalisasi Manifest** untuk menerbitkan kode manifest (`MNF...`).
3. **SOP Petugas Transit SPP Bandung 40400:**
   - Buka menu **Gate & Transit Monitoring** → **Checkpoint 2**.
   - Scan kode manifest truk yang tiba di gerbang masuk.
   - Klik **Scan Masuk Inbound Transit** untuk memperbarui status seluruh isi paket.
4. **SOP Petugas Hub Tujuan / Kurir Antaran:**
   - Buka menu **Gate & Transit Monitoring** → **Checkpoint 3**.
   - Konfirmasi serah terima fisik paket dan selesaikan status menjadi `DELIVERED`.
5. **SOP Supervisor & Super Admin:**
   - Pantau KPI harian pada **Dashboard Operasional** dan **Laporan Analitik SLA**.
   - Lakukan penyesuaian master data armada, rute, dan jadwal bila diperlukan.

---
*Dokumen ini diterbitkan secara resmi sebagai acuan arsitektur, pemeliharaan teknis, dan pengoperasian sistem IPOS5 Redesign PT Pos Indonesia (Persero).*
