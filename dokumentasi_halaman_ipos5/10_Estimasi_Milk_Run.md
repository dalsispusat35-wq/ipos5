# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 10 — ESTIMASI MILK RUN (TRAVEL TIME & ROUTE PLANNER)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Estimasi Milk Run (/estimasi) |
| **Kategori Menu** | LOGISTICS |
| **Route URL** | /estimasi |
| **File Komponen React** | src/pages/EstimasiMilkRun.jsx |
| **Backend API Endpoint** | GET /api/routes/:routeId/estimate |
| **Koleksi MongoDB** | detail_route, master_route_nopen, master_kantor |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Estimasi Milk Run berfungsi sebagai kalkulator dan perencana estimasi waktu tempuh (ETA), akumulasi jarak kilometer, serta proyeksi konsumsi kapasitas armada di setiap titik transit sebelum armada diberangkatkan.

## 2. Fitur-Fitur Utama & Komponen UI

### Kalkulator Estimasi & Simulasi Muatan
- Selector Rute Logistik & Pilihan Jenis Kendaraan Armada
- Tabel Proyeksi ETA Kedatangan per Stop Perhentian
- Akumulasi Total Jarak (KM) dan Total Waktu Tempuh (Jam/Menit)
- Simulasi Beban Muatan Paket (Kg) vs Ambang Batas Maksimal Kendaraan

