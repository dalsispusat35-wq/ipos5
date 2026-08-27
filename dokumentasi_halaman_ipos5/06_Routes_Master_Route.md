# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 6 — ROUTES MANAGEMENT (MASTER RUTE LOGISTIK)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Master Route Logistik (/route) |
| **Kategori Menu** | OPERATIONS / MASTER DATA |
| **Route URL** | /route |
| **File Komponen React** | src/pages/MasterRoute.jsx |
| **Backend API Endpoints** | GET /api/route, POST /api/route, PUT /api/route/:id, DELETE /api/route/:id |
| **Koleksi MongoDB** | master_route_nopen, detail_route, master_kantor |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Master Route mengelola struktur jaringan trayek rute distribusi pos (Feeder, Intercity, Transit Hub). Setiap rute mendefinisikan titik asal keberangkatan (origin), titik tujuan akhir (destination), daftar urutan pos perhentian (detail_route waypoints), estimasi jarak tempuh kilometer, durasi menit, serta matriks cakupan prefix kode pos tujuan pengiriman (1: Jabodetabek, 2: Sumatera, 3: Jateng, dst).

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Master Rute Logistik disusun dalam bentuk kartu akordeon interaktif:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] HEADER & TOOLBAR: Judul ("Master Rute Logistik & Feeder") | [🔄 Refresh] | [+ Tambah Rute Baru]     |
+---------------------------------------------------------------------------------------------------------+
| [B] ADD ROUTE FORM BOX (Collapsible): Kode Rute, Nama, Origin, Destination, Coverage Nopend, Prefix Dest|
+---------------------------------------------------------------------------------------------------------+
| [C] SEARCH BAR: Cari Kode Rute (e.g. RTE-1, RT-MALAM) atau Nama Lintasan Trayek                          |
+---------------------------------------------------------------------------------------------------------+
| [D] ROUTE ACCORDION CARDS LIST (Daftar Rute Expandable)                                                 |
| +-----------------------------------------------------------------------------------------------------+ |
| | [D1] RTE-1: Rute Feeder Terpadu Cimahi Raya -> SPP Bandung                        [Expand / Collapse]| |
| | - Asal: KPRK Cimahi (40511) -> Tujuan: SPP Bandung (40000)                                          | |
| | - Total Jarak: 25 km | Estimasi Durasi: 45 min | Destination Prefix: [1] [2] [3] [7] [9]            | |
| | --------------------------------------------------------------------------------------------------- | |
| | (Saat Di-expand / Dibuka):                                                                          | |
| | [Stop 1: 40511 KPRK Cimahi] -> [Stop 2: 40512 Cisangkan] -> [Stop 3: 40514 Melong] -> [40000 SPP]  | |
| | - Checkpoints Table: Sequence, Kode Stop, Nama Kantor Pos, Tipe Node, Est Waktu Tiba, Jarak Parsial | |
| | - Origin Nopend Coverage Chips: [40511] [40500] [40512] [40514]                                     | |
| | - Destination Matrix Badge Explanations: 1: Jabodetabek, 2: Sumatera, 3: Jateng, 7: Kalimantan     | |
| | - Action Buttons: [🧪 Uji Simulasi Rute]  |  [✏️ Edit Rute]  |  [🗑️ Hapus]                            | |
| +-----------------------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Header & Toolbar** | Top Header Toolbar | Menampilkan judul modul, tombol refresh sinkronisasi rute, dan tombol pemicu form tambah rute. | Data rute aktif | Tombol '+ Tambah Rute Baru' membuka form drawer pembuat rute baru. |
| **Kotak [B]: Add Route Form Box** | Collapsible Form Card | Formulir pendefinisian rute baru: Kode Rute, Nama Rute, Origin Nopen, Destination Nopen, Nopen Asal Yang Dilayani, Filter Prefix Tujuan, Jarak KM, Durasi. | State `form` | Penyimpanan struktur data ke koleksi `master_route_nopen` dan segmen ke `detail_route`. |
| **Kotak [C]: Search Bar** | Input Pencarian | Memfilter rute berdasarkan kode unik (RTE-1, RTE-2) atau nama koridor lintasan. | State `searchTerm` | Penyaringan dinamis instan pada kartu rute. |
| **Kotak [D1]: Route Accordion Header** | Accordion Title Bar | Menampilkan Route ID, Nama Rute, Asal -> Tujuan, Total Jarak (KM), Total Durasi (Menit), dan Badge Kategori Prefix Tujuan. | Dokumen `master_route_nopen` | Klik baris membuka / menutup rincian seluruh checkpoint perhentian. |
| **Kotak [D2]: Checkpoints Waypoint Table** | Tabel Checkpoints di dalam Accordion | Daftar urutan perhentian (Sequence 1 sampai N) dengan kode kantor, nama lokasi, tipe node, estimasi jam tiba, dan jarak tempuh parsial. | Koleksi `detail_route` | Memetakan titik singgah fisik pengangkutan kantong pos. |
| **Kotak [D3]: Coverage & Matrix Badges** | Chips Matriks Cakupan Wilayah | Menampilkan daftar nopend asal yang dilayani dan pemetaan prefix tujuan (1: Jabodetabek, 2: Sumatera, 3: Jateng, 4: Jabar, 5: Jatim Barat, 7: Kalimantan, dll). | Atribut `originNopenList` & `destinationPrefixFilter` | Panduan visual bagi operator untuk memastikan rute yang dipilih menjangkau kota tujuan paket. |
| **Kotak [D4]: Action Buttons** | Action Button Group | Menyediakan tombol 'Uji Simulasi Rute', 'Edit Rute', dan 'Hapus Rute'. | Routing engine | Tombol 'Uji Simulasi' langsung mengarahkan operator ke halaman Milk Run (/route-journey) dengan rute terpilih. |

## 3. Aturan Bisnis & Algoritma Routing Engine

- Pencocokan Otomatis Resi: Backend memeriksa `origin_nopen` resi terhadap `originNopenList` rute dan digit pertama `destination_nopen` terhadap `destinationPrefixFilter`.
- Prioritas Trayek: Rute dengan nilai prioritas 1 dieksekusi lebih dahulu dibandingkan rute sekunder (prioritas 2).

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator membuka halaman Master Route Logistik (/route).
- 2. Operator memperluas akordeon rute untuk meninjau urutan perhentian kantor pos.
- 3. Operator memverifikasi jarak kilometer dan estimasi menit tempuh antar-kantor cabang.
- 4. Operator dapat mengklik 'Uji Simulasi Rute' untuk memvalidasi alur muatan barang sebelum jadwal dijalankan.
