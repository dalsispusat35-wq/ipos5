# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 5 — FLEET MANAGEMENT (MASTER KENDARAAN ARMADA)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Master Kendaraan Armada (/kendaraan) |
| **Kategori Menu** | MASTER DATA |
| **Route URL** | /kendaraan |
| **File Komponen React** | src/pages/MasterKendaraan.jsx |
| **Backend API Endpoint** | GET /api/kendaraan, POST /api/kendaraan, PUT /api/kendaraan/:id, DELETE /api/kendaraan/:id |
| **Koleksi MongoDB** | master_kendaraan, route_journeys |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Fleet Management bertanggung jawab mengelola seluruh unit kendaraan operasional angkutan pos (Gran Max Box, Isuzu Elf Box, Mitsubishi Canter, Hino Wingbox, Blind Van). Modul ini menyimpan nomor polisi (Plat Nopol), nama driver, nomor HP driver, kapasitas angkut maksimum (kg/ton), kantor pangkalan (Home Base), serta rute utama yang ditugaskan.

## 2. Fitur-Fitur Utama & Komponen UI

### Kartu Profil Armada & Live Status
- Grid Kartu Kendaraan dengan Indikator Kapasitas Maksimum (misal 1500 kg / 4000 kg)
- Status Keberadaan Kendaraan Real-Time di MongoDB (AKTIF, IN_PROGRESS, MAINTENANCE)
- Modal Input & Edit Kendaraan Baru (Plat Nopol, Tipe Bodi, Driver, Phone, Home Base, Assigned Route)
- Filter Berdasarkan Home Base Kantor Pos (40511 Cimahi, 40000 SPP Bandung, dll.)
- Akses Cepat Tombol 'Lacak di Checker' untuk melihat muatan live kendaraan tersebut

