# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 1 — DASHBOARD OPERASIONAL LOGISTIK

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Dashboard Operasional Logistik IPOS5 |
| **Kategori Menu** | OPERATIONS |
| **Route URL** | / |
| **File Komponen React** | src/pages/Dashboard.jsx |
| **Backend API Endpoint** | GET /api/transaksi/stats, GET /api/kendaraan/stats, GET /api/routes/stats |
| **Koleksi MongoDB** | transaksi, master_kendaraan, route_journeys, master_route_nopen |
| **Hak Akses Role** | Semua Role (Operator & Super Admin) |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Dashboard Operasional merupakan pusat komando (command center) visual bagi manajemen logistik PT Pos Indonesia. Halaman ini menyajikan rangkuman metrik statistik real-time mengenai status pengiriman resi paket, ketersediaan armada mobil, utilisasi rute feeder/intercity, dan status koneksi database MongoDB.

## 2. Fitur-Fitur Utama & Komponen UI

### Ringkasan Stat Snapshot Cards
- Total Paket Terdaftar (ENTRY / IN_TRANSIT / DELIVERED)
- Total Tonase Muatan Aktif (Kilogram / Ton)
- Total Armada Beroperasi & Status Utilisasi Kapasitas
- Total Rute Feeder & Intercity Aktif

### Visual Widget & Diagram Telemetri
- Diagram Pie Status Pengiriman Kiriman Pos (ENTRY, IN_TRANSIT, DELIVERED)
- Bar Chart Utilisasi Kapasitas Kendaraan Utama (B 9910 PCX, B 9945 PCY, dll.)
- Table Feeder Route Snapshot & Active Journeys Status
- Status Live Database Connection Compass Badge (Green/Red indicator)

## 3. Aturan Logika Bisnis & Penanganan Data

- Data agregasi dihitung secara dinamis dari koleksi MongoDB transaksi dan route_journeys.
- Menggunakan polling otomatis / trigger refresh untuk memperbarui angka statistik saat terjadi aktivitas bongkar-muat paket di lapangan.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator masuk ke sistem IPOS5 dan secara otomatis diarahkannya ke halaman Dashboard (`/`).
- 2. Operator meninjau ringkasan metrik volume paket dan armada yang sedang berjalan.
- 3. Operator dapat mengeklik salah satu kartu statistik untuk berpindah cepat ke halaman rincian (misal klik Paket -> Package Tracking, klik Armada -> Master Kendaraan).

