# 📦 IPOS5: Cimahi Origin Delivery System (Redesign Service)

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

---

## 1. Ringkasan Proyek

**Cimahi Origin Delivery System (IPOS5 Redesign)** adalah aplikasi web logistik terintegrasi modern yang dirancang untuk merevolusi efisiensi operasional pengiriman barang dari KCU Cimahi menuju Sentral Pengolahan Pos (SPP) Bandung serta seluruh kantor tujuan di Indonesia.

Sistem ini menggabungkan:
- **Analitik Operasional Real-Time**: Agregasi data langsung dari basis data MongoDB dengan filter periode interaktif, grafik tren, dan modal *deep-dive breakdown* kategori layanan pos.
- **Konsolidasi & Gate Monitoring**: Otomatisasi pembentukan manifest bagging (Checkpoint 1), inbound transit (Checkpoint 2), dan penyelesaian *last-mile delivery* (Checkpoint 3).
- **Simulasi & Telemetri Rute Milk Run**: Algoritma partisi beban muatan truk (*load partitioning* 1.500 kg safe threshold), simulasi kecepatan armada, dan estimasi waktu tiba (ETA).

---

## 2. Stack Teknologi

### Frontend Client (`client/`)
* **Framework:** React 18 (Vite)
* **Routing:** React Router DOM v6
* **Icons:** Lucide React
* **Styling:** Vanilla CSS3 dengan Sistem Token **Navy Premium Theme** (Glassmorphic cards, Glowing cyan accents, HSL adaptive dark mode)
* **Port Standar:** `http://localhost:5173`

### Backend Server (`server/`)
* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js
* **Database Driver:** MongoDB Native Driver (`mongodb`)
* **Keamanan & Transaksi:** MongoDB Session Transactions (ACID) untuk pembentukan & transit manifest
* **Port Standar:** `http://localhost:5002`

### Database
* **Engine:** MongoDB (Topologi Replica Set / Local Standalone Replica Set)
* **Database Target:** `ipos5_reporting`

---

## 3. Arsitektur & Struktur Direktori

```text
redesign/
├── client/                         # Web Application Frontend (React + Vite)
│   ├── dist/                       # Production Build Output
│   ├── src/
│   │   ├── pages/                  # 16 Halaman Utama Aplikasi
│   │   │   ├── Dashboard.jsx       # Analytics & Telemetry Dashboard
│   │   │   ├── Transaksi.jsx       # Connotes Database Viewer
│   │   │   ├── Checker.jsx         # Package Tracking Checker
│   │   │   ├── MasterKantor.jsx    # Master Data Kantor Pos
│   │   │   ├── MasterProduk.jsx    # Master Layanan Produk
│   │   │   ├── MasterKendaraan.jsx # Master Armada Kendaraan
│   │   │   ├── MasterRoute.jsx     # Master Rute Logistik
│   │   │   ├── JadwalPickup.jsx    # Monitoring Jadwal Pickup SPP
│   │   │   ├── TemplateJadwal.jsx  # Template Jadwal Transportasi
│   │   │   ├── JadwalTransportasi.jsx # Penjadwalan Bulanan Otomatis
│   │   │   ├── RouteJourney.jsx    # Milk Run Telemetry
│   │   │   ├── EstimasiMilkRun.jsx # Simulator Estimasi Milk Run
│   │   │   ├── GateMonitoring.jsx  # 3-Stage Gate Checkpoints
│   │   │   ├── AnalitikLaporan.jsx # Analisis SLA & Laporan Eksekutif
│   │   │   ├── Compass.jsx         # MongoDB GUI Viewer
│   │   │   ├── Settings.jsx        # Pengaturan Database & Server
│   │   │   └── Profile.jsx         # Manajemen Pengguna & Audit Trail
│   │   ├── components/             # Reusable UI Components & Modals
│   │   ├── utils/api.js            # Axios/Fetch API Integration Client
│   │   ├── App.jsx                 # App Layout, Sidebar & Navigation
│   │   └── index.css               # Design System & Token Styling
│   ├── package.json
│   └── vite.config.js
│
└── server/                         # Backend REST API Service (Node + Express)
    ├── config/DbConnection.js      # Pool Koneksi MongoDB & Health Check
    ├── controllers/                # OOP MVC Controllers
    ├── models/                     # MongoDB Native Abstraction Models
    ├── routes/api.js               # Route Express (/api/...)
    ├── services/                   # Business Services & Analytics Pipeline
    ├── scripts/                    # Script Migrasi, SQL Dump, & Doc Generators
    ├── app.js                      # Entrypoint Express Server
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

---

## 5. Panduan Instalasi & Menjalankan

### 1. Menjalankan Backend Server
```bash
cd server
npm install
npm run dev
# Server aktif pada: http://localhost:5002
```

### 2. Menjalankan Frontend Client
```bash
cd client
npm install
npm run dev
# Client aktif pada: http://localhost:5173
```

---
*© PT Pos Indonesia - KCU Cimahi Origin Delivery System*
