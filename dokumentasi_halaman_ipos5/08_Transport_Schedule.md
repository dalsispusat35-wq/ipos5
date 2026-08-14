# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 8 — TRANSPORT SCHEDULE (JADWAL TRANSPORTASI HARIAN)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Jadwal Transportasi Harian (/jadwal) |
| **Kategori Menu** | LOGISTICS |
| **Route URL** | /jadwal |
| **File Komponen React** | src/pages/JadwalTransportasi.jsx |
| **Backend API Endpoint** | GET /api/jadwal, POST /api/jadwal, PUT /api/jadwal/:id |
| **Koleksi MongoDB** | jadwal_transportasi, master_kendaraan, master_route_nopen |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Jadwal Transportasi mengelola eksekusi jadwal perjalanan armada aktual pada tanggal tertentu. Berbeda dengan template, jadwal transportasi memuat tanggal berangkat riil, nomor polisi kendaraan riil yang ditugaskan, jam berangkat riil, serta status keberangkatan (READY, DEPARTED, ARRIVED, CANCELLED).

## 2. Fitur-Fitur Utama & Komponen UI

### Kalender & Monitoring Jadwal Harian
- Date Filter Tanggal Operasional Jadwal
- Tabel Monitoring Jam Berangkat vs Jam Realisasi Armada
- Badge Status Keterlambatan / On-Time Departure
- Action Button Penugasan Driver & Mobil pada Jadwal Aktif

