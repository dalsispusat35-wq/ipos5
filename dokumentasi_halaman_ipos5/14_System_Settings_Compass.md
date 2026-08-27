# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 14 — SYSTEM SETTINGS & COMPASS CONNECTION

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | System Settings & Compass Manager (/settings & /compass) |
| **Kategori Menu** | SYSTEM / DATABASE CONFIGURATION |
| **Route URL** | /settings, /compass |
| **File Komponen React** | src/pages/Settings.jsx, src/pages/Compass.jsx |
| **Backend API Endpoints** | POST /api/settings/test-db, GET /api/compass/connections, POST /api/compass/switch |
| **Koleksi MongoDB** | Konfigurasi MongoDB Multi-Server (`connections.json`) |
| **Hak Akses Role** | SUPER_ADMIN Only (Hak Akses Penuh Konfigurasi) |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul System Settings & Compass Manager digunakan secara eksklusif oleh Super Admin untuk mengelola koneksi database MongoDB multi-server. Modul ini mendukung konfigurasi connection string MongoDB live sync, pengujian latensi koneksi (Ping/Test Connection), pengalihan server database aktif secara instan (Primary Remote 192.168.5.219 vs Local Fallback 127.0.0.1), serta pengaturan enkripsi TLS dan protokol otentikasi SCRAM-SHA-256.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman System Settings & Compass dirancang dalam format panel konfigurasi aman:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] DATABASE CONNECTION SETTINGS CARD                                                                   |
| - Header: Ikon Sinyal Wifi, Judul ("Database Connection"), Badge Status [Connected / Disconnected]     |
| - Connection URI Input Box (Input Text / Password Toggle dengan Ikon Mata)                              |
|   Default: mongodb://127.0.0.1:27017/ipos5_reporting                                                    |
| - Tombol Aksi: [⚡ Test Connection]  |  [💾 Simpan & Terapkan]  |  [🔌 Disconnect]                       |
| - Keterangan: Last Tested Timestamp WIB                                                                 |
+---------------------------------------------------------------------------------------------------------+
| [B] COMPASS MULTI-CLUSTER CONNECTION PRESETS                                                            |
| +------------------------------------+ +------------------------------------+                          |
| | [B1] Primary Remote Mongo (Active) | | [B2] Local Development MongoDB     |                          |
| | - IP: 192.168.5.219:27017          | | - IP: 127.0.0.1:27017              |                          |
| | - DB: ipos5_reporting              | | - DB: ipos5_reporting              |                          |
| | - Status: [● Active Connected]     | | - Tombol: [Beralih ke Server Ini]  |                          |
| +------------------------------------+ +------------------------------------+                          |
+---------------------------------------------------------------------------------------------------------+
| [C] SECURITY & PROTOCOL SETTINGS CARD                                                                   |
| - SSL/TLS Encryption Toggle | SCRAM-SHA-256 Auth Protocol | Connection Timeout (ms)                      |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Database Connection Settings Card** | Spatial Card Konfigurasi Utama | Panel pengaturan string koneksi URI MongoDB aktif, status koneksi (Connected/Disconnected/Testing), dan waktu pengujian terakhir. | State `uri`, `connected`, `lastTested` | Input field dengan toggle show/hide password, tombol '⚡ Test Connection' menguji respon server, tombol simpan menerapkan koneksi. |
| **Kotak [B1]: Primary Remote Mongo Preset** | Cluster Preset Card (Server Utama) | Profil koneksi server MongoDB pusat jaringan kantor pos (`192.168.5.219:27017/ipos5_reporting`). | File konfigurasi `connections.json` | Badge '● Active Connected' menandakan server ini sedang melayani seluruh permintaan sistem. |
| **Kotak [B2]: Local Development Mongo Preset** | Cluster Preset Card (Server Lokal) | Profil koneksi server MongoDB lokal pengembang (`127.0.0.1:27017/ipos5_reporting`) untuk pengujian offline. | File konfigurasi `connections.json` | Tombol 'Beralih ke Server Ini' mengalihkan koneksi sistem ke workstation lokal secara instan. |
| **Kotak [C]: Security & Protocol Settings Card** | Spatial Card Keamanan Jaringan | Konfigurasi parameter keamanan tingkat lanjut: Enkripsi SSL/TLS, mekanisme otentikasi pengguna SCRAM-SHA-256, dan batas waktu time-out koneksi. | Protokol keamanan driver MongoDB | Saklar proteksi enkripsi data sensitif transaksi pengiriman pos. |

## 3. Aturan Bisnis & Keamanan Koneksi Database

- Otentikasi Kredensial: String koneksi yang memuat password secara otomatis disamarkan (masked) untuk mencegah kebocoran visual kredensial.
- Failover Aman: Apabila pengujian koneksi ke server baru gagal, sistem mempertahankan koneksi aktif yang ada tanpa mengganggu operasional sistem.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Super Admin membuka menu System Settings (/settings).
- 2. Super Admin memeriksa status konektivitas database pada badge status [A].
- 3. Bila diperlukan pengalihan server, Super Admin mengklik tombol 'Beralih ke Server Ini' pada kartu preset [B].
- 4. Sistem melakukan uji ping koneksi dan menyinkronkan seluruh modul ke database terpilih.
