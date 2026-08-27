# -*- coding: utf-8 -*-
"""
Batch 1 Documentation Generator (Pages 00, 01, 02, 03, 04)
"""

import os
from generate_all_documentation import create_docx_for_page, write_markdown_file, DOCS_DIR

pages = []

# ==============================================================================
# PAGE 00: INDEX DOKUMENTASI SELURUH HALAMAN
# ==============================================================================
page_00 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "MASTER INDEX DOKUMENTASI SELURUH HALAMAN IPOS5",
    "metadata": [
        ("Aplikasi Induk", "IPOS5 Routing & Schedule Management System"),
        ("Organisasi", "PT Pos Indonesia (Persero)"),
        ("Total Modul / Halaman", "15 Modul Utama (16 File Dokumentasi Terstruktur)"),
        ("Arsitektur Sistem", "React 18 Vite + Express.js OOP MVC + MongoDB Multi-Server"),
        ("Versi Sistem", "Redesign Enterprise v2.5.0"),
        ("Karakteristik Dokumentasi", "Dilengkapi Wireframe ASCII Tata Letak UI & Rincian Kotak/Komponen"),
    ],
    "sections": [
        {
            "heading": "1. Pendahuluan & Gambaran Umum Sistem",
            "content": (
                "Dokumentasi ini menyajikan spesifikasi teknis, operasional, dan arsitektur visual tata letak antarmuka "
                "untuk seluruh 15 modul halaman pada sistem IPOS5 (Integrated Post Office System v5) PT Pos Indonesia. "
                "Setiap modul didokumentasikan dalam format Markdown (.md) dan Microsoft Word (.docx) secara mandiri, "
                "disertai diagram wireframe tata letak layar (layout grid) serta rincian fungsi setiap komponen/kotak visual."
            )
        },
        {
            "heading": "2. Struktur Peta Navigasi & Hirarki Modul Halaman",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "|                                  IPOS5 ENTERPRISE SYSTEM ARCHITECTURE                                   |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [OPERATIONS]           | [MASTER DATA]          | [LOGISTICS & PLANNING] | [ANALYTICS & SYSTEM]         |\n"
                "| • 01. Dashboard (/)    | • 03. Kantor (/kantor) | • 07. Template (/tmpl) | • 12. Analitik (/analytics)  |\n"
                "| • 02. Checker (/check) | • 04. Produk (/produk) | • 08. Jadwal (/jadwal) | • 13. Transaksi (/transaksi) |\n"
                "|                        | • 05. Fleet (/kendaraan| • 09. Milk Run (/jrn)  | • 14. Settings (/settings)   |\n"
                "|                        | • 06. Route (/route)   | • 10. Estimasi (/est)  | • 15. Profile (/profile)     |\n"
                "|                        |                        | • 11. Gate (/transit)  |                              |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Modul 01 — Dashboard Operasional", "Halaman Utama (`/`)", "Pusat komando metrik volume paket, tonase muatan, status pengiriman, grafik tren, dan live stream connotes.", "transaksi, master_kendaraan, route_journeys", "Filter periode data (Hari Ini, 7D, 30D, YTD, Custom Range), hover tooltip, live polling 5s."),
                ("Modul 02 — Package Tracking & Checker", "Operasional (`/checker`)", "Pelacakan resi connote (14-15 digit) atau armada mobil dengan multi-stop waypoint stepper, gauge muatan, dan log audit.", "transaksi, master_kendaraan, route_journeys, detail_route, tracking_events", "Tab mode switch, date picker WIB, strict future date banner, live GPS tracking modal, CSV import."),
                ("Modul 03 — Post Offices (Master Kantor)", "Master Data (`/kantor`)", "Direktori seluruh jaringan kantor pos nasional (KCU, KCP, KC, Agenpos, SPP DC) beserta koordinat lat/long.", "master_kantor", "Filter kategori hierarki, search bar nopend/nama/kota, modal detail profil, modal add/edit, export CSV."),
                ("Modul 04 — Products & Services (Produk)", "Master Data (`/produk`)", "Katalog layanan pengiriman kurir pos (Pos Ekspres, Reguler, Kilat Khusus, EMS, Logistik, Sameday) dan komitmen SLA.", "master_produk", "Toggle switch active/inactive, grid card produk, tombol tambah layanan produk baru."),
                ("Modul 05 — Fleet Management (Armada)", "Master Data (`/kendaraan`)", "Manajemen armada mobil/truk pos, kapasitas maksimum kg/ton, nama driver, nomor kontak, homebase, dan rute penugasan.", "master_kendaraan, route_journeys", "Form collapsible drawer tambah armada, visual fleet cards, tombol pemicu VehicleDetailModal telemetri."),
                ("Modul 06 — Routes Management (Rute)", "Master Data (`/route`)", "Pengelolaan master rute trayek logistik, waypoint singgah (detail_route), jarak tempuh KM, estimasi menit, dan prefix tujuan.", "master_route_nopen, detail_route", "Accordion expandable per rute, form builder rute baru, matriks jangkauan regional prefix 1-9."),
                ("Modul 07 — Schedule Templates (Template)", "Logistics (`/template`)", "Pola cetak biru jadwal mingguan (hari aktif Sen-Min, jam berangkat acuan, armada acuan, rute acuan).", "template_jadwal_transportasi, master_kendaraan", "Toggle active template, filter shift operasional, tombol pemicu generate jadwal harian."),
                ("Modul 08 — Transport Schedule (Jadwal)", "Logistics (`/jadwal`)", "Eksekusi jadwal transportasi riil per tanggal operasional dengan kalender mingguan visual jam 06:00-18:00 WIB.", "jadwal_transportasi, master_kendaraan", "Navigasi minggu (< Week >), generator jadwal massal dengan progress bar %, visual timetable grid."),
                ("Modul 09 — Milk Run Telemetry", "Logistics (`/route-journey`)", "Simulasi & eksekusi perjalanan multi-stop armada feeder dengan kalkulasi muatan bertahap, status stop, dan ACID lock.", "route_journeys, detail_route, transaksi", "Tombol kontrol eksekusi stop berikutnya, reset rute, live capacity meter, manifest stop inspection."),
                ("Modul 10 — Estimasi Milk Run", "Logistics (`/estimasi`)", "Kalkulator dan perencana estimasi waktu tempuh (ETA), akumulasi KM, dan simulasi muatan truk animasi interaktif.", "detail_route, master_route_nopen, master_kantor", "Play/pause auto simulation, truk animasi roda berputar, popup rincian bukti tanda tangan pengambilan."),
                ("Modul 11 — Gate Monitoring Transit", "Logistics (`/transit-monitoring`)", "Pemantauan 3-stage transit pipeline: 1. Manifest Creation -> 2. In-Flight Transit -> 3. Gate SPP Unloading.", "transaksi, route_journeys, tracking_events", "Batch select checkbox resi, tombol dispatch armada, tombol finalisasi bongkar, polling auto-refresh 3.5s."),
                ("Modul 12 — Analitik SLA & Laporan", "Reporting (`/analytics`)", "Analisis performa SLA pengiriman regional (skala Y 0%-100%), throughput tonase muatan, breakdown produk, dan ekspor CSV.", "transaksi, route_journeys, master_kendaraan", "Interactive line chart dengan tooltip hover, date range slider, filter multi-dropdown, tombol cetak & CSV."),
                ("Modul 13 — Database Viewer Transaksi", "System Data (`/transaksi`)", "Penjelajah data mentah resi kiriman di MongoDB dengan multi-filter lengkap, server-side pagination, dan modal audit.", "transaksi, master_kantor", "Debounced search, filter status, layanan, nopend tujuan, KPRK, regional, tanggal, modal raw JSON & fleet."),
                ("Modul 14 — System Settings & Compass", "System Config (`/settings`)", "Manajemen koneksi database MongoDB multi-server (Primary Remote 192.168.5.219 vs Local 127.0.0.1), ping test, dan security.", "connections.json, DbConnection.js", "Input URI dengan toggle masking mata, tombol test connection, preset cluster switcher, TLS config."),
                ("Modul 15 — User Profile & Account", "Account (`/profile`)", "Manajemen profil personel, NIP pegawai pos, unit kantor penugasan, ubah password akun, dan log audit sesi login.", "users", "Form edit profil, form ubah kata sandi, status 2FA, tabel riwayat sesi aktivitas IP/browser.")
            ]
        },
        {
            "heading": "3. Standar Arsitektur Integrasi Backend & Database",
            "content": (
                "Seluruh modul halaman terhubung dengan Backend Node.js Express.js berarsitektur OOP MVC. "
                "Operasi pembacaan dan pembaruan data dialirkan secara aman melalui API endpoints dengan proteksi validasi, "
                "pembatasan hak akses role (RBAC), serta transaksi atomik MongoDB (ACID transaction) pada proses bongkar muat kargo."
            )
        }
    ]
}
pages.append(("00_INDEX_DOKUMENTASI_ALL_PAGES", page_00))

# ==============================================================================
# PAGE 01: DASHBOARD OPERASIONAL
# ==============================================================================
page_01 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 1 — DASHBOARD OPERASIONAL LOGISTIK",
    "metadata": [
        ("Nama Modul", "Dashboard Operasional Logistik IPOS5"),
        ("Kategori Menu", "OPERATIONS / COMMAND CENTER"),
        ("Route URL", "/ (Root Application URL)"),
        ("File Komponen React", "src/pages/Dashboard.jsx"),
        ("Backend API Endpoints", "GET /api/dashboard-stats, GET /api/transaksi?limit=20"),
        ("Koleksi MongoDB", "transaksi, master_kendaraan, route_journeys, master_kantor, master_route_nopen"),
        ("Hak Akses Role", "Semua Role (Super Admin, Logistic Operator, Dispatcher, Driver)"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Halaman Dashboard Operasional merupakan pusat komando (command center) visual bagi operasional logistik PT Pos Indonesia. "
                "Halaman ini menyajikan metrik statistik real-time mengenai volume resi kiriman pos, persentase pengiriman aktif, "
                "paket sukses terkirim, retur paket, akumulasi nilai rupiah ongkos kirim, tonase kargo, serta grafik tren pengiriman dan penjualan."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Dashboard Operasional dibagi menjadi 5 tingkatan baris (Row Layout Grid) terstruktur sebagai berikut:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] SUBHEADER: Judul Halaman (\"Analytics\") | Badge Filter Aktif | [B] Filter Periode Dropdown Pill (Tgl)|\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [C1] KPI Total      | [C2] KPI Active    | [C3] KPI Completed | [C4] KPI Returned  | [C5] KPI Freight   |\n"
                "|      Shipments (Dark|      Shipments     |      Shipments     |      / Failed      |      Value & Cargo |\n"
                "|      Blue Card)     |      (Cyan Card)   |      (Green Card)  |      (Pink Card)   |      (Purple Card) |\n"
                "+------------------------------------------+--------------------+--------------------+--------------------+\n"
                "| [D1] CHART 1: SHIPMENT (Stacked Bar Chart)                    | [D2] CHART 2: SALES & FREIGHT VOLUME    |\n"
                "| - Period Filter Pill: [Week | Month | Year]                   | - Period Filter: [Week | Month | Year]  |\n"
                "| - Y-Axis Grid & Dynamic Guidelines                            | - Y-Axis Guidelines in Millions IDR     |\n"
                "| - Stacked Pillars: [On Delivery, Delivered, Returned]         | - Smooth Harmonic Spline Line & Area SVG|\n"
                "| - Hover Tooltip: Volume per Status & Persentase               | - Hover Tooltip: Revenue & Connotes     |\n"
                "| - Legend Badges: All, On Delivery, Delivered, Returned        | - Filter Layanan: All, Nextday, Reg...  |\n"
                "+---------------------------------------------------------------+-----------------------------------------+\n"
                "| [E1] POPULAR CATEGORIES (Donut Chart)  | [E2] AV. CHECK (Nilai per Resi) | [E3] AV. DELIVERY TIME (Lead)|\n"
                "| - Donut SVG Multi-Segment             | - Service Ranking Bar Chart     | - Regional Hub Transit SLA   |\n"
                "| - Center Text: \"All Products\"         | - Avg Revenue per Service       | - Status: Perfect/Fine/TooLong|\n"
                "| - Legend: % per Layanan Pos           | - Link: See All -> /transaksi   | - Link: See All -> /kantor   |\n"
                "+---------------------------------------+---------------------------------+-------------------------------+\n"
                "| [F] LIVE CONNOTES TELEMETRY STREAM (Real-Time Live Table)                                               |\n"
                "| - Table Header: Icon, Title, Live Sync Badge (\"REAL-TIME SYNC\")                                         |\n"
                "| - Quick Search Input Filter (Resi, Lokasi, Layanan, Nopol)                                              |\n"
                "| - Telemetry Table: Resi Code (Copyable), Origin Nopen, Dest Nopen, Layanan, Weight, Status, Jam Scan     |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Subheader Title & Filter Badge", "Header Bar (Pojok Kiri Atas)", "Menampilkan nama modul ('Analytics') dan indikator jumlah data yang tersaring saat filter aktif.", "State `isFiltered`, metadata `dbStats.filterMeta`", "Tombol 'Reset' merah muncul otomatis saat filter aktif untuk mengembalikan tampilan ke seluruh data."),
                ("Kotak [B]: Filter Periode Dropdown Pill", "Pill Button & Dropdown Menu (Pojok Kanan Atas)", "Menyediakan pilihan rentang waktu penarikan data dari database MongoDB.", "State `datePreset`, presets: today, aug2026, 7d, 30d, jul2026, ytd2026", "Klik membuka menu modal preset waktu dan form tanggal manual (custom date start & end)."),
                ("Kotak [C1]: Total Shipments KPI Card", "KPI Card Pastel Dark Blue (Row 1 Kolom 1)", "Menampilkan jumlah total transaksi paket/connote yang tercatat di database.", "Field `dbStats.totals.total_packages`", "Dapat diklik untuk beralih cepat ke halaman Database Viewer (/transaksi)."),
                ("Kotak [C2]: Active Shipments KPI Card", "KPI Card Pastel Soft Cyan (Row 1 Kolom 2)", "Menampilkan volume paket yang sedang dalam pergerakan armada beserta persentase dari total paket.", "Field `totals.active_shipments`, kalkulasi `(active/total)*100`", "Menampilkan status paket aktif berstatus ENTRY, LOADED, IN_TRANSIT, INVEHICLE."),
                ("Kotak [C3]: Completed Shipments KPI Card", "KPI Card Pastel Soft Green (Row 1 Kolom 3)", "Menampilkan jumlah paket yang telah sukses terkirim ke penerima beserta persentase keberhasilan.", "Field `totals.completed_shipments`, kalkulasi `(completed/total)*100`", "Menampilkan status paket DELIVERED dan SELESAI."),
                ("Kotak [C4]: Returned / Failed KPI Card", "KPI Card Pastel Soft Pink (Row 1 Kolom 4)", "Menampilkan jumlah paket gagal kirim, rusak, atau diretur beserta persentase risiko.", "Field `totals.returned_shipments`, kalkulasi `(returned/total)*100`", "Menampilkan status paket RETURN, GAGAL, atau CANCELLED."),
                ("Kotak [C5]: Freight Value & Cargo KPI Card", "KPI Card Pastel Soft Purple (Row 1 Kolom 5)", "Menampilkan total nilai rupiah pendapatan kiriman pos dan total throughput tonase muatan (Ton/kg).", "Field `totals.total_revenue_formatted` & `totals.total_weight_kg`", "Nilai dihitung otomatis dalam format Rupiah (Rp) dan Ton/Kg terdistribusi."),
                ("Kotak [D1]: Shipment Stacked Bar Chart", "Spatial Card Kiri (Row 2 Kolom 1)", "Grafik batang tumpuk yang memvisualisasikan volume paket bulanan terbagi atas On Delivery, Delivered, dan Returned.", "Array `dbStats.monthlyShipments` dari agregasi MongoDB `transaksi`", "Pill filter waktu (Week, Month, Year), hover mouse menampilkan tooltip rincian jumlah dan % per kategori status."),
                ("Kotak [D2]: Sales & Freight Volume Chart", "Spatial Card Kanan (Row 2 Kolom 2)", "Grafik garis spline lengkung dan arsiran gradien pendapatan rupiah serta volume kiriman per periode.", "Array `dbStats.salesTrend` dari MongoDB", "Pill filter waktu (Week/Month/Year), filter kategori layanan pos (Pos Nextday, Reguler, Sameday, Shopee, Jumbo)."),
                ("Kotak [E1]: Popular Categories Donut Card", "Spatial Card Kiri (Row 3 Kolom 1)", "Diagram donat SVG proporsi pangsa pasar produk layanan pos dengan label tengah 'All Products'.", "Array `dbStats.popularCategories`", "Legenda warna produk interaktif, tautan 'See All' langsung menuju Master Produk (/produk)."),
                ("Kotak [E2]: Av. Check (Nilai per Resi)", "Spatial Card Tengah (Row 3 Kolom 2)", "Peringkat rata-rata nilai rupiah pendapatan per transaksi resi untuk setiap jenis layanan pos.", "Array `dbStats.avCheck`", "Bar horizontal komparasi tarif, tautan 'See All' menuju Database Viewer (/transaksi)."),
                ("Kotak [E3]: Av. Delivery Time SLA Card", "Spatial Card Kanan (Row 3 Kolom 3)", "Analisis lead time waktu tempuh pengiriman rata-rata antar regional pos beserta status performa SLA.", "Array `dbStats.avDeliveryTime`", "Badge status SLA: Perfect (Hijau), Fine (Biru), For too long (Merah muda), tautan ke Master Kantor (/kantor)."),
                ("Kotak [F]: Live Connotes Telemetry Stream", "Spatial Card Lebar Penuh (Row 4)", "Tabel live monitoring 20 data paket transaksi terakhir yang disinkronkan secara real-time dari database.", "Array `topConnotes` dari endpoint GET /api/transaksi?limit=20", "Input filter pencarian cepat (resi, lokasi, nopol), tombol salin kode resi, badge status warna, polling auto 5s.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Logika Penanganan Data",
            "items": [
                "Polling Data Otomatis: Halaman melakukan sinkronisasi latar belakang setiap 5 detik untuk memperbarui metrik secara real-time.",
                "Perhitungan Proporsional: Persentase pada setiap kartu dihitung terhadap total paket periode terpilih.",
                "Formatting Dinamis: Berat kargo >= 1.000 kg otomatis dikonversi ke satuan Ton dengan 1 desimal presisi."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator masuk ke aplikasi IPOS5 dan langsung melihat kondisi operasional logistik di Dashboard.",
                "2. Operator memilih periode waktu di dropdown [B] untuk melihat kondisi harian atau historis.",
                "3. Operator mengevaluasi performa SLA regional dan ketersediaan armada.",
                "4. Operator dapat mengklik kode resi di tabel live stream [F] untuk melacak rute di Checker."
            ]
        }
    ]
}
pages.append(("01_Dashboard_Operasional", page_01))

# ==============================================================================
# PAGE 02: PACKAGE TRACKING & CHECKER
# ==============================================================================
page_02 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 2 — PACKAGE TRACKING & CHECKER LOGISTIK",
    "metadata": [
        ("Nama Modul", "Package Tracking & Checker (/checker)"),
        ("Kategori Menu", "OPERATIONS / AUDIT TRAIL"),
        ("Route URL", "/checker"),
        ("File Komponen React", "src/pages/Checker.jsx"),
        ("Backend API Endpoints", "GET /api/checker/:connoteOrNopol?date=YYYY-MM-DD, GET /api/kendaraan"),
        ("Koleksi MongoDB", "transaksi, master_kendaraan, route_journeys, detail_route, master_kantor, tracking_events"),
        ("Hak Akses Role", "Semua Role (Super Admin, Operator, Dispatcher, Customer Service)"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Halaman Package Tracking & Checker merupakan modul utama pelacakan dan audit lintasan pengiriman paket serta armada kendaraan. "
                "Modul ini memungkinkan operator memeriksa status nomor resi (14/15 digit) atau plat nomor kendaraan berdasarkan konteks Tanggal Operasional, "
                "menampilkan waypoint rute multi-stop, visualisasi beban muatan, manifest kargo per kantor tujuan, dan timeline jejak audit."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Package Tracking & Checker dirancang modular dengan urutan vertikal sebagai berikut:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] SEARCH & CONTEXT CONTROLLER BAR                                                                     |\n"
                "| - Tab Mode: [🔍 Cari Resi / Connote]  |  [🚛 Cari Armada / Nopol]                                      |\n"
                "| - Search Input: Nomor Resi 14-15 digit / Dropdown Nopol Mobil                                           |\n"
                "| - Date Picker: Tanggal Operasional (YYYY-MM-DD) + Label WIB                                            |\n"
                "| - Action Buttons: [📥 Import CSV]  |  [🛰️ Live GPS Map Modal]                                           |\n"
                "| - Quick Sample Chips: Resi Hari Ini, Resi Historis 12 Agu, Armada B 9910 PCX                            |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] STRICT FUTURE DATE WARNING BANNER (Kondisional: Muncul bila tgl dipilih > hari ini)                 |\n"
                "| - Banner Merah Prominen: \"Tanggal Operasional Belum Tiba\" (Menyembunyikan muatan palsu)                 |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [C] PRIMARY TELEMETRY & SPECIFICATION CARDS                                                             |\n"
                "| - Resi Mode: Kode Resi, Layanan, Berat Asli, Status Badge, Kantor Asal, Kantor Tujuan, Pengirim/Penerima|\n"
                "| - Fleet Mode: Plat Nopol, Tipe Armada, Driver, Homebase, Kapasitas Maks (1500 kg), Rute Utama          |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D] MULTI-STOP ROUTE JOURNEY STEPPER (Sequential Waypoints)                                             |\n"
                "| [Stop 1: KCU Asal] ======> [Stop 2: KCP Transit] ======> [Stop 3: KCP Transit] ======> [Stop 4: SPP DC] |\n"
                "| (Seq, Nopend, Nama Kantor, Jam ETA/ETD, Load In, Load Out, Status Active/Passed)                       |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [E] VEHICLE CAPACITY GAUGE & LOAD SUMMARY                                                               |\n"
                "| - Circular/Linear Gauge: % Beban Muatan Terpakai vs Kapasitas Maksimum (kg)                             |\n"
                "| - Status Badge: Normal (<70%), Near Capacity (70-90%), Full (90-100%), Over Capacity (>100%)          |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [F] MANIFEST & CARGO ITEM BREAKDOWN ACCORDION                                                           |\n"
                "| - Pengelompokan Kargo Berdasarkan Kantor Pos Tujuan (Paginated Group Card)                             |\n"
                "| - Daftar Paket di Dalam Mobil: Resi, Layanan, Berat (kg), Nama Penerima, Status Scan                   |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [G] TRACKING EVENT HISTORY AUDIT LOG (Timeline Vertikal)                                                |\n"
                "| [📦 ENTRY_LOKET] ---> [🚚 LOADED_ARMADA] ---> [🏢 ARRIVED_HUB] ---> [✅ DELIVERED]                     |\n"
                "| (Timestamp WIB, Lokasi Kantor Pos, Operator/Driver, Keterangan Peristiwa)                               |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Search & Context Controller Bar", "Card Header Kontrol Utama (Paling Atas)", "Bilah pengendali mode pencarian (Resi vs Armada), input nomor, pemilih tanggal operasional, dan chip sampel.", "Input user & `SAMPLE_RESIS`", "Tab switch mode pencarian, input teks dengan debounce/enter, date picker, tombol 'Import CSV' dan 'Live GPS'."),
                ("Kotak [B]: Strict Future Date Warning Banner", "Alert Card Merah (Kondisional di bawah Header)", "Peringatan resmi bila operator memilih tanggal di masa depan yang belum terlaksana.", "Backend flag `isFutureDate === true`", "Menampilkan pesan 'Tanggal Operasional Belum Tiba' dan otomatis menyembunyikan muatan/perjalanan palsu."),
                ("Kotak [C]: Primary Telemetry & Spec Cards", "Surface Card Utama (Tengah Atas)", "Menampilkan rincian identitas resi (berat, layanan, tarif, asal, tujuan) atau spesifikasi armada kendaraan.", "Koleksi `transaksi` atau `master_kendaraan`", "Tombol salin nomor resi/nopol, badge status pengiriman (ENTRY, LOADED, IN_TRANSIT, DELIVERED)."),
                ("Kotak [D]: Multi-Stop Route Stepper", "Stepper Horizontal Berurutan", "Memetakan seluruh titik singgah perhentian (Waypoints) dari rute feeder/intercity.", "Koleksi `detail_route` & `route_journeys`", "Node berwarna (Hijau: Selesai, Biru: Sedang Aktif, Abu-abu: Belum Tiba) dengan detail jam ETA dan muatan naik/turun."),
                ("Kotak [E]: Vehicle Capacity Gauge", "Radial / Linear Progress Meter Card", "Menghitung persentase keterisian bagasi kendaraan terhadap daya tampung maksimal 1.500 kg / 3.500 kg.", "Kalkulasi `(current_load_kg / max_capacity_kg) * 100`", "Badge risiko kapasitas: Normal (Hijau), Near Capacity (Kuning), Full (Oranye), Over Capacity (Merah)."),
                ("Kotak [F]: Manifest Cargo Group Accordion", "Collapsible Accordion Cards Terpaginasi", "Daftar seluruh koli paket yang berada di dalam armada, dikelompokkan per kantor pos tujuan.", "Array `cargo` dari `route_journeys`", "Accordion buka-tutup per kantor tujuan, paginasi per group (10/20 paket per halaman), badge layanan."),
                ("Kotak [G]: Tracking Event History Audit Log", "Timeline Vertikal (Bawah Halaman)", "Log audit kronologis setiap pemindaian barcode resi sejak loket pengirim hingga tanda terima penerima.", "Koleksi `tracking_events`", "Ikon tahapan, timestamp WIB, kantor pos lokasi pemindaian, nomor polisi armada pengangkut, dan nama petugas.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Strict Future Date Rule",
            "items": [
                "Aturan Tanggal Masa Depan: Jika tanggal > hari ini, sistem mengembalikan isFutureDate: true dan TIDAK membuat muatan fiktif.",
                "Idempotensi Audit Event: Setiap pemindaian barcode memiliki event_id unik untuk mencegah pencatatan event ganda.",
                "Normalisasi Nomor Polisi: Backend menormalisasi input plat nomor (menghilangkan spasi) untuk pencocokan akurat."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator memasukkan nomor resi (contoh: P260820010001) atau memilih plat armada (contoh: B 9910 PCX).",
                "2. Operator memastikan tanggal operasional yang dipilih sesuai dengan tanggal manifes keberangkatan.",
                "3. Sistem memvalidasi tanggal dan memuat lintasan rute, posisi stop aktif, serta daftar muatan barang.",
                "4. Operator dapat mengklik 'Live GPS Map' untuk memantau posisi geografis kendaraan pada peta satelit."
            ]
        }
    ]
}
pages.append(("02_Package_Tracking_Checker", page_02))

# ==============================================================================
# PAGE 03: POST OFFICES (MASTER KANTOR POS)
# ==============================================================================
page_03 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 3 — POST OFFICES (MASTER DATA KANTOR POS)",
    "metadata": [
        ("Nama Modul", "Master Kantor Pos (/kantor)"),
        ("Kategori Menu", "OPERATIONS / MASTER DATA"),
        ("Route URL", "/kantor"),
        ("File Komponen React", "src/pages/MasterKantor.jsx"),
        ("Backend API Endpoints", "GET /api/kantor, POST /api/kantor, PUT /api/kantor/:id, DELETE /api/kantor/:id"),
        ("Koleksi MongoDB", "master_kantor"),
        ("Hak Akses Role", "Semua Role (CRUD Dibatasi untuk Super Admin & Branch Manager)"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Halaman Master Kantor Pos berfungsi untuk mengelola seluruh direktori titik node jaringan kantor pos di Indonesia. "
                "Mencakup Sentral Pengolahan Pos (SPP), Kantor Cabang Utama (KCU), Kantor Cabang (KC), Kantor Cabang Pembantu (KCP), "
                "hingga Agen Pos, lengkap dengan atribut Nopend 5-digit, hierarki pembina KCU, alamat, dan titik koordinat GPS."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Master Kantor Pos disusun secara modular dengan grid data interaktif:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] HEADER BAR: Judul (\"Master Kantor Pos\") | Total Node Jaringan | [+ Tambah Kantor] | [📥 Export CSV] |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B1] Total Jaringan | [B2] Bandung & Cimahi | [B3] KCU Utama    | [B4] KCP Cabang   | [B5] Agenpos & SPP|\n"
                "|      13.768 Kantor  |      19 Titik Kunci   |      1.834 Kantor |      11.001 Kantor|      914 / 19 SPP |\n"
                "+---------------------+-----------------------+-------------------+-------------------+-------------------+\n"
                "| [C] FILTER TABS & SEARCH CONTROLLER                                                                     |\n"
                "| - Tabs: [Bandung & Cimahi (Kunci)] | [Semua Kantor] | [KCU] | [KC] | [KCP] | [Agen Pos] | [SPP / DC]    |\n"
                "| - Search Bar: Input pencarian Nopend 5 digit, Nama Kantor, Kecamatan, Kota, atau Provinsi              |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D] MASTER DATA TABLE KANTOR POS                                                                        |\n"
                "| - Kolom: Nopend (Copyable), Nama Kantor, Tipe Node Badge, Alamat, Wilayah/Kota, Telp, GPS Lat/Long, Aksi|\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [E] PAGINATION FOOTER: \"Menampilkan 1-10 dari X kantor\" | [◀ Prev] [1] [2] [3] [Next ▶]                 |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [F] MODALS (Kondisional): [Modal Detail Kantor] | [Modal Tambah/Edit Kantor] | [Modal GPS OpenStreetMap]|\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Header Bar & Actions", "Top Bar Header", "Menampilkan judul modul, badge total node kantor, tombol pemicu form tambah kantor baru, dan tombol ekspor data CSV.", "Metadata `summaryStats.total`", "Tombol '+ Tambah Kantor Pos' membuka modal form penambahan kantor baru, tombol 'Export CSV' mengunduh berkas spreadsheet."),
                ("Kotak [B1 - B5]: 5 KPI Summary Cards", "Grid 5 Kartu Rangkuman (Row 1)", "Menampilkan jumlah total titik kantor pos, hub prioritas Bandung-Cimahi (19), KCU (1.834), KCP (11.001), dan Agen/SPP.", "Object `summaryStats` dari backend", "Kartu memberikan ikhtisar struktur sebaran jaringan fisik PT Pos Indonesia secara instan."),
                ("Kotak [C]: Filter Tabs & Search Bar", "Filter Bar & Input Box (Row 2)", "Menyediakan tab pemfilteran berdasarkan jenis kantor serta bilah pencarian teks bebas (Nopend, nama kantor, kota).", "State `activeTab` & `search`", "Mengubah tab mereset halaman ke 1 dan menyaring data server-side secara real-time."),
                ("Kotak [D]: Master Data Table Kantor", "Tabel Data Responsif (Row 3)", "Tabel utama penampil data kantor pos: Nopend (dengan tombol salin), Nama Kantor, Badge Tipe, Alamat, Kota, Koordinat.", "Array `offices` dari GET /api/kantor", "Tombol salin Nopend, tombol aksi 'Lihat Profil Detail', dan tombol aksi 'Lihat Peta GPS'."),
                ("Kotak [E]: Pagination Footer", "Footer Bar Navigasi Halaman", "Menampilkan rentang data aktif yang sedang dilihat serta kontrol navigasi tombol Prev, Next, dan Nomor Halaman.", "State `page`, `totalPages`, `totalCount`", "Pindah halaman secara server-side pagination dengan limit 10 kantor per halaman."),
                ("Kotak [F]: Modals Profil, CRUD, & Maps", "Modal Pop-up Jendela Mengambang", "Menampilkan rincian lengkap profil kantor, form isian data kantor baru/edit, serta visualisasi titik lokasi GPS.", "State `selectedOffice`, `selectedMapOffice`", "Form validasi input Nopend 5 digit unik, koordinat latitude longitude, dan penugasan KCU pembina.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Integrasi Nopend",
            "items": [
                "Keunikan Nopend: Nopend (Nomor Pendirian) 5 digit angka bersifat unik sebagai Primary Key Lookup.",
                "Integrasi Routing Engine: Routing engine backend (`TransactionController.checkRouting`) menggunakan Nopend untuk memetakan origin dan destination pengiriman resi.",
                "Hierarki Kantor: Setiap KCP terhubung dengan Nopend pembina (KCU / KC induk)."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator membuka halaman Master Kantor Pos (/kantor).",
                "2. Operator memilih tab klasifikasi (misal: 'Bandung & Cimahi' atau 'KCU') atau mengetik Nopend di kolom pencarian.",
                "3. Operator dapat menyalin Nopend untuk keperluan verifikasi pengiriman di modul lain.",
                "4. Operator berwenang dapat menambah kantor baru atau mengunduh seluruh data dalam format CSV."
            ]
        }
    ]
}
pages.append(("03_Post_Offices_Master_Kantor", page_03))

# ==============================================================================
# PAGE 04: PRODUCTS & SERVICES (MASTER PRODUK)
# ==============================================================================
page_04 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 4 — PRODUCTS & SERVICES (MASTER PRODUK LAYANAN)",
    "metadata": [
        ("Nama Modul", "Master Produk & Layanan Pos (/produk)"),
        ("Kategori Menu", "MASTER DATA / CATALOG"),
        ("Route URL", "/produk"),
        ("File Komponen React", "src/pages/MasterProduk.jsx"),
        ("Backend API Endpoints", "GET /api/produk, POST /api/produk, PUT /api/produk/:id, DELETE /api/produk/:id"),
        ("Koleksi MongoDB", "master_produk"),
        ("Hak Akses Role", "Operator & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Modul Master Produk mengelola katalog layanan pengiriman kurir dan logistik Pos Indonesia "
                "(seperti Pos Ekspres, Pos Reguler, Kilat Khusus, Express Mail Service, Pos Logistik, dan Same Day). "
                "Modul ini mengatur batasan komitmen SLA (Service Level Agreement), batas berat maksimum per koli, deskripsi layanan, dan status keaktifan."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Master Produk disajikan dalam format grid kartu interaktif:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] TOOLBAR: Counter Status (\"6 produk aktif · 0 nonaktif\")          |  [+ Tambah Layanan Produk Baru]  |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] PRODUCT CARDS GRID (Responsive Card Layout)                                                         |\n"
                "| +-----------------------------+ +-----------------------------+ +-----------------------------+         |\n"
                "| | [B1] Pos Ekspres (EKS)      | | [B2] Pos Reguler (REG)      | | [B3] Kilat Khusus (KLK)     |         |\n"
                "| | - Kategori: Express (Cyan)  | | - Kategori: Regular (Navy)  | | - Kategori: Priority (Amber)|         |\n"
                "| | - SLA: H+0 / H+1            | | - SLA: H+2 – H+7            | | - SLA: H+1 – H+3            |         |\n"
                "| | - Max Berat: 30 kg          | | - Max Berat: 50 kg          | | - Max Berat: 30 kg          |         |\n"
                "| | - Status Toggle: [Active]   | | - Status Toggle: [Active]   | | - Status Toggle: [Active]   |         |\n"
                "| +-----------------------------+ +-----------------------------+ +-----------------------------+         |\n"
                "| +-----------------------------+ +-----------------------------+ +-----------------------------+         |\n"
                "| | [B4] Express Mail Svc (EXP) | | [B5] Pos Logistik (LOG)     | | [B6] Same Day (SDH)         |         |\n"
                "| | - Kategori: Intl. (Green)   | | - Kategori: Logistics (Prpl)| | - Kategori: Express (Cyan)  |         |\n"
                "| | - SLA: 5–7 days             | | - SLA: H+3 – H+10           | | - SLA: H+0 (Intra Bandung)  |         |\n"
                "| | - Max Berat: 20 kg          | | - Max Berat: 500 kg         | | - Max Berat: 10 kg          |         |\n"
                "| | - Status Toggle: [Active]   | | - Status Toggle: [Active]   | | - Status Toggle: [Active]   |         |\n"
                "| +-----------------------------+ +-----------------------------+ +-----------------------------+         |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Toolbar & Counter", "Header Toolbar", "Menampilkan jumlah layanan aktif dan non-aktif serta tombol penambahan produk baru.", "Kalkulasi `products.filter(p => p.active).length`", "Tombol '+ Tambah Layanan Produk' memicu pembukaan form pendaftaran produk baru."),
                ("Kotak [B1]: Pos Ekspres (EKS) Card", "Product Card (Express)", "Layanan kilat same-day/next-day dengan SLA H+0/H+1 dan batas muatan 30 kg.", "Dokumen produk EKS", "Saklar toggle aktif/nonaktif mengubah status ketersediaan layanan."),
                ("Kotak [B2]: Pos Reguler (REG) Card", "Product Card (Regular)", "Layanan standar pengiriman nasional dengan SLA H+2 sampai H+7 dan batas muatan 50 kg.", "Dokumen produk REG", "Saklar toggle aktif/nonaktif."),
                ("Kotak [B3]: Kilat Khusus (KLK) Card", "Product Card (Priority)", "Layanan prioritas domestik dengan SLA H+1 sampai H+3 dan batas muatan 30 kg.", "Dokumen produk KLK", "Saklar toggle aktif/nonaktif."),
                ("Kotak [B4]: Express Mail Service (EXP)", "Product Card (International)", "Layanan pos internasional ke 232 negara dengan SLA 5–7 hari dan batas muatan 20 kg.", "Dokumen produk EXP", "Saklar toggle aktif/nonaktif."),
                ("Kotak [B5]: Pos Logistik (LOG) Card", "Product Card (Logistics)", "Layanan kargo dan barang berat partai besar dengan SLA H+3 sampai H+10 dan kapasitas 500 kg.", "Dokumen produk LOG", "Saklar toggle aktif/nonaktif."),
                ("Kotak [B6]: Same Day Bandung (SDH)", "Product Card (Intra-city)", "Layanan kurir khusus koridor Cimahi–Bandung dengan jaminan tiba di hari yang sama (H+0).", "Dokumen produk SDH", "Saklar toggle aktif/nonaktif.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Validasi Layanan",
            "items": [
                "Validasi Batas Berat: Transaksi yang melebihi batas berat maksimum produk akan otomatis ditolak atau dialihkan ke Pos Logistik (LOG).",
                "Integrasi SLA: Komitmen SLA jam/hari digunakan oleh modul Analitik (/analytics) untuk menghitung persentase kepatuhan SLA on-time."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator membuka katalog Master Produk & Layanan (/produk).",
                "2. Operator meninjau spesifikasi batas berat dan jaminan SLA dari setiap produk pos.",
                "3. Operator dapat menonaktifkan sementara produk tertentu saat terjadi kendala rute atau lonjakan kapasitas."
            ]
        }
    ]
}
pages.append(("04_Products_Services_Master_Produk", page_04))

# Generate Batch 1
for name, data in pages:
    md_path = os.path.join(DOCS_DIR, f"{name}.md")
    docx_path = os.path.join(DOCS_DIR, f"{name}.docx")
    write_markdown_file(data, md_path)
    create_docx_for_page(data, docx_path)

print("Batch 1 (00 to 04) completed successfully.")
