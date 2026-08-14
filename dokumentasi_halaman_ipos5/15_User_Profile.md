# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 15 — USER PROFILE & ACCOUNT MANAGEMENT

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | User Profile & Account (/profile) |
| **Kategori Menu** | ACCOUNT |
| **Route URL** | /profile |
| **File Komponen React** | src/pages/Profile.jsx |
| **Backend API Endpoint** | GET /api/auth/me, PUT /api/auth/update-profile |
| **Koleksi MongoDB** | users |
| **Hak Akses Role** | Semua Role (Operator & Super Admin) |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Profile menampilkan informasi akun pengguna yang sedang login (Nama Lengkap, Username, Role, NIP / ID Pegawai Pos, Kantor Operasional), serta menyediakan fitur ubah password dan manajemen sesi login.

## 2. Fitur-Fitur Utama & Komponen UI

### User Profile Card & Security Settings
- Kartu Informasi Pengguna dengan Badge Hak Akses (SUPER_ADMIN / OPERATOR)
- Form Update Informasi Profil & Alamat Email
- Form Ganti Password Sesi Login
- Riwayat Sesi Aktivitas Login User

