# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 3 — POST OFFICES (MASTER DATA KANTOR POS)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Master Kantor Pos (/kantor) |
| **Kategori Menu** | OPERATIONS / MASTER DATA |
| **Route URL** | /kantor |
| **File Komponen React** | src/pages/MasterKantor.jsx |
| **Backend API Endpoint** | GET /api/kantor, POST /api/kantor, PUT /api/kantor/:id, DELETE /api/kantor/:id |
| **Koleksi MongoDB** | master_kantor |
| **Hak Akses Role** | Semua Role (CRUD Terbatas untuk Operator) |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Master Kantor Pos berfungsi untuk mengelola seluruh direktori titik node jaringan kantor pos di Indonesia, mulai dari Sentral Pengolahan Pos (SPP), Kantor Cabang Utama (KCU), Kantor Cabang (KC), Kantor Cabang Pembantu (KCP), hingga Agen Pos.

## 2. Fitur-Fitur Utama & Komponen UI

### Manajemen Data & Filter Node
- Tabel Master Kantor Pos dengan Pagination & Search Nopend / Nama Kantor
- Badge Klasifikasi Tipe Kantor (SPP = Biru, KCU = Ungu, KC = Hijau, KCP = Oranye, AGEN = Abu-abu)
- Filter Dropdown berdasarkan Regional (Reg 1 - Reg 6 Jawa & Luar Jawa)
- Modal Tambah & Edit Data Kantor Pos (Nopend 5 digit, Nopen Induk KCU/KC, Alamat, Koordinat Lat/Long)
- Fitur Export Data Kantor Pos ke CSV / Excel

## 3. Aturan Logika Bisnis

- Nopend (Nomor Pendirian) bersifat unik (Primary Key Lookup) 5 digit angka.
- Nopend digunakan oleh routing engine backend (`TransactionController.checkRouting`) untuk memetakan titik asal (Origin) dan tujuan (Destination) pengiriman resi.

