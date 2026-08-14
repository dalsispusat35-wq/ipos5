# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 7 — SCHEDULE TEMPLATES (TEMPLATE JADWAL TRANSPORTASI)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Template Jadwal Transportasi (/template) |
| **Kategori Menu** | LOGISTICS |
| **Route URL** | /template |
| **File Komponen React** | src/pages/TemplateJadwal.jsx |
| **Backend API Endpoint** | GET /api/template-jadwal, POST /api/template-jadwal, PUT /api/template-jadwal/:id |
| **Koleksi MongoDB** | template_jadwal_transportasi, master_kendaraan, master_route_nopen |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul ini menyimpan pola cetak biru (master template) jadwal keberangkatan armada harian. Template ini menentukan jam berangkat acuan, jam tiba acuan, shift (Pagi/Siang/Malam), dan kendaraan acuan untuk setiap rute sebelum digenerate menjadi jadwal harian aktual.

## 2. Fitur-Fitur Utama & Komponen UI

### Master Template Builder & Generator
- Tabel Template Jadwal per Rute Trayek Logistik
- Form Pengaturan Jam Berangkat Standar & Jam Tiba Standar
- Tombol Action 'Generate Jadwal Harian' untuk meng-copy template ke Jadwal Transportasi Aktif
- Filter Shift Operasional (PAGI, SIANG, MALAM)

