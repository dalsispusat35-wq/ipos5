# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 13 — DATABASE VIEWER (TABEL TRANSAKSI RESI)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Database Viewer Transaksi (/transaksi) |
| **Kategori Menu** | SYSTEM / RESTRICTED DATA VIEWER |
| **Route URL** | /transaksi |
| **File Komponen React** | src/pages/Transaksi.jsx |
| **Backend API Endpoints** | GET /api/transaksi?page=1&limit=25, GET /api/transaksi/stats, GET /api/transaksi/:connoteCode |
| **Koleksi MongoDB** | transaksi, master_kantor, master_kendaraan |
| **Hak Akses Role** | Restricted (Super Admin & Authorized Operators) |

---

## 1. Deskripsi & Tujuan Utama Modul

Database Viewer merupakan modul penjelajah dan audit data mentah seluruh dokumen transaksi resi kiriman di koleksi MongoDB `transaksi`. Modul ini dilengkapi sistem pencarian teks bebas (debounced search), penyaringan multi-parameter (Status, Layanan, Nopend Tujuan, KPRK, Regional 1–6, Plat Armada, Rentang Tanggal), paginasi server-side berkecepatan tinggi, serta modal inspeksi dokumen resi dan telemetri armada.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Database Viewer Transaksi disusun dalam arsitektur tabel korporat:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] HEADER: Judul ("Database Viewer Transaksi") | Badge Total Data MongoDB | Timestamp Sync | [🔄 Sync] |
+---------------------------------------------------------------------------------------------------------+
| [B1] Total Transaksi | [B2] Dalam Pengiriman | [B3] Selesai / Terkirim   | [B4] Muatan Terdaftar        |
|      922 Resi        |      785 Resi (85%)   |      137 Resi (15%)       |      43.5 Ton                |
+----------------------+-----------------------+---------------------------+------------------------------+
| [C] ADVANCED MULTI-FILTER & SEARCH CONTROL PANEL                                                        |
| - Baris 1: Debounced Search Input (Resi, Pengirim, Penerima, Kota) | Filter Status | Filter Layanan      |
| - Baris 2: Filter KPRK Tujuan | Filter Regional (Reg 1-6) | Filter Nopol Armada | Date From s/d Date To   |
| - Baris 3: Selector Baris per Halaman (10, 25, 50, 100) | Tombol [Reset Filter]                            |
+---------------------------------------------------------------------------------------------------------+
| [D] COMPREHENSIVE TRANSACTIONS DATA TABLE                                                               |
| - Kolom: No, Resi (Copyable), Tanggal, Layanan, Asal, Tujuan KPRK, Berat (kg), Tarif, Status, Nopol, Aksi|
+---------------------------------------------------------------------------------------------------------+
| [E] PAGINATION & ROWS FOOTER: "Menampilkan 1-25 dari 922 data" | [◀ Prev] [1] [2] [3] ... [Next ▶]       |
+---------------------------------------------------------------------------------------------------------+
| [F] MODALS: [Modal Detail Resi Connote] | [Modal Profil & Telemetri Kendaraan (`VehicleDetailModal`)]   |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Header Bar & Sync Info** | Top Header Bar | Menampilkan judul modul, badge jumlah total data di database MongoDB `transaksi`, waktu sinkronisasi terakhir, dan tombol refresh data. | Metadata database MongoDB | Tombol '🔄 Sync' memuat ulang data langsung dari database. |
| **Kotak [B1 - B4]: 4 Metric Summary Cards** | Grid 4 Kartu Rangkuman (Row 1) | Menampilkan jumlah total transaksi resi, paket dalam pengiriman aktif, paket sukses terkirim, dan total berat muatan terdaftar. | Agregasi stats dari backend | Memberikan gambaran cepat sebaran status transaksi. |
| **Kotak [C]: Advanced Multi-Filter Panel** | Multi-Row Filter Control Card (Row 2) | Bilah filter komprehensif: Debounced Search Input (400ms delay), Filter Status, Filter Layanan, Filter KPRK, Filter Regional, Filter Plat Armada, Date Picker Dari-Sampai, dan Page Size Selector. | State filter transaksi | Filter multi-kriteria dieksekusi secara server-side query. |
| **Kotak [D]: Comprehensive Data Table** | Tabel Data Transaksi Responsif (Row 3) | Menampilkan tabel data transaksi: Nomor Baris, Kode Resi (dengan tombol salin), Tanggal Transaksi, Badge Layanan, Kantor Asal, Nopend/KPRK Tujuan, Berat (kg), Biaya Kirim (Rp), Badge Status, Plat Armada (Link), Tombol Aksi. | Array `data` dari GET /api/transaksi | Klik Plat Nopol membuka modal telemetri mobil, klik tombol aksi membuka modal detail resi. |
| **Kotak [E]: Pagination & Rows Footer** | Footer Bar Navigasi Paginasi | Menampilkan info baris aktif ('Menampilkan X-Y dari Z data') dan tombol navigasi halaman (Prev, Next, Page Numbers). | State `page`, `totalPages`, `totalRows` | Paginasi server-side cepat dengan limit 10, 25, 50, atau 100 baris. |
| **Kotak [F]: Details Modals Popup** | Modal Pop-up Jendela Mengambang | Menampilkan rincian dokumen resi paket (kontak pengirim, penerima, riwayat pergerakan) atau spesifikasi armada mobil. | State `selectedConnote` & `selectedVehicle` | Inspeksi data mentah JSON dokumen MongoDB. |

## 3. Aturan Bisnis & Pengindeksan Database

- Server-side Query Optimization: Backend memanfaatkan indeks MongoDB pada field `connote_code`, `created_at`, `connote_state`, dan `destination_nopen` untuk memastikan respon query di bawah 100ms.
- Debounced Search: Input pencarian menggunakan delay 400ms sebelum request dikirimkan ke server guna menghemat beban query database.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator membuka modul Database Viewer (/transaksi).
- 2. Operator mengetikkan nomor resi atau nama pihak pengirim pada kolom pencarian.
- 3. Operator dapat menyaring berdasarkan status pengiriman atau wilayah regional tertentu.
- 4. Operator mengklik tombol 'Lihat Detail' untuk memeriksa rincian lengkap transaksi paket.
