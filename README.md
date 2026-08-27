# 📦 IPOS5: Cimahi Origin Delivery System & Telemetry Engine

Sistem Manajemen Operasional Logistik, Analitik Real-Time, dan Pemantauan Rute Pengiriman Otomatis PT Pos Indonesia (Khusus Kantor Cabang Utama Cimahi & SPP Bandung).

---

## 📑 Daftar Isi
- [1. Ringkasan Proyek](#1-ringkasan-proyek)
- [2. Stack Teknologi](#2-stack-teknologi)
- [3. Arsitektur & Struktur Direktori](#3-arsitektur--struktur-direktori)
- [4. Modul & Fitur Utama Aplikasi](#4-modul--fitur-utama-aplikasi)
- [5. Skema Database & Koleksi MongoDB](#5-skema-database--koleksi-mongodb)
- [6. Linear State Machine Status Kiriman](#6-linear-state-machine-status-kiriman)
- [7. Panduan Instalasi & Cara Menjalankan](#7-panduan-instalasi--cara-menjalankan)
- [8. Spesifikasi Endpoints API](#8-spesifikasi-endpoints-api)
- [9. Dokumentasi Modul Halaman](#9-dokumentasi-modul-halaman)

---

## 1. Ringkasan Proyek

**Cimahi Origin Delivery System (IPOS5 Redesign)** adalah aplikasi web logistik terintegrasi modern yang dirancang untuk merevolusi efisiensi operasional pengiriman barang dari KCU Cimahi menuju Sentral Pengolahan Pos (SPP) Bandung serta seluruh kantor tujuan di Indonesia.

Sistem ini menggabungkan:
- **Analitik Operasional Real-Time**: Agregasi data langsung dari basis data MongoDB dengan filter periode interaktif, grafik tren, dan modal *deep-dive breakdown* kategori layanan pos.
- **Konsolidasi & Gate Monitoring**: Otomatisasi pembentukan manifest bagging (Checkpoint 1), inbound transit (Checkpoint 2), dan penyelesaian *last-mile delivery* (Checkpoint 3).
- **Simulasi & Telemetri Rute Milk Run**: Algoritma partisi beban muatan truk (*load partitioning* 1.500 kg safe threshold), simulasi kecepatan armada, dan estimasi waktu tiba (ETA).
- **Real-Time Telemetry Simulator**: Simulator injeksi paket massal, pemindai barcode, dan *live stream dispatching* untuk stress-testing operasional.

---

## 2. Stack Teknologi

### Frontend Client (`redesign/client`)
* **Framework:** React 18 (Vite)
* **Routing:** React Router DOM v6
* **Icons:** Lucide React
* **Styling:** Vanilla CSS3 dengan Sistem Token **Navy Premium Theme** (Glassmorphic cards, Glowing cyan accents, HSL adaptive dark mode)
* **Port Standar:** `http://localhost:5173`

### Backend Server (`redesign/server`)
* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js
* **Database Driver:** MongoDB Native Driver (`mongodb`)
* **Keamanan & Transaksi:** MongoDB Session Transactions (ACID) untuk pembentukan & transit manifest
* **Port Standar:** `http://localhost:5002`

### Telemetry Simulator (`simulator`)
* **Framework:** React 18 (Vite)
* **Features:** Live Stream Connote Injector, Barcode Scanner, Bulk Generator
* **Port Standar:** `http://localhost:5174`

### Database
* **Engine:** MongoDB (Topologi Replica Set / Local Standalone Replica Set)
* **Database Target:** `ipos5_reporting`

---

## 3. Arsitektur & Struktur Direktori

```text
ipos5/
├── README.md                           # Dokumentasi Teknis Utama Proyek
├── PRD.md                              # Product Requirement Document
├── BRD.md                              # Business Requirement Document
├── FLUTTER_FULL_APP_GUIDE.md           # Panduan Implementasi Aplikasi Mobile Flutter
├── dokumentasi_halaman_ipos5/          # Dokumentasi 16 Halaman Lengkap (MD & DOCX)
│   ├── 00_INDEX_DOKUMENTASI_ALL_PAGES.md
│   ├── 01_Dashboard_Operasional.md
│   ├── ...
│   └── DOKUMENTASI_LENGKAP_ALL_PAGES_IPOS5.docx
│
├── api_docs/                           # Dokumentasi Spesifikasi OpenAPI / REST
│   └── API_DOCUMENTATION.md
│
├── redesign/
│   ├── client/                         # Web Application Frontend (React + Vite)
│   │   ├── dist/                       # Production Build Output
│   │   ├── src/
│   │   │   ├── pages/                  # 16 Halaman Utama Aplikasi
│   │   │   │   ├── Dashboard.jsx       # Analytics & Telemetry Dashboard
│   │   │   │   ├── Transaksi.jsx       # Connotes Database Viewer
│   │   │   │   ├── Checker.jsx         # Package Tracking Checker
│   │   │   │   ├── MasterKantor.jsx    # Master Data Kantor Pos
│   │   │   │   ├── MasterProduk.jsx    # Master Layanan Produk
│   │   │   │   ├── MasterKendaraan.jsx # Master Armada Kendaraan
│   │   │   │   ├── MasterRoute.jsx     # Master Rute Logistik
│   │   │   │   ├── JadwalPickup.jsx    # Monitoring Jadwal Pickup SPP
│   │   │   │   ├── TemplateJadwal.jsx  # Template Jadwal Transportasi
│   │   │   │   ├── JadwalTransportasi.jsx # Penjadwalan Bulanan Otomatis
│   │   │   │   ├── RouteJourney.jsx    # Milk Run Telemetry
│   │   │   │   ├── EstimasiMilkRun.jsx # Simulator Estimasi Milk Run
│   │   │   │   ├── GateMonitoring.jsx  # 3-Stage Gate Checkpoints
│   │   │   │   ├── AnalitikLaporan.jsx # Analisis SLA & Laporan Eksekutif
│   │   │   │   ├── Compass.jsx         # MongoDB GUI Viewer
│   │   │   │   ├── Settings.jsx        # Pengaturan Database & Server
│   │   │   │   └── Profile.jsx         # Manajemen Pengguna & Audit Trail
│   │   │   ├── components/             # Reusable UI Components & Modals
│   │   │   ├── utils/api.js            # Axios/Fetch API Integration Client
│   │   │   ├── App.jsx                 # App Layout, Sidebar & Navigation
│   │   │   └── index.css               # Design System & Token Styling
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── server/                         # Backend REST API Service (Node + Express)
│       ├── config/DbConnection.js      # Pool Koneksi MongoDB & Health Check
│       ├── controllers/                # OOP MVC Controllers
│       ├── models/                     # MongoDB Native Abstraction Models
│       ├── routes/api.js               # Route Express (/api/...)
│       ├── services/                   # Business Services & Analytics Pipeline
│       ├── scripts/                    # Script Migrasi, SQL Dump, & Doc Generators
│       ├── app.js                      # Entrypoint Express Server
│       └── package.json
│
└── simulator/                          # Simulator Injeksi Telemetri Kiriman
    ├── src/
    │   ├── components/
    │   │   ├── LiveStreamInjector.jsx  # Dispatcher Paket Real-Time
    │   │   ├── BarcodeScanner.jsx      # Barcode Camera & Manual Scanner
    │   │   └── BulkInjector.jsx        # Generator Data Massal
    │   └── App.jsx
    └── package.json
```

---

## 4. Modul & Fitur Utama Aplikasi

### 1. Dashboard Monitoring & Analytics (`Dashboard.jsx`)
- **5 KPI Metrics Real-Time:** Total Shipments, Active Shipments, Completed, Returned/Failed, serta Freight Revenue (Rp) & Throughput Tonase (Ton/kg).
- **Interactive Period Filter:** Pilihan rentang waktu cepat (*Hari Ini*, *Agustus 2026 Live DB*, *7 Hari Terakhir*, *30 Hari*, *Juli 2026*, *YTD 2026*, serta *Custom Date Range*).
- **Shipment & Sales Trend Visualizations:** Grafik batang tumpuk status paket dan kurva spline gradien volume dan omset rupiah.
- **Popular Categories Donut & Deep-Dive Modal:** Diagram donat SVG adaptif dengan tombol **"See All ↗"** yang membuka modal analitik komprehensif (KPI kategori, komparasi *market share*, live search, multi-criteria sorting, dan aksi *two-way cross filtering* ke dashboard utama).
- **Av. Check & Av. Delivery SLA Time Cards:** Peringkat nilai transaksi rata-rata per jenis layanan dan estimasi lead time pengiriman regional.
- **Live Connotes Telemetry Stream:** Tabel monitoring 20 connote terakhir dengan auto-polling 5 detik, tombol salin resi cepat, dan tautan *tracking checker*.

### 2. Database Viewer & Transaksi (`Transaksi.jsx`)
- Penelusuran data connotes dari database MongoDB dengan filter nomor resi, status pengiriman linier, layanan produk, dan tanggal.
- Fitur ekspor data transaksi dan modal detail informasi pengiriman & armada.

### 3. Package Tracking & Checker (`Checker.jsx`)
- Pelacakan posisi dan rute connote secara instan berdasarkan nomor resi.
- Visualisasi tahapan perjalanan (*audit trail*) dari kantor asal KCU Cimahi hingga SPP tujuan akhir.

### 4. Master Data Terintegrasi
- **Master Kantor (`MasterKantor.jsx`):** Manajemen data >13.000 Nopend kantor pos (KCU/KPRK/KCP) dengan pencarian cepat dan pagination.
- **Master Layanan Produk (`MasterProduk.jsx`):** Manajemen kode produk, nama layanan (Pos Sameday, Nextday, Reguler, Jumbo), dan tarif dasar.
- **Master Kendaraan (`MasterKendaraan.jsx`):** Pengelolaan armada truk, nopol kendaraan, kapasitas muat, dan status kesiapan operasi.
- **Master Rute Logistik (`MasterRoute.jsx`):** Pemetaan rute asal-tujuan beserta rangkaian *checkpoint waypoint*.

### 5. Jadwal & Manajemen Transportasi
- **Jadwal Pickup SPP (`JadwalPickup.jsx`):** Pemantauan rute pickup berkala dari SPP Bandung menuju KCU Cimahi dan KCP area beserta estimasi ETA tiap stop point.
- **Template Jadwal (`TemplateJadwal.jsx`):** Konfigurasi template ritase perjalanan mingguan armada.
- **Jadwal Transportasi Bulanan (`JadwalTransportasi.jsx`):** *Bulk-generation* jadwal operasional sebulan penuh otomatis dengan filter libur.

### 6. Telemetri & Simulasi Rute Milk Run
- **Milk Run Telemetry (`RouteJourney.jsx`):** Telemetri titik stop perjalanan real-time dengan meteran kendali **Load Partitioning** (maksimal muatan aktif 1.500 kg per trip dan pengalihan sisa tonase ke *Overspill Queue*).
- **Estimasi Milk Run (`EstimasiMilkRun.jsx`):** Simulator kecepatan armada (20 km/j Macet, 40 km/j Standar, 80 km/j Tol), kalkulasi *dwell time* bongkar-muat, dan kalkulator ETA akurat di SPP Bandung.

### 7. Transit & Gate Monitoring (`GateMonitoring.jsx`)
- **Checkpoint 1:** Pembuatan Master Manifest & Konsolidasi Bagging Kontainer.
- **Checkpoint 2:** Inbound Transit & Penerimaan Masuk SPP Bandung.
- **Checkpoint 3:** Arrival Last-Mile SPP Tujuan & Penyelesaian Status `DELIVERED`.

### 8. Sistem & Administrasi
- **MongoDB Compass GUI (`Compass.jsx`):** Browser visual koleksi, dokumen, dan indeks database MongoDB langsung dari web app.
- **System Settings (`Settings.jsx`):** Konfigurasi string koneksi URI MongoDB secara dinamis di runtime.
- **User Profile (`Profile.jsx`):** Manajemen profil operator logistik, preferensi sistem, dan log audit aktivitas.

---

## 5. Skema Database & Koleksi MongoDB

### Koleksi `transaksi` (Connotes)
```json
{
  "_id": "ObjectId",
  "connote_code": "STRING (Unique, Index)",
  "connote_state": "STRING (DITERIMA_DI_CIMAHI | IN_MANIFEST | TRANSIT_SPP_BANDUNG | TIBA_DI_SPP_TUJUAN | DELIVERED)",
  "manifest_id": "STRING | null",
  "connote_service": "STRING (Pos Nextday | Pos Reguler | Pos Sameday | Pos Jumbo)",
  "connote_total_amount": "NUMBER",
  "connote_weight": "NUMBER",
  "location_data_created": {
    "custom_field": { "destination_nopen": "STRING", "origin_nopen": "STRING" }
  },
  "tracking_history": [
    {
      "from_state": "STRING",
      "to_state": "STRING",
      "changedAt": "DATE",
      "manifest_id": "STRING"
    }
  ],
  "createdAt": "DATE",
  "updatedAt": "DATE"
}
```

### Koleksi `manifests`
```json
{
  "_id": "ObjectId",
  "master_manifest_code": "STRING (Format: MNFXXXXXX, Unique Index)",
  "status_perjalanan": "STRING (Draft | Transit | Arrived)",
  "connote_codes": ["ARRAY OF STRING"],
  "assigned_vehicle": "STRING (Nopol Truk)",
  "assigned_driver": "STRING",
  "createdAt": "DATE",
  "updatedAt": "DATE"
}
```

---

## 6. Linear State Machine Status Kiriman

Alur transisi status pengiriman divalidasi secara ketat pada backend dengan atomic state machine:

$$\text{DITERIMA\_DI\_CIMAHI} \longrightarrow \text{IN\_MANIFEST} \longrightarrow \text{TRANSIT\_SPP\_BANDUNG} \longrightarrow \text{TIBA\_DI\_SPP\_TUJUAN} \longrightarrow \text{DELIVERED}$$

Setiap perubahan status mencatat entri audit trail baru ke dalam array `tracking_history` connote bersangkutan.

---

## 7. Panduan Instalasi & Cara Menjalankan

### Prasyarat Sistem
* Node.js v18.x atau lebih baru
* NPM v9.x atau lebih baru
* MongoDB Server (dengan fitur Replica Set aktif untuk mendukung transaksi ACID)

### 1. Menjalankan Backend Server
```bash
cd redesign/server
npm install
npm run dev
# Server Express aktif pada: http://localhost:5002
```

### 2. Menjalankan Web Client
```bash
cd redesign/client
npm install
npm run dev
# Web application aktif pada: http://localhost:5173
```

### 3. Menjalankan Telemetry Simulator
```bash
cd simulator
npm install
npm run dev
# Telemetry simulator aktif pada: http://localhost:5174
```

---

## 8. Spesifikasi Endpoints API

| Kategori | Method | Endpoint | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Otentikasi pengguna & pembuatan token sesi |
| **Auth** | `GET` | `/api/auth/me` | Mengambil data sesi pengguna aktif & role |
| **Auth** | `POST` | `/api/auth/logout` | Mengakhiri sesi pengguna aktif |
| **Dashboard** | `GET` | `/api/dashboard-stats` | Statistik global, visualisasi tren, & kategori populer |
| **Transaksi** | `GET` | `/api/transaksi` | Daftar data transaksi kiriman dengan filter & pagination |
| **Transaksi** | `POST` | `/api/transaksi/import-csv` | Impor data transaksi connote massal dari CSV |
| **Checker** | `GET` | `/api/checker/:connoteCode` | Detail rute & audit trail perjalanan connote |
| **Master Kantor** | `GET`/`POST`/`PUT`/`DELETE` | `/api/kantor` | Operasi CRUD master kantor pos |
| **Master Produk** | `GET`/`POST`/`PUT`/`DELETE` | `/api/produk` | Operasi CRUD master layanan produk pos |
| **Master Armada** | `GET`/`POST`/`PUT`/`DELETE` | `/api/kendaraan` | Operasi CRUD master armada logistik |
| **Master Rute** | `GET`/`POST`/`PUT`/`DELETE` | `/api/route` | Operasi CRUD master rute logistik |
| **Jadwal Pickup** | `GET` | `/api/pickup-schedules` | Mengambil jadwal pickup SPP Bandung |
| **Template Jadwal** | `GET`/`POST`/`PUT`/`DELETE` | `/api/template` | Operasi CRUD template jadwal transportasi |
| **Jadwal Transport** | `POST` | `/api/jadwal/generate` | Bulk generate jadwal transportasi bulanan |
| **Gate Checkpoint 1** | `POST` | `/api/manifests` | Pembuatan manifest baru & bagging paket |
| **Gate Checkpoint 2** | `POST` | `/api/manifests/transit` | Mengubah status manifest ke Transit SPP Bandung |
| **Gate Checkpoint 3** | `POST` | `/api/manifests/arrive` | Konfirmasi kedatangan & penyelesaian status paket |
| **Compass** | `GET`/`POST` | `/api/compass/*` | Web GUI inspeksi database internal |
| **Settings** | `GET`/`POST` | `/api/settings` | Manajemen string koneksi database |

---

## 9. Dokumentasi Modul Halaman

Dokumentasi arsitektur dan fungsionalitas mendalam untuk masing-masing modul tersedia dalam format Markdown dan Microsoft Word (`.docx`) di folder [dokumentasi_halaman_ipos5/](file:///c:/ipos5/dokumentasi_halaman_ipos5):

* [00. Index Seluruh Dokumentasi Halaman](file:///c:/ipos5/dokumentasi_halaman_ipos5/00_INDEX_DOKUMENTASI_ALL_PAGES.md)
* [01. Dashboard Monitoring Operasional](file:///c:/ipos5/dokumentasi_halaman_ipos5/01_Dashboard_Operasional.md)
* [02. Package Tracking Checker](file:///c:/ipos5/dokumentasi_halaman_ipos5/02_Package_Tracking_Checker.md)
* [03. Post Offices (Master Kantor)](file:///c:/ipos5/dokumentasi_halaman_ipos5/03_Post_Offices_Master_Kantor.md)
* [04. Products & Services (Master Produk)](file:///c:/ipos5/dokumentasi_halaman_ipos5/04_Products_Services_Master_Produk.md)
* [05. Fleet Management (Master Kendaraan)](file:///c:/ipos5/dokumentasi_halaman_ipos5/05_Fleet_Master_Kendaraan.md)
* [06. Routes & Priorities (Master Route)](file:///c:/ipos5/dokumentasi_halaman_ipos5/06_Routes_Master_Route.md)
* [07. Schedule Templates](file:///c:/ipos5/dokumentasi_halaman_ipos5/07_Schedule_Templates.md)
* [08. Transport Schedule](file:///c:/ipos5/dokumentasi_halaman_ipos5/08_Transport_Schedule.md)
* [09. Milk Run Telemetry](file:///c:/ipos5/dokumentasi_halaman_ipos5/09_Milk_Run_Telemetry.md)
* [10. Estimasi Milk Run](file:///c:/ipos5/dokumentasi_halaman_ipos5/10_Estimasi_Milk_Run.md)
* [11. Gate Monitoring](file:///c:/ipos5/dokumentasi_halaman_ipos5/11_Gate_Monitoring.md)
* [12. Analitik & Laporan](file:///c:/ipos5/dokumentasi_halaman_ipos5/12_Analitik_dan_Laporan.md)
* [13. Database Viewer Transaksi](file:///c:/ipos5/dokumentasi_halaman_ipos5/13_Database_Viewer_Transaksi.md)
* [14. System Settings & Compass](file:///c:/ipos5/dokumentasi_halaman_ipos5/14_System_Settings_Compass.md)
* [15. User Profile & Audit Trail](file:///c:/ipos5/dokumentasi_halaman_ipos5/15_User_Profile.md)

---
*© PT Pos Indonesia - KCU Cimahi Origin Delivery System*
