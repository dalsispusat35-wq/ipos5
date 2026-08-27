# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 2 — PACKAGE TRACKING & CHECKER LOGISTIK

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Package Tracking & Checker (/checker) |
| **Kategori Menu** | OPERATIONS / AUDIT TRAIL |
| **Route URL** | /checker |
| **File Komponen React** | src/pages/Checker.jsx |
| **Backend API Endpoints** | GET /api/checker/:connoteOrNopol?date=YYYY-MM-DD, GET /api/kendaraan |
| **Koleksi MongoDB** | transaksi, master_kendaraan, route_journeys, detail_route, master_kantor, tracking_events |
| **Hak Akses Role** | Semua Role (Super Admin, Operator, Dispatcher, Customer Service) |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Package Tracking & Checker merupakan modul utama pelacakan dan audit lintasan pengiriman paket serta armada kendaraan. Modul ini memungkinkan operator memeriksa status nomor resi (14/15 digit) atau plat nomor kendaraan berdasarkan konteks Tanggal Operasional, menampilkan waypoint rute multi-stop, visualisasi beban muatan, manifest kargo per kantor tujuan, dan timeline jejak audit.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Package Tracking & Checker dirancang modular dengan urutan vertikal sebagai berikut:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] SEARCH & CONTEXT CONTROLLER BAR                                                                     |
| - Tab Mode: [🔍 Cari Resi / Connote]  |  [🚛 Cari Armada / Nopol]                                      |
| - Search Input: Nomor Resi 14-15 digit / Dropdown Nopol Mobil                                           |
| - Date Picker: Tanggal Operasional (YYYY-MM-DD) + Label WIB                                            |
| - Action Buttons: [📥 Import CSV]  |  [🛰️ Live GPS Map Modal]                                           |
| - Quick Sample Chips: Resi Hari Ini, Resi Historis 12 Agu, Armada B 9910 PCX                            |
+---------------------------------------------------------------------------------------------------------+
| [B] STRICT FUTURE DATE WARNING BANNER (Kondisional: Muncul bila tgl dipilih > hari ini)                 |
| - Banner Merah Prominen: "Tanggal Operasional Belum Tiba" (Menyembunyikan muatan palsu)                 |
+---------------------------------------------------------------------------------------------------------+
| [C] PRIMARY TELEMETRY & SPECIFICATION CARDS                                                             |
| - Resi Mode: Kode Resi, Layanan, Berat Asli, Status Badge, Kantor Asal, Kantor Tujuan, Pengirim/Penerima|
| - Fleet Mode: Plat Nopol, Tipe Armada, Driver, Homebase, Kapasitas Maks (1500 kg), Rute Utama          |
+---------------------------------------------------------------------------------------------------------+
| [D] MULTI-STOP ROUTE JOURNEY STEPPER (Sequential Waypoints)                                             |
| [Stop 1: KCU Asal] ======> [Stop 2: KCP Transit] ======> [Stop 3: KCP Transit] ======> [Stop 4: SPP DC] |
| (Seq, Nopend, Nama Kantor, Jam ETA/ETD, Load In, Load Out, Status Active/Passed)                       |
+---------------------------------------------------------------------------------------------------------+
| [E] VEHICLE CAPACITY GAUGE & LOAD SUMMARY                                                               |
| - Circular/Linear Gauge: % Beban Muatan Terpakai vs Kapasitas Maksimum (kg)                             |
| - Status Badge: Normal (<70%), Near Capacity (70-90%), Full (90-100%), Over Capacity (>100%)          |
+---------------------------------------------------------------------------------------------------------+
| [F] MANIFEST & CARGO ITEM BREAKDOWN ACCORDION                                                           |
| - Pengelompokan Kargo Berdasarkan Kantor Pos Tujuan (Paginated Group Card)                             |
| - Daftar Paket di Dalam Mobil: Resi, Layanan, Berat (kg), Nama Penerima, Status Scan                   |
+---------------------------------------------------------------------------------------------------------+
| [G] TRACKING EVENT HISTORY AUDIT LOG (Timeline Vertikal)                                                |
| [📦 ENTRY_LOKET] ---> [🚚 LOADED_ARMADA] ---> [🏢 ARRIVED_HUB] ---> [✅ DELIVERED]                     |
| (Timestamp WIB, Lokasi Kantor Pos, Operator/Driver, Keterangan Peristiwa)                               |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Search & Context Controller Bar** | Card Header Kontrol Utama (Paling Atas) | Bilah pengendali mode pencarian (Resi vs Armada), input nomor, pemilih tanggal operasional, dan chip sampel. | Input user & `SAMPLE_RESIS` | Tab switch mode pencarian, input teks dengan debounce/enter, date picker, tombol 'Import CSV' dan 'Live GPS'. |
| **Kotak [B]: Strict Future Date Warning Banner** | Alert Card Merah (Kondisional di bawah Header) | Peringatan resmi bila operator memilih tanggal di masa depan yang belum terlaksana. | Backend flag `isFutureDate === true` | Menampilkan pesan 'Tanggal Operasional Belum Tiba' dan otomatis menyembunyikan muatan/perjalanan palsu. |
| **Kotak [C]: Primary Telemetry & Spec Cards** | Surface Card Utama (Tengah Atas) | Menampilkan rincian identitas resi (berat, layanan, tarif, asal, tujuan) atau spesifikasi armada kendaraan. | Koleksi `transaksi` atau `master_kendaraan` | Tombol salin nomor resi/nopol, badge status pengiriman (ENTRY, LOADED, IN_TRANSIT, DELIVERED). |
| **Kotak [D]: Multi-Stop Route Stepper** | Stepper Horizontal Berurutan | Memetakan seluruh titik singgah perhentian (Waypoints) dari rute feeder/intercity. | Koleksi `detail_route` & `route_journeys` | Node berwarna (Hijau: Selesai, Biru: Sedang Aktif, Abu-abu: Belum Tiba) dengan detail jam ETA dan muatan naik/turun. |
| **Kotak [E]: Vehicle Capacity Gauge** | Radial / Linear Progress Meter Card | Menghitung persentase keterisian bagasi kendaraan terhadap daya tampung maksimal 1.500 kg / 3.500 kg. | Kalkulasi `(current_load_kg / max_capacity_kg) * 100` | Badge risiko kapasitas: Normal (Hijau), Near Capacity (Kuning), Full (Oranye), Over Capacity (Merah). |
| **Kotak [F]: Manifest Cargo Group Accordion** | Collapsible Accordion Cards Terpaginasi | Daftar seluruh koli paket yang berada di dalam armada, dikelompokkan per kantor pos tujuan. | Array `cargo` dari `route_journeys` | Accordion buka-tutup per kantor tujuan, paginasi per group (10/20 paket per halaman), badge layanan. |
| **Kotak [G]: Tracking Event History Audit Log** | Timeline Vertikal (Bawah Halaman) | Log audit kronologis setiap pemindaian barcode resi sejak loket pengirim hingga tanda terima penerima. | Koleksi `tracking_events` | Ikon tahapan, timestamp WIB, kantor pos lokasi pemindaian, nomor polisi armada pengangkut, dan nama petugas. |

## 3. Aturan Bisnis & Strict Future Date Rule

- Aturan Tanggal Masa Depan: Jika tanggal > hari ini, sistem mengembalikan isFutureDate: true dan TIDAK membuat muatan fiktif.
- Idempotensi Audit Event: Setiap pemindaian barcode memiliki event_id unik untuk mencegah pencatatan event ganda.
- Normalisasi Nomor Polisi: Backend menormalisasi input plat nomor (menghilangkan spasi) untuk pencocokan akurat.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator memasukkan nomor resi (contoh: P260820010001) atau memilih plat armada (contoh: B 9910 PCX).
- 2. Operator memastikan tanggal operasional yang dipilih sesuai dengan tanggal manifes keberangkatan.
- 3. Sistem memvalidasi tanggal dan memuat lintasan rute, posisi stop aktif, serta daftar muatan barang.
- 4. Operator dapat mengklik 'Live GPS Map' untuk memantau posisi geografis kendaraan pada peta satelit.
