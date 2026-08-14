# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 6 — ROUTES MANAGEMENT (MASTER RUTE LOGISTIK)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Master Route Logistik (/route) |
| **Kategori Menu** | MASTER DATA |
| **Route URL** | /route |
| **File Komponen React** | src/pages/MasterRoute.jsx |
| **Backend API Endpoint** | GET /api/routes, POST /api/routes, GET /api/routes/:routeId/segments |
| **Koleksi MongoDB** | master_route_nopen, detail_route |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Master Route mengelola skema rute jaringan trayek antar-kantor pos. Setiap rute memiliki identitas `route_id` (contoh: `RT-MALAM-B9910-PCX`), kantor asal (nopen_asal), kantor tujuan (nopen_tujuan), prioritas pemilihan, kategori mile (FIRST_MILE, MIDDLE_MILE, LAST_MILE), serta sekumpulan segmen perhentian (detail_route waypoints).

## 2. Fitur-Fitur Utama & Komponen UI

### Pengelolaan Header Rute & Waypoints Segmen
- Tabel Master Route Nopen dengan Informasi Akumulasi Total Jarak (KM) & Total Est. Menit
- Modal Detail Waypoints Segmen (Sequence Stop 1, Stop 2... Stop N)
- Editor Segmen Rute (Asal Nopen -> Tujuan Nopen, Jarak KM, Estimasi Menit, Role Stop)
- Badge Kategori Mile (First Mile = Hijau, Middle Mile = Biru, Last Mile = Ungu)
- Toggle Status Aktif Rute (Y/N)

