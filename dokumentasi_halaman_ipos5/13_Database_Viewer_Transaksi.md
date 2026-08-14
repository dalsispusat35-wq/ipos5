# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 13 — DATABASE VIEWER (TABEL TRANSAKSI RESI)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Database Viewer Transaksi (/transaksi) |
| **Kategori Menu** | SYSTEM (RESTRICTED) |
| **Route URL** | /transaksi |
| **File Komponen React** | src/pages/Transaksi.jsx |
| **Backend API Endpoint** | GET /api/transaksi?page=1&limit=25, GET /api/transaksi/stats |
| **Koleksi MongoDB** | transaksi, master_kantor |
| **Hak Akses Role** | Restricted / Super Admin & Authorized Operators |

---

## 1. Deskripsi & Tujuan Utama Modul

Database Viewer merupakan modul penjelajah data transaksi mentah (raw connote documents) di database MongoDB `transaksi`. Modul ini mendukung server-side pagination, multi-field search, dan filter spesifik (State, Service, Destination Nopen/KPRK/Regional).

## 2. Fitur-Fitur Utama & Komponen UI

### Server-Side Paginated Table & Multi-Filter
- Tabel Transaksi Resi dengan Paginasi Server (25 / 50 / 100 / 200 baris per halaman)
- Filter Berdasarkan Status (ENTRY, LOADED, IN_TRANSIT, DELIVERED)
- Filter Berdasarkan Jenis Layanan (Pos Express, Pos Reguler, Pos Nextday)
- Filter Berdasarkan Nopen Tujuan / KPRK / Regional (Reg 1 - Reg 6)
- Modal Detail JSON Raw Document Transaksi

