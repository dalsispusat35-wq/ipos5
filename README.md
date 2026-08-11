# 📦 README: Cimahi Origin Delivery System (IPOS5 Redesign)

Sistem Manajemen Logistik dan Pemantauan Rute Pengiriman Otomatis PT Pos Indonesia (Khusus Kantor Cabang Utama Cimahi & SPP Bandung).

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

**Cimahi Origin Delivery System (IPOS5 Redesign)** adalah aplikasi web logistik modern yang dirancang untuk meredesign dan meningkatkan efisiensi operasional pengiriman barang dari KCU Cimahi menuju Sentral Pengolahan Pos (SPP) Bandung dan kantor tujuan akhir.

Sistem ini mendukung otomatisasi konsolidasi manifest kontainer, visualisasi pemetaan rute perjalanan, *checkpoint gate monitoring*, serta pencatatan audit trail perjalanan kiriman secara real-time dengan jaminan transaksi bertingkat (ACID) MongoDB.

---

## 2. Stack Teknologi

### Frontend (Client)
* **Framework:** React 18 (Vite)
* **Routing:** React Router DOM v6
* **Icons:** Lucide React
* **Styling:** Vanilla CSS3 dengan Sistem Token **Navy Premium Theme** (Glassmorphic cards, Glowing cyan accents, HSL adaptive dark mode)
* **Port Standar:** `http://localhost:5173`

### Backend (Server)
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
ipos5/
├── README.md               # Dokumentasi Teknis & Panduan Proyek
├── PRD.md                  # Product Requirement Document
├── BRD.md                  # Business Requirement Document
└── redesign/
    ├── client/             # Single Page Application (React + Vite)
    │   ├── dist/           # Production Build Output
    │   ├── src/
    │   │   ├── pages/      # 16 Modul Halaman Utama Aplikasi
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── Transaksi.jsx
    │   │   │   ├── Checker.jsx
    │   │   │   ├── MasterKantor.jsx
    │   │   │   ├── MasterProduk.jsx
    │   │   │   ├── MasterKendaraan.jsx
    │   │   │   ├── MasterRoute.jsx
    │   │   │   ├── JadwalPickup.jsx
    │   │   │   ├── TemplateJadwal.jsx
    │   │   │   ├── JadwalTransportasi.jsx
    │   │   │   ├── RouteJourney.jsx
    │   │   │   ├── EstimasiMilkRun.jsx
    │   │   │   ├── GateMonitoring.jsx
    │   │   │   ├── Compass.jsx
    │   │   │   ├── Settings.jsx
    │   │   │   └── Profile.jsx
    │   │   ├── utils/      # Integrasi API (api.js) & Helper
    │   │   ├── App.jsx     # Navigation Layout & Route Provider
    │   │   ├── main.jsx    # Client Entrypoint
    │   │   └── index.css   # Token Desain & Styling Global
    │   ├── index.html
    │   ├── package.json
    │   └── vite.config.js
    │
    └── server/             # RESTful API Service (Node.js + Express)
        ├── config/         # Pengaturan Database (DbConnection.js)
        ├── controllers/    # BaseController & Subclasses (OOP MVC)
        ├── models/         # BaseModel & Subclasses (MongoDB Native Abstraction)
        ├── routes/         # Router Express (/api/...)
        ├── scripts/        # Script Migrasi Data & Audit
        ├── app.js          # Server Entrypoint
        └── package.json
```

---

## 4. Modul & Fitur Utama Aplikasi

1. **Dashboard Monitoring (`Dashboard.jsx`)**
   - Panel metrik real-time statistik logistik (Total Kantor Pos, Produk, Armada, Rute).
   - Graphic Breakdown Status Paket 1-to-1 dengan key basis data (`DITERIMA_DI_CIMAHI`, `IN_MANIFEST`, `TRANSIT_SPP_BANDUNG`, `TIBA_DI_SPP_TUJUAN`, `DELIVERED`).
   - Interaksi filter status paket dinamis.

2. **Data Transaksi Kiriman (`Transaksi.jsx`)**
   - Manajemen dan pencarian data transaksi kiriman massal (Connotes).
   - Pencarian cepat resi, filter status linier, filter jenis layanan produk, filter Nopend tujuan, dan rentang tanggal.
   - Fitur ekspor data dan modal rincian armada pengirim.

3. **Routing & Tracking Checker (`Checker.jsx`)**
   - Lacak posisi dan rute pengiriman berdasarkan Connote Code / Nomor Resi.
   - Visualisasi alur transportasi dari kantor asal hingga tujuan.
   - Timeline Audit Trail perjalanan berdasarkan array `tracking_history`.

4. **Master Kantor (`MasterKantor.jsx`)**
   - Manajemen data Nopend (Nomor Pendirian) Kantor Pos (KPRK/KCU/KCP).
   - Fitur pencarian cepat dan pagination data legacy (>13.000 kantor pos).

5. **Master Layanan & Produk (`MasterProduk.jsx`)**
   - Pengelolaan kode produk dan nama layanan Pos Indonesia (misal: Pos Sameday, Nextday, Kilat Khusus).

6. **Master Kendaraan / Armada (`MasterKendaraan.jsx`)**
   - Pengelolaan armada truk dan nopol transportasi logistik.

7. **Master Rute Logistik (`MasterRoute.jsx`)**
   - Pemetaan rute utama asal-tujuan beserta urutan *priority checkpoint*.
   - Autocomplete otomatis kantor pos berdasarkan Nopend.

8. **Jadwal Pick Up SPP (`JadwalPickup.jsx`)**
   - Monitoring rute pickup berkala dari SPP Bandung menuju KCU Cimahi dan KCP-KCP area.
   - Estimasi jam kedatangan (ETA) otomatis di setiap stop point, opsi menyembunyikan titik yang di-skip, dan pencarian cepat Nopend.

9. **Template Jadwal Transportasi (`TemplateJadwal.jsx`)**
   - Pengaturan template pola perjalanan rutin mingguan armada logistik.

10. **Penjadwalan Transportasi Bulanan (`JadwalTransportasi.jsx`)**
    - Pembuat jadwal dinamis bulanan berdasarkan template jadwal yang aktif.
    - Bulk-generate jadwal sebulan penuh dengan mengabaikan hari libur/Minggu.

11. **Milk Run Telemetry (`RouteJourney.jsx`)**
    - Telemetri perjalanan rute Milk Run real-time.
    - Pemantauan progres titik perhentian (waypoint), status stop (Waiting, Skipped, Completed).
    - **Load Partitioning Control Meter:** Membatasi muatan aktif Trip 1 pada batas aman **1.500 kg (100% TERISI PENUH - SAFE)** dan memisahkan sisa muatan **12,9 Ton** ke panel antrean melimpah (*Overspill Queue*) untuk Trip 2 / Armada Tambahan.

12. **Estimasi Milk Run Logistik (`EstimasiMilkRun.jsx`)**
    - Simulator interaktif optimasi dan estimasi rute Milk Run.
    - **Slider Kecepatan Armada:** Simulasi Kecepatan (20 km/j Macet, 40 km/j Standar, 80 km/j Tol).
    - Input waktu muat (*dwell time*) dan jam berangkat untuk mengkalkulasi estimasi jam tiba (ETA) presisi di SPP Bandung.
    - Visualisasi pergerakan armada, simulasi muatan kontainer, dan deteksi kendaraan aktif.

13. **Transit & Gate Monitoring (`GateMonitoring.jsx`)**
    - Checkpoint 1: Pembuatan Manifest & Konsolidasi Bagging.
    - Checkpoint 2: Inbound Transit SPP Bandung secara massal.
    - Checkpoint 3: Arrival Last-Mile SPP Tujuan & Penyelesaian Status `DELIVERED`.

14. **MongoDB Compass GUI (`Compass.jsx`)**
    - Client MongoDB visual bawaan di dalam web app untuk memantau koleksi, skema, dan indeks database secara langsung.

15. **Pengaturan Koneksi (`Settings.jsx`)**
    - Manajemen profil koneksi URI MongoDB secara dinamis di runtime.

16. **Profil Pengguna (`Profile.jsx`)**
    - Antarmuka manajemen akun operator logistik (Sari Rahayu - Operational Supervisor).
    - Ringkasan aktivitas operasional (log audit), statistik pengolahan manifest, serta kustomisasi notifikasi sistem.

---

## 5. Skema Database & Koleksi MongoDB

### Koleksi `transaksi` (Connotes)
```json
{
  "_id": "ObjectId",
  "connote_code": "STRING (Unique, Index)",
  "connote_state": "STRING (Status linier saat ini)",
  "manifest_id": "STRING | null",
  "connote": {
    "connote_code": "STRING",
    "connote_service": "STRING"
  },
  "custom_field": {
    "destination_kprk": "STRING (Nopend Tujuan)"
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
  "createdAt": "DATE",
  "updatedAt": "DATE"
}
```

---

## 6. Linear State Machine Status Kiriman

Alur transisi status paket bersifat linier dan divalidasi secara ketat di layer backend:

$$\text{DITERIMA\_DI\_CIMAHI} \longrightarrow \text{IN\_MANIFEST} \longrightarrow \text{TRANSIT\_SPP\_BANDUNG} \longrightarrow \text{TIBA\_DI\_SPP\_TUJUAN} \longrightarrow \text{DELIVERED}$$

---

## 7. Panduan Instalasi & Cara Menjalankan

### Prasyarat System
* Node.js v18.x atau lebih baru
* MongoDB Server (dengan mode Replica Set diaktifkan untuk fitur ACID Session)

### 1. Inisialisasi Backend (Server)
```bash
cd redesign/server
npm install
npm run dev
# Express server berjalan pada http://localhost:5002
```

### 2. Inisialisasi Frontend (Client)
```bash
cd redesign/client
npm install
npm run dev
# Aplikasi web dapat diakses pada http://localhost:5173
```

---

## 8. Spesifikasi Endpoints API

| Modul | Method | Endpoint | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Otentikasi login pengguna & generasi token sesi |
| **Auth** | `GET` | `/api/auth/me` | Mengambil data sesi pengguna aktif & role RBAC |
| **Auth** | `POST` | `/api/auth/logout` | Mengakhiri sesi login pengguna |
| **Dashboard** | `GET` | `/api/dashboard-stats` | Mendapatkan statistik global & breakdown status |
| **Transaksi** | `GET` | `/api/transaksi` | Mengambil data transaksi connote dengan pagination & filter |
| **Checker** | `GET` | `/api/checker/:connoteCode` | Mengambil detail rute & history lacak resi |
| **Kantor** | `GET`/`POST`/`PUT`/`DELETE` | `/api/kantor` | Operasi CRUD master kantor pos |
| **Produk** | `GET`/`POST`/`PUT`/`DELETE` | `/api/produk` | Operasi CRUD master layanan produk pos |
| **Kendaraan** | `GET`/`POST`/`PUT`/`DELETE` | `/api/kendaraan` | Operasi CRUD master armada logistik |
| **Rute** | `GET`/`POST`/`PUT`/`DELETE` | `/api/route` | Operasi CRUD master rute logistik |
| **Jadwal Pickup** | `GET` | `/api/pickup-schedules` | Mengambil daftar jadwal pickup SPP Bandung |
| **Template Jadwal** | `GET`/`POST`/`PUT`/`DELETE` | `/api/template` | Operasi CRUD template jadwal transportasi |
| **Jadwal Transport** | `POST` | `/api/jadwal/generate` | Bulk-generate jadwal transportasi bulanan |
| **Manifest** | `POST` | `/api/manifests` | Membuat manifest baru (Checkpoint 1 - Bagging) |
| **Manifest** | `POST` | `/api/manifests/transit` | Mengubah status manifest ke Transit (Checkpoint 2) |
| **Manifest** | `POST` | `/api/manifests/arrive` | Selesaikan kedatangan di SPP Tujuan (Checkpoint 3) |
| **Compass** | `GET`/`POST` | `/api/compass/*` | MongoDB Browser GUI internal (Restricted Super Admin) |
| **Settings** | `GET`/`POST` | `/api/settings` | Konfigurasi URI MongoDB & Server (Restricted Super Admin) |

---
*© PT Pos Indonesia - KCU Cimahi Origin Delivery System*

