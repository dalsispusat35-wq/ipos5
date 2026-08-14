# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 2 — PACKAGE TRACKING & CHECKER LOGISTIK

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Package Tracking & Checker (/checker) |
| **Kategori Menu** | OPERATIONS |
| **Route URL** | /checker |
| **File Komponen React** | src/pages/Checker.jsx |
| **Backend API Endpoint** | GET /api/checker/:connoteCode?date=YYYY-MM-DD, GET /api/checker/vehicle/:nopol |
| **Koleksi MongoDB** | transaksi, master_kendaraan, route_journeys, detail_route, master_kantor, tracking_events |
| **Hak Akses Role** | Semua Role (Operator & Super Admin) |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Package Tracking & Checker merupakan modul utama audit trail dan pelacakan lintasan pengiriman paket serta armada kendaraan. Modul ini memungkinkan operator melacak status resi connote (14/15 digit) atau nomor plat polisi armada (misal B 9910 PCX) berdasarkan konteks Tanggal Operasional harian.

## 2. Fitur-Fitur Utama & Komponen UI

### Toggle & Search Bar Multi-Fungsi
- Mode Pencarian: Nomor Resi Connote vs Daftar Fleet Mobil Armada (MongoDB)
- Date Picker Context Tanggal Operasional Harian (YYYY-MM-DD)
- Quick Test Sample Chips (Resi P260812000001, P20260724000001, Armada B 9910 PCX)

### Visual Cards & Telemetri Real-Time
- Card Warning Tanggal Operasional Belum Tiba (Warna Merah Prominen tanpa muatan palsu)
- Card Overview Spesifikasi Kendaraan / Detail Resi Paket
- Tracking Timeline Event Log dari Database (ENTRY, LOADED, IN_TRANSIT, DELIVERED)
- Multi-stop Route Journey Stepper (Sequential Waypoints dari detail_route)
- Vehicle Capacity Gauge (% Utilisasi Beban, Load at Stop kg vs Max Capacity 1500 kg)
- Radar GPS Telemetry Live Modal (`LiveGpsMapModal.jsx`)
- QA / Dev CSV Import Modal (`CsvImportModal.jsx`)

## 3. Aturan Bisnis & Logika Penanganan Tanggal Masa Depan

⚠️ **ATURAN TANGGAL MASA DEPAN (STRICT FUTURE DATE RULE)**:
- Apabila pengguna memilih tanggal operasional di masa depan yang belum tiba (misal hari ini 14 Agustus 2026 dan memilih 17/22/25/28 Agustus 2026), backend TIDAK AKAN LAGI memuat data perjalanan lampau (fallback) atau membuat muatan palsu (3 pcs / 19.7 kg).
- Backend mengembalikan `isFutureDate: true` dan `milk_run: null`.
- Frontend menampilkan Banner Peringatan Merah ('Tanggal Operasional Belum Tiba') dan secara otomatis MENYEMBUNYIKAN statistik muatan lampau, progress rute *in-progress* palsu, dan gauge utilisasi.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Pengguna memasukkan nomor resi atau memilih plat mobil armada.
- 2. Pengguna mementukan Tanggal Operasional (misal 12 Agustus 2026).
- 3. Sistem memuat lintasan rute, posisi stop aktif, serta daftar muatan barang secara real-time.

