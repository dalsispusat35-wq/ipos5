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
    │   │   ├── pages/      # 11 Modul Halaman Utama Aplikasi
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── Checker.jsx
    │   │   │   ├── MasterKantor.jsx
    │   │   │   ├── MasterProduk.jsx
    │   │   │   ├── MasterKendaraan.jsx
    │   │   │   ├── MasterRoute.jsx
    │   │   │   ├── TemplateJadwal.jsx
    │   │   │   ├── JadwalTransportasi.jsx
    │   │   │   ├── GateMonitoring.jsx
    │   │   │   ├── Compass.jsx
    │   │   │   └── Settings.jsx
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

2. **Routing & Tracking Checker (`Checker.jsx`)**
   - Lacak posisi dan rute pengiriman berdasarkan Connote Code / Nomor Resi.
   - Visualisasi alur transportasi dari kantor asal hingga tujuan.
   - Timeline Audit Trail perjalanan berdasarkan array `tracking_history`.

3. **Master Kantor (`MasterKantor.jsx`)**
   - Manajemen data Nopend (Nomor Pendirian) Kantor Pos (KPRK/KCU/KCP).
   - Fitur pencarian cepat dan pagination data legacy (>13.000 kantor pos).

4. **Master Layanan & Produk (`MasterProduk.jsx`)**
   - Pengelolaan kode produk dan nama layanan Pos Indonesia (misal: Pos Sameday, Nextday, Kilat Khusus).

5. **Master Kendaraan / Armada (`MasterKendaraan.jsx`)**
   - Pengelolaan armada truk dan nopol transportasi logistik.

6. **Master Rute Logistik (`MasterRoute.jsx`)**
   - Pemetaan rute utama asal-tujuan beserta urutan *priority checkpoint*.
   - Autocomplete otomatis kantor pos berdasarkan Nopend.

7. **Template & Penjadwalan Transportasi (`TemplateJadwal.jsx` & `JadwalTransportasi.jsx`)**
   - Pengaturan template jadwal rutin mingguan.
   - Bulk-generate jadwal pengiriman bulanan otomatis.

8. **Transit & Gate Monitoring (`GateMonitoring.jsx`)**
   - Checkpoint 1: Pembuatan Manifest & Konsolidasi Bagging.
   - Checkpoint 2: Inbound Transit SPP Bandung secara massal.
   - Checkpoint 3: Arrival Last-Mile SPP Tujuan & Penyelesaian Status `DELIVERED`.

9. **MongoDB Compass GUI (`Compass.jsx`)**
   - Client MongoDB visual bawaan di dalam web app untuk memantau koleksi, skema, dan indeks database secara langsung.

10. **Pengaturan Koneksi (`Settings.jsx`)**
    - Manajemen profil koneksi URI MongoDB secara dinamis di runtime.

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
| **Dashboard** | `GET` | `/api/dashboard-stats` | Mendapatkan statistik global & breakdown status |
| **Checker** | `GET` | `/api/checker/:connoteCode` | Mengambil detail rute & history lacak resi |
| **Kantor** | `GET`/`POST` | `/api/kantor` | Operasi list & tambah master kantor pos |
| **Manifest** | `POST` | `/api/manifests` | Membuat manifest baru (Checkpoint 1) |
| **Manifest** | `POST` | `/api/manifests/transit` | Mengubah status manifest ke Transit (Checkpoint 2) |
| **Manifest** | `POST` | `/api/manifests/arrive` | Selesaikan kedatangan di SPP Tujuan (Checkpoint 3) |

---
*© PT Pos Indonesia - KCU Cimahi Origin Delivery System*
