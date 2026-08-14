# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 12 — ANALITIK & LAPORAN OPERASIONAL

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Analitik & Laporan Operasional (/analytics) |
| **Kategori Menu** | LOGISTICS / REPORTING |
| **Route URL** | /analytics |
| **File Komponen React** | src/pages/AnalyticsReport.jsx |
| **Backend API Endpoint** | GET /api/analytics/performance, GET /api/analytics/export-pdf |
| **Koleksi MongoDB** | transaksi, route_journeys, master_kendaraan |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Analitik & Laporan menyajikan analisis komprehensif mengenai tingkat keberhasilan pengiriman (Delivery Success Rate), efisiensi muatan armada (% Utilisasi Tonase), tren volume harian/bulanan, serta fitur pencetakan laporan resmi.

## 2. Fitur-Fitur Utama & Komponen UI

### Executive Reports & Analytics Charts
- Grafik Tren Volume Pengiriman Kiriman Pos per Rentang Tanggal
- Laporan Utilisasi Kapasitas per Armada Kendaraan
- Rekapitulasi Rute Paling Padat (Top Traffic Routes)
- Ekspor Laporan Resmi ke Format PDF & Excel / CSV

