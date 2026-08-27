# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 12 — ANALITIK SLA & PUSAT LAPORAN OPERASIONAL

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Analitik SLA & Laporan Operasional (/analytics) |
| **Kategori Menu** | LOGISTICS / REPORTING & ANALYTICS |
| **Route URL** | /analytics |
| **File Komponen React** | src/pages/AnalyticsReport.jsx |
| **Backend API Endpoints** | GET /api/analytics/sla-performance, GET /api/analytics/throughput, GET /api/analytics/export-csv |
| **Koleksi MongoDB** | transaksi, route_journeys, master_kendaraan, master_kantor |
| **Hak Akses Role** | Operator, Manager Operasional, & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Analitik & Laporan menyajikan analisis mendalam mengenai tingkat kepatuhan Service Level Agreement (SLA On-Time), throughput tonase muatan kargo, breakdown performa ketepatan waktu per produk pos (Q9 Sameday, PE Nextday, PKH Reguler, EC3 Shopee), grafik tren SLA regional dengan skala sumbu Y jujur (0%–100%), serta pusat ekspor laporan resmi dalam format CSV/Spreadsheet dan cetak fisik.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Analitik SLA & Pusat Laporan disusun dalam 5 tingkatan blok data:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] HEADER BANNER: Judul ("Analitik SLA & Pusat Laporan") | [● Live DB] | [🔄 Refresh] | [🖨️ Cetak]     |
+---------------------------------------------------------------------------------------------------------+
| [B1] Tingkat SLA On-Time | [B2] Total Paket Terolah | [B3] Rata-rata Lead Time  | [B4] Throughput Muatan|
|      98.5% On-Time       |      922 Transaksi       |      4.2 Jam              |      43.5 Ton         |
|      (Emerald Card)      |      (Cyan Card)         |      (Amber Card)         |      (Purple Card)    |
+--------------------------+--------------------------+---------------------------+-----------------------+
| [C] LINE OUTGOING PROSEN SLA REGIONAL (Full-Width Dark Spatial Card)                                    |
| - Header: Judul Grafik, Badge Skala Proporsional, Badge Skala Y 0% - 100% (Standar Resmi Laporan)       |
| - Legend: [● REG 1] [● REG 2] [● REG 3] [● REG 4]                                                       |
| - Dynamic SVG Canvas: Y-Ticks (0%, 20%, 40%, 60%, 80%, 100%), Target SLA 90% Garis Merah Putus-Putus    |
| - Multi-Line Curves REG 1 to 4 with Hover Tooltip Box (Region, Tanggal, Persentase SLA)                 |
| - Footer: Date Range Slider Filter (2026-07-21 s/d 2026-08-12)                                          |
+---------------------------------------------------------------------------------------------------------+
| [D1] PERFORMA SLA PER JENIS LAYANAN           | [D2] THROUGHPUT STATUS KIRIMAN (Volume & Berat)         |
| - Q9 (Pos Sameday): 100.0% On-Time            | - DITERIMA_DI_CIMAHI: 350 Paket (12.400 kg)             |
| - PE (Pos Nextday):  98.2% On-Time            | - IN_MANIFEST:        210 Paket (8.950 kg)              |
| - PKH (Pos Reguler): 96.5% On-Time            | - TRANSIT_SPP_BANDUNG:180 Paket (10.120 kg)             |
| - EC3 (Pos Shopee):  94.8% On-Time            | - TIBA_DI_SPP_TUJUAN:  45 Paket (3.200 kg)              |
| (Progress bar indikator & target jam SLA)     | - DELIVERED:          137 Paket (8.848 kg)              |
+-----------------------------------------------+---------------------------------------------------------+
| [E] PUSAT EKSPOR LAPORAN OPERASIONAL (Export Hub Section)                                               |
| - Filter Dropdown: Status Paket | Filter Jenis Layanan | Filter Nopend Tujuan                           |
| - Action Buttons: [Reset Filter]  |  [📥 Unduh Laporan CSV / Spreadsheet]                               |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Header Banner & Print Toolbar** | Top Header Spatial Card | Menampilkan judul modul analitik, badge status live database (`transaksi`), tombol refresh data, dan tombol cetak fisik (Print Document). | Metadata `slaData.dataSource` | Tombol '🔄 Refresh Data' memuat ulang agregasi, tombol '🖨️ Cetak Laporan' memicu dialog print browser window. |
| **Kotak [B1]: Tingkat SLA On-Time Card** | KPI Card Pastel Emerald (Row 1 Kolom 1) | Menampilkan persentase kepatuhan pengiriman tepat waktu terhadap target jam SLA (98.5% On-Time) beserta jumlah paket on-time. | Field `metrics.slaComplianceRate` & `metrics.onTimeCount` | Indikator efisiensi mutu pelayanan pengiriman. |
| **Kotak [B2]: Total Paket Terolah Card** | KPI Card Pastel Cyan (Row 1 Kolom 2) | Menampilkan jumlah total transaksi paket kiriman yang berhasil diproses di jaringan pos. | Field `metrics.totalTransactions` & `metrics.deliveredCount` | Volume throughput operasional harian/bulanan. |
| **Kotak [B3]: Rata-rata Lead Time Card** | KPI Card Pastel Amber (Row 1 Kolom 3) | Menampilkan durasi rata-rata dalam satuan jam dari proses loket Cimahi hingga serah terima di SPP tujuan (4.2 Jam). | Field `metrics.avgHandlingTimeHours` | Metrik kecepatan handling dan dispatching rantai pasok. |
| **Kotak [B4]: Throughput Muatan Card** | KPI Card Pastel Purple (Row 1 Kolom 4) | Menampilkan total tonase muatan kargo barang yang berhasil didistribusikan dalam satuan Ton dan kilogram riil. | Field `throughputData.totalWeightKg` | Konversi otomatis ke format Ton (e.g. 43.5 Ton / 43.518 kg). |
| **Kotak [C]: Line Outgoing SLA Regional** | Full-Width Dark Spatial Card (Row 2) | Grafik garis tren persentase SLA harian per wilayah regional (REG 1 s/d REG 4) dengan skala Y 0%–100% dan garis target SLA 90%. | Array data tren tanggal dan persentase regional | Hover pada titik kurva menampilkan tooltip nilai persentase SLA, slider rentang tanggal di footer. |
| **Kotak [D1]: Performa SLA Per Layanan** | Spatial Card Kiri (Row 3 Kolom 1) | Kartu rincian kepatuhan waktu kirim per jenis produk pos: Q9 Pos Sameday (<=6 Jam), PE Nextday (<=24 Jam), PKH Reguler, EC3 Shopee. | Object `serviceBreakdown` | Progress bar warna (Hijau >=95%, Kuning <95%), rincian target jam SLA, dan jumlah paket terlambat. |
| **Kotak [D2]: Throughput Status Kiriman** | Spatial Card Kanan (Row 3 Kolom 2) | Tabel rekapitulasi volume paket dan akumulasi berat kargo (kg) di setiap tahapan status rantai distribusi pos. | Object `stateThroughput` | Distribusi status: DITERIMA_DI_CIMAHI, IN_MANIFEST, TRANSIT_SPP_BANDUNG, TIBA_DI_SPP_TUJUAN, DELIVERED. |
| **Kotak [E]: Pusat Ekspor Laporan Hub** | Spatial Card Lebar Penuh (Row 4) | Panel penyaring data dan generator unduhan laporan operasional resmi berformat CSV / Spreadsheet. | Endpoint GET /api/analytics/export-csv | Filter dropdown Status Paket, Jenis Layanan, Nopend Tujuan, tombol 'Reset Filter', dan tombol '📥 Unduh Laporan CSV'. |

## 3. Aturan Bisnis & Standar Skala Representasi Data

- Standar Skala Y Jujur: Sumbu Y grafik SLA wajib dimulai dari 0% hingga 100% untuk mencegah distorsi persepsi performa.
- Kalkulasi SLA On-Time: Resi dikategorikan on-time bila selisih waktu antara status DITERIMA dan DELIVERED kurang dari sama dengan batas target jam layanan.
- Export Filtering: Berkas CSV yang diunduh mencakup seluruh kolom transaksi sesuai kriteria filter yang diterapkan operator.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator atau Manager membuka modul Analitik & Laporan (/analytics).
- 2. Manager mengevaluasi persentase SLA On-Time dan mengidentifikasi layanan pos yang mengalami keterlambatan pada kartu [D1].
- 3. Manager meninjau grafik tren harian regional pada kartu [C] untuk melihat stabilitas layanan.
- 4. Operator menerapkan filter status/layanan pada panel [E] dan mengunduh berkas laporan CSV untuk rekapitulasi bulanan.
