# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 1 — DASHBOARD OPERASIONAL LOGISTIK

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Dashboard Operasional Logistik IPOS5 |
| **Kategori Menu** | OPERATIONS / COMMAND CENTER |
| **Route URL** | / (Root Application URL) |
| **File Komponen React** | src/pages/Dashboard.jsx |
| **Backend API Endpoints** | GET /api/dashboard-stats, GET /api/transaksi?limit=20 |
| **Koleksi MongoDB** | transaksi, master_kendaraan, route_journeys, master_kantor, master_route_nopen |
| **Hak Akses Role** | Semua Role (Super Admin, Logistic Operator, Dispatcher, Driver) |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Dashboard Operasional merupakan pusat komando (command center) visual bagi operasional logistik PT Pos Indonesia. Halaman ini menyajikan metrik statistik real-time mengenai volume resi kiriman pos, persentase pengiriman aktif, paket sukses terkirim, retur paket, akumulasi nilai rupiah ongkos kirim, tonase kargo, serta grafik tren pengiriman dan penjualan.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Dashboard Operasional dibagi menjadi 5 tingkatan baris (Row Layout Grid) terstruktur sebagai berikut:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] SUBHEADER: Judul Halaman ("Analytics") | Badge Filter Aktif | [B] Filter Periode Dropdown Pill (Tgl)|
+---------------------------------------------------------------------------------------------------------+
| [C1] KPI Total      | [C2] KPI Active    | [C3] KPI Completed | [C4] KPI Returned  | [C5] KPI Freight   |
|      Shipments (Dark|      Shipments     |      Shipments     |      / Failed      |      Value & Cargo |
|      Blue Card)     |      (Cyan Card)   |      (Green Card)  |      (Pink Card)   |      (Purple Card) |
+------------------------------------------+--------------------+--------------------+--------------------+
| [D1] CHART 1: SHIPMENT (Stacked Bar Chart)                    | [D2] CHART 2: SALES & FREIGHT VOLUME    |
| - Period Filter Pill: [Week | Month | Year]                   | - Period Filter: [Week | Month | Year]  |
| - Y-Axis Grid & Dynamic Guidelines                            | - Y-Axis Guidelines in Millions IDR     |
| - Stacked Pillars: [On Delivery, Delivered, Returned]         | - Smooth Harmonic Spline Line & Area SVG|
| - Hover Tooltip: Volume per Status & Persentase               | - Hover Tooltip: Revenue & Connotes     |
| - Legend Badges: All, On Delivery, Delivered, Returned        | - Filter Layanan: All, Nextday, Reg...  |
+---------------------------------------------------------------+-----------------------------------------+
| [E1] POPULAR CATEGORIES (Donut Chart)  | [E2] AV. CHECK (Nilai per Resi) | [E3] AV. DELIVERY TIME (Lead)|
| - Donut SVG Multi-Segment             | - Service Ranking Bar Chart     | - Regional Hub Transit SLA   |
| - Center Text: "All Products"         | - Avg Revenue per Service       | - Status: Perfect/Fine/TooLong|
| - Legend: % per Layanan Pos           | - Link: See All -> /transaksi   | - Link: See All -> /kantor   |
+---------------------------------------+---------------------------------+-------------------------------+
| [F] LIVE CONNOTES TELEMETRY STREAM (Real-Time Live Table)                                               |
| - Table Header: Icon, Title, Live Sync Badge ("REAL-TIME SYNC")                                         |
| - Quick Search Input Filter (Resi, Lokasi, Layanan, Nopol)                                              |
| - Telemetry Table: Resi Code (Copyable), Origin Nopen, Dest Nopen, Layanan, Weight, Status, Jam Scan     |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Subheader Title & Filter Badge** | Header Bar (Pojok Kiri Atas) | Menampilkan nama modul ('Analytics') dan indikator jumlah data yang tersaring saat filter aktif. | State `isFiltered`, metadata `dbStats.filterMeta` | Tombol 'Reset' merah muncul otomatis saat filter aktif untuk mengembalikan tampilan ke seluruh data. |
| **Kotak [B]: Filter Periode Dropdown Pill** | Pill Button & Dropdown Menu (Pojok Kanan Atas) | Menyediakan pilihan rentang waktu penarikan data dari database MongoDB. | State `datePreset`, presets: today, aug2026, 7d, 30d, jul2026, ytd2026 | Klik membuka menu modal preset waktu dan form tanggal manual (custom date start & end). |
| **Kotak [C1]: Total Shipments KPI Card** | KPI Card Pastel Dark Blue (Row 1 Kolom 1) | Menampilkan jumlah total transaksi paket/connote yang tercatat di database. | Field `dbStats.totals.total_packages` | Dapat diklik untuk beralih cepat ke halaman Database Viewer (/transaksi). |
| **Kotak [C2]: Active Shipments KPI Card** | KPI Card Pastel Soft Cyan (Row 1 Kolom 2) | Menampilkan volume paket yang sedang dalam pergerakan armada beserta persentase dari total paket. | Field `totals.active_shipments`, kalkulasi `(active/total)*100` | Menampilkan status paket aktif berstatus ENTRY, LOADED, IN_TRANSIT, INVEHICLE. |
| **Kotak [C3]: Completed Shipments KPI Card** | KPI Card Pastel Soft Green (Row 1 Kolom 3) | Menampilkan jumlah paket yang telah sukses terkirim ke penerima beserta persentase keberhasilan. | Field `totals.completed_shipments`, kalkulasi `(completed/total)*100` | Menampilkan status paket DELIVERED dan SELESAI. |
| **Kotak [C4]: Returned / Failed KPI Card** | KPI Card Pastel Soft Pink (Row 1 Kolom 4) | Menampilkan jumlah paket gagal kirim, rusak, atau diretur beserta persentase risiko. | Field `totals.returned_shipments`, kalkulasi `(returned/total)*100` | Menampilkan status paket RETURN, GAGAL, atau CANCELLED. |
| **Kotak [C5]: Freight Value & Cargo KPI Card** | KPI Card Pastel Soft Purple (Row 1 Kolom 5) | Menampilkan total nilai rupiah pendapatan kiriman pos dan total throughput tonase muatan (Ton/kg). | Field `totals.total_revenue_formatted` & `totals.total_weight_kg` | Nilai dihitung otomatis dalam format Rupiah (Rp) dan Ton/Kg terdistribusi. |
| **Kotak [D1]: Shipment Stacked Bar Chart** | Spatial Card Kiri (Row 2 Kolom 1) | Grafik batang tumpuk yang memvisualisasikan volume paket bulanan terbagi atas On Delivery, Delivered, dan Returned. | Array `dbStats.monthlyShipments` dari agregasi MongoDB `transaksi` | Pill filter waktu (Week, Month, Year), hover mouse menampilkan tooltip rincian jumlah dan % per kategori status. |
| **Kotak [D2]: Sales & Freight Volume Chart** | Spatial Card Kanan (Row 2 Kolom 2) | Grafik garis spline lengkung dan arsiran gradien pendapatan rupiah serta volume kiriman per periode. | Array `dbStats.salesTrend` dari MongoDB | Pill filter waktu (Week/Month/Year), filter kategori layanan pos (Pos Nextday, Reguler, Sameday, Shopee, Jumbo). |
| **Kotak [E1]: Popular Categories Donut Card** | Spatial Card Kiri (Row 3 Kolom 1) | Diagram donat SVG proporsi pangsa pasar produk layanan pos dengan label tengah 'All Products'. | Array `dbStats.popularCategories` | Legenda warna produk interaktif, tautan 'See All' langsung menuju Master Produk (/produk). |
| **Kotak [E2]: Av. Check (Nilai per Resi)** | Spatial Card Tengah (Row 3 Kolom 2) | Peringkat rata-rata nilai rupiah pendapatan per transaksi resi untuk setiap jenis layanan pos. | Array `dbStats.avCheck` | Bar horizontal komparasi tarif, tautan 'See All' menuju Database Viewer (/transaksi). |
| **Kotak [E3]: Av. Delivery Time SLA Card** | Spatial Card Kanan (Row 3 Kolom 3) | Analisis lead time waktu tempuh pengiriman rata-rata antar regional pos beserta status performa SLA. | Array `dbStats.avDeliveryTime` | Badge status SLA: Perfect (Hijau), Fine (Biru), For too long (Merah muda), tautan ke Master Kantor (/kantor). |
| **Kotak [F]: Live Connotes Telemetry Stream** | Spatial Card Lebar Penuh (Row 4) | Tabel live monitoring 20 data paket transaksi terakhir yang disinkronkan secara real-time dari database. | Array `topConnotes` dari endpoint GET /api/transaksi?limit=20 | Input filter pencarian cepat (resi, lokasi, nopol), tombol salin kode resi, badge status warna, polling auto 5s. |

## 3. Aturan Bisnis & Logika Penanganan Data

- Polling Data Otomatis: Halaman melakukan sinkronisasi latar belakang setiap 5 detik untuk memperbarui metrik secara real-time.
- Perhitungan Proporsional: Persentase pada setiap kartu dihitung terhadap total paket periode terpilih.
- Formatting Dinamis: Berat kargo >= 1.000 kg otomatis dikonversi ke satuan Ton dengan 1 desimal presisi.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator masuk ke aplikasi IPOS5 dan langsung melihat kondisi operasional logistik di Dashboard.
- 2. Operator memilih periode waktu di dropdown [B] untuk melihat kondisi harian atau historis.
- 3. Operator mengevaluasi performa SLA regional dan ketersediaan armada.
- 4. Operator dapat mengklik kode resi di tabel live stream [F] untuk melacak rute di Checker.
