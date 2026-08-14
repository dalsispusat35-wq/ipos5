# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 14 — SYSTEM SETTINGS & COMPASS CONNECTION

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | System Settings & Compass Manager (/settings & /compass) |
| **Kategori Menu** | SYSTEM (RESTRICTED) |
| **Route URL** | /settings, /compass |
| **File Komponen React** | src/pages/SettingsPage.jsx, src/pages/Compass.jsx |
| **Backend API Endpoint** | GET /api/compass/connections, POST /api/compass/connect, POST /api/compass/switch |
| **Koleksi MongoDB** | Konfigurasi MongoDB Multi-Server (`connections.json`) |
| **Hak Akses Role** | SUPER_ADMIN Only |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul System Settings & Compass Manager digunakan oleh Super Admin untuk mengelola koneksi database MongoDB multi-server (Primary Remote Mongo 192.168.5.219 vs Local Mongo 127.0.0.1), menguji ping koneksi, dan mengkonfigurasi parameter sistem.

## 2. Fitur-Fitur Utama & Komponen UI

### Multi-Server MongoDB Switcher & Diagnostic
- Card Manager Koneksi MongoDB (Primary Server vs Local Fallback)
- Indicator Status Live Connection (Badge Hijau Connected / Merah Disconnected)
- Tombol Action 'Ping Connection' & 'Switch Connection'
- Input Form Tambah Profil Server MongoDB Baru (URI & Database Name)

