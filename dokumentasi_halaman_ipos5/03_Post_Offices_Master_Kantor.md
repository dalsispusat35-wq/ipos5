# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 3 — POST OFFICES (MASTER DATA KANTOR POS)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Master Kantor Pos (/kantor) |
| **Kategori Menu** | OPERATIONS / MASTER DATA |
| **Route URL** | /kantor |
| **File Komponen React** | src/pages/MasterKantor.jsx |
| **Backend API Endpoints** | GET /api/kantor, POST /api/kantor, PUT /api/kantor/:id, DELETE /api/kantor/:id |
| **Koleksi MongoDB** | master_kantor |
| **Hak Akses Role** | Semua Role (CRUD Dibatasi untuk Super Admin & Branch Manager) |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Master Kantor Pos berfungsi untuk mengelola seluruh direktori titik node jaringan kantor pos di Indonesia. Mencakup Sentral Pengolahan Pos (SPP), Kantor Cabang Utama (KCU), Kantor Cabang (KC), Kantor Cabang Pembantu (KCP), hingga Agen Pos, lengkap dengan atribut Nopend 5-digit, hierarki pembina KCU, alamat, dan titik koordinat GPS.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Master Kantor Pos disusun secara modular dengan grid data interaktif:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] HEADER BAR: Judul ("Master Kantor Pos") | Total Node Jaringan | [+ Tambah Kantor] | [📥 Export CSV] |
+---------------------------------------------------------------------------------------------------------+
| [B1] Total Jaringan | [B2] Bandung & Cimahi | [B3] KCU Utama    | [B4] KCP Cabang   | [B5] Agenpos & SPP|
|      13.768 Kantor  |      19 Titik Kunci   |      1.834 Kantor |      11.001 Kantor|      914 / 19 SPP |
+---------------------+-----------------------+-------------------+-------------------+-------------------+
| [C] FILTER TABS & SEARCH CONTROLLER                                                                     |
| - Tabs: [Bandung & Cimahi (Kunci)] | [Semua Kantor] | [KCU] | [KC] | [KCP] | [Agen Pos] | [SPP / DC]    |
| - Search Bar: Input pencarian Nopend 5 digit, Nama Kantor, Kecamatan, Kota, atau Provinsi              |
+---------------------------------------------------------------------------------------------------------+
| [D] MASTER DATA TABLE KANTOR POS                                                                        |
| - Kolom: Nopend (Copyable), Nama Kantor, Tipe Node Badge, Alamat, Wilayah/Kota, Telp, GPS Lat/Long, Aksi|
+---------------------------------------------------------------------------------------------------------+
| [E] PAGINATION FOOTER: "Menampilkan 1-10 dari X kantor" | [◀ Prev] [1] [2] [3] [Next ▶]                 |
+---------------------------------------------------------------------------------------------------------+
| [F] MODALS (Kondisional): [Modal Detail Kantor] | [Modal Tambah/Edit Kantor] | [Modal GPS OpenStreetMap]|
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Header Bar & Actions** | Top Bar Header | Menampilkan judul modul, badge total node kantor, tombol pemicu form tambah kantor baru, dan tombol ekspor data CSV. | Metadata `summaryStats.total` | Tombol '+ Tambah Kantor Pos' membuka modal form penambahan kantor baru, tombol 'Export CSV' mengunduh berkas spreadsheet. |
| **Kotak [B1 - B5]: 5 KPI Summary Cards** | Grid 5 Kartu Rangkuman (Row 1) | Menampilkan jumlah total titik kantor pos, hub prioritas Bandung-Cimahi (19), KCU (1.834), KCP (11.001), dan Agen/SPP. | Object `summaryStats` dari backend | Kartu memberikan ikhtisar struktur sebaran jaringan fisik PT Pos Indonesia secara instan. |
| **Kotak [C]: Filter Tabs & Search Bar** | Filter Bar & Input Box (Row 2) | Menyediakan tab pemfilteran berdasarkan jenis kantor serta bilah pencarian teks bebas (Nopend, nama kantor, kota). | State `activeTab` & `search` | Mengubah tab mereset halaman ke 1 dan menyaring data server-side secara real-time. |
| **Kotak [D]: Master Data Table Kantor** | Tabel Data Responsif (Row 3) | Tabel utama penampil data kantor pos: Nopend (dengan tombol salin), Nama Kantor, Badge Tipe, Alamat, Kota, Koordinat. | Array `offices` dari GET /api/kantor | Tombol salin Nopend, tombol aksi 'Lihat Profil Detail', dan tombol aksi 'Lihat Peta GPS'. |
| **Kotak [E]: Pagination Footer** | Footer Bar Navigasi Halaman | Menampilkan rentang data aktif yang sedang dilihat serta kontrol navigasi tombol Prev, Next, dan Nomor Halaman. | State `page`, `totalPages`, `totalCount` | Pindah halaman secara server-side pagination dengan limit 10 kantor per halaman. |
| **Kotak [F]: Modals Profil, CRUD, & Maps** | Modal Pop-up Jendela Mengambang | Menampilkan rincian lengkap profil kantor, form isian data kantor baru/edit, serta visualisasi titik lokasi GPS. | State `selectedOffice`, `selectedMapOffice` | Form validasi input Nopend 5 digit unik, koordinat latitude longitude, dan penugasan KCU pembina. |

## 3. Aturan Bisnis & Integrasi Nopend

- Keunikan Nopend: Nopend (Nomor Pendirian) 5 digit angka bersifat unik sebagai Primary Key Lookup.
- Integrasi Routing Engine: Routing engine backend (`TransactionController.checkRouting`) menggunakan Nopend untuk memetakan origin dan destination pengiriman resi.
- Hierarki Kantor: Setiap KCP terhubung dengan Nopend pembina (KCU / KC induk).

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator membuka halaman Master Kantor Pos (/kantor).
- 2. Operator memilih tab klasifikasi (misal: 'Bandung & Cimahi' atau 'KCU') atau mengetik Nopend di kolom pencarian.
- 3. Operator dapat menyalin Nopend untuk keperluan verifikasi pengiriman di modul lain.
- 4. Operator berwenang dapat menambah kantor baru atau mengunduh seluruh data dalam format CSV.
