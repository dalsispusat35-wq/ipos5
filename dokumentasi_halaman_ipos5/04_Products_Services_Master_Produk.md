# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 4 — PRODUCTS & SERVICES (MASTER PRODUK LAYANAN)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Master Produk & Layanan Pos (/produk) |
| **Kategori Menu** | MASTER DATA |
| **Route URL** | /produk |
| **File Komponen React** | src/pages/MasterProduk.jsx |
| **Backend API Endpoint** | GET /api/produk, POST /api/produk, PUT /api/produk/:id, DELETE /api/produk/:id |
| **Koleksi MongoDB** | master_produk |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul ini mengelola katalog produk layanan pengiriman kurir dan logistik Pos Indonesia (seperti Pos Express, Pos Reguler, Pos Nextday, Pos Jumbo, Kakap, dll.) beserta batasan SLA (Service Level Agreement), batas berat maksimum, serta waktu penutupan loket (Cut-Off Time).

## 2. Fitur-Fitur Utama & Komponen UI

### Katalog Layanan & Konfigurasi SLA
- Grid & Table Katalog Layanan Pos dengan Indikator Warna Badge Produk
- Pengaturan Estimasi Pengiriman (SLA Hari / Jam H+1, H+2)
- Pengaturan Jam Cut-Off Loket Pemrosesan Pengiriman
- Form Input Produk Baru & Pengaturan Tarif Dasar Per Kg
- Toggle Status Aktif / Non-Aktif Layanan Pos

