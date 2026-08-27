# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 15 — USER PROFILE & ACCOUNT MANAGEMENT

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | User Profile & Account (/profile) |
| **Kategori Menu** | ACCOUNT / SECURITY MANAGEMENT |
| **Route URL** | /profile |
| **File Komponen React** | src/pages/Profile.jsx |
| **Backend API Endpoints** | GET /api/auth/me, PUT /api/auth/update-profile, POST /api/auth/change-password |
| **Koleksi MongoDB** | users |
| **Hak Akses Role** | Semua Role (Super Admin, Operator, Dispatcher, Driver) |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman User Profile & Account menampilkan identitas profil akun pegawai pos yang sedang aktif login, mencakup Nama Lengkap, Nomor Induk Pegawai (NIP), Username, Hak Akses Role (SUPER_ADMIN / OPERATOR), Unit Kantor Pos Penugasan (misal KCU Cimahi 40511), fitur pembaruan kata sandi, status otentikasi ganda (2FA), serta riwayat log audit sesi login pengguna.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman User Profile & Account disusun dalam arsitektur profil personal yang rapi:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] USER PROFILE HERO BANNER                                                                            |
| - Avatar Profil Pengguna & Tombol Ganti Foto Avatar                                                     |
| - Nama Lengkap Pengguna (e.g. "Sari Rahayu") | NIP Pegawai Pos [99283741]                              |
| - Role Badge: [SUPER_ADMIN / DISPATCHER] | Unit Kerja: [40511 - KCU Cimahi]                             |
+---------------------------------------------------------------------------------------------------------+
| [B] PERSONAL & OFFICE ACCOUNT INFORMATION FORM                                                          |
| - Form Grid: Nama Lengkap, NIP Pegawai, Username Login, Email Resmi Pos, No Telp / WA, Cabang Penugasan|
| - Tombol: [💾 Simpan Perubahan Profil]                                                                  |
+---------------------------------------------------------------------------------------------------------+
| [C] SECURITY & PASSWORD MANAGEMENT CARD                                                                 |
| - Form Ubah Password: Password Saat Ini, Password Baru, Konfirmasi Password Baru                        |
| - Two-Factor Authentication (2FA) Security Status Badge                                                 |
| - Tombol: [🔒 Perbarui Kata Sandi]                                                                      |
+---------------------------------------------------------------------------------------------------------+
| [D] RECENT ACTIVITY & LOGIN SESSION AUDIT TRAIL                                                         |
| - Tabel Riwayat Sesi: Waktu Login WIB, Alamat IP Client, Perangkat / Browser, Status Sesi Aktif           |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: User Profile Hero Banner** | Hero Banner Card (Paling Atas) | Menampilkan avatar pengguna, nama lengkap, NIP resmi pegawai, badge hak akses peran (SUPER_ADMIN / DISPATCHER), dan kantor cabang tugas. | Dokumen user aktif dari token JWT / session | Tombol unggah foto avatar profil baru. |
| **Kotak [B]: Personal & Office Info Form** | Spatial Form Card (Tengah Kiri) | Formulir pembaruan data personel: Nama Lengkap, NIP, Username, Alamat Email Resmi (@posindonesia.co.id), Nomor WhatsApp/Telepon, Cabang Tugas. | Koleksi MongoDB `users` | Validasi format email dan nomor telepon, tombol '💾 Simpan Perubahan Profil'. |
| **Kotak [C]: Security & Password Card** | Spatial Form Card (Tengah Kanan) | Formulir perubahan kata sandi (Password Lama, Password Baru, Konfirmasi Password) serta indikator keamanan status Two-Factor Auth (2FA). | Endpoint POST /api/auth/change-password | Enkripsi password menggunakan Bcrypt hash dengan salt rounds standar industri, tombol '🔒 Perbarui Kata Sandi'. |
| **Kotak [D]: Recent Activity Audit Trail** | Spatial Table Card (Bawah Halaman) | Tabel jejak audit aktivitas sesi login: Timestamp WIB, Alamat IP perangkat, Tipe Browser / OS, dan status sesi (Active / Logged Out). | Log sesi keamanan akun | Pencegahan akses tidak sah dan transparansi jejak operasional pengguna. |

## 3. Aturan Bisnis & Kebijakan Keamanan Akun

- Keamanan Kata Sandi: Kata sandi baru wajib memenuhi kriteria minimal 8 karakter dan di-hash menggunakan algoritma Bcrypt.
- Pemisahan Hak Akses (RBAC): Hak akses role (Super Admin vs Operator) hanya dapat diubah oleh akun dengan level Super Admin.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Pengguna membuka halaman Profil (/profile) melalui menu avatar di navigasi atas.
- 2. Pengguna memeriksa kesesuaian unit kerja dan nomor kontak WhatsApp aktif.
- 3. Pengguna dapat mengubah kata sandi secara berkala untuk menjaga keamanan akun.
- 4. Pengguna meninjau log aktivitas login untuk memastikan tidak ada aktivitas mencurigakan dari IP asing.
