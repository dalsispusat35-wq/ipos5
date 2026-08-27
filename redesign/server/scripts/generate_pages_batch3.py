# -*- coding: utf-8 -*-
"""
Batch 3 Documentation Generator (Pages 10, 11, 12, 13, 14, 15 & Master Combined Doc)
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from generate_all_documentation import create_docx_for_page, write_markdown_file, DOCS_DIR, set_cell_background, set_cell_margins

pages = []

# ==============================================================================
# PAGE 10: ESTIMASI MILK RUN
# ==============================================================================
page_10 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 10 — ESTIMASI MILK RUN (TRAVEL TIME & ROUTE PLANNER)",
    "metadata": [
        ("Nama Modul", "Estimasi Milk Run (/estimasi)"),
        ("Kategori Menu", "LOGISTICS / PLANNING"),
        ("Route URL", "/estimasi"),
        ("File Komponen React", "src/pages/EstimasiMilkRun.jsx"),
        ("Backend API Endpoints", "GET /api/estimasi-milk-run/:routeId, GET /api/routes"),
        ("Koleksi MongoDB", "detail_route, master_route_nopen, master_kantor, master_kendaraan, transaksi"),
        ("Hak Akses Role", "Operator & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Halaman Estimasi Milk Run berfungsi sebagai kalkulator dan perencana estimasi waktu tempuh perjalanan (ETA/ETD), "
                "akumulasi jarak kilometer, serta simulasi visual muatan truk interaktif. "
                "Halaman ini menampilkan animasi truk boks Pos Indonesia yang bergerak antar-stasiun singgah dengan ketinggian "
                "muatan di dalam boks yang bertambah dinamis seiring paket yang di-pickup di setiap pos perhentian."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Estimasi Milk Run disusun dalam format simulasi visual interaktif:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] HEADER & CONTROLS: Judul (\"Estimasi Milk Run\") | Rute Filter Pills | [▶ Play] [⏸ Pause] [🔄 Reset]  |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] ANIMATED CARGO TRUCK VISUALIZER (Interactive SVG Truck)                                            |\n"
                "| - Badge Mengambang: \"Beban Aktif: 240 kg | 12 paket di AGEN ARVINET\"                                    |\n"
                "| - Visual Animasi Truk Box Pos Indonesia: Roda Berputar Saat Bergerak, Ketinggian Muatan Naik Sesuai Kg  |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [C] MULTI-STOP INTERACTIVE STEPPER TRACK                                                                |\n"
                "| [Stop 1: Origin] =======> [Stop 2: Arvinet]* =======> [Stop 3: Cicalengka] =======> [Stop 4: SPP Hub]   |\n"
                "| (ETA Kedatangan, ETD Keberangkatan, Tambahan Beban +kg, Akumulasi Total Kg di Truk)                     |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D] MANIFEST PACKAGES INSPECTOR TABLE                                                                   |\n"
                "| - Search Bar & Filter Layanan                                                                           |\n"
                "| - Tabel Paket di Truk pada Stop Ini: Resi, Layanan, Berat (kg), Asal, Tujuan, Pengirim, Penerima, Aksi   |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [E] PACKAGE DETAIL MODAL: Info Lengkap Resi, Bukti Tanda Tangan Digital / Proof of Pickup Mock          |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Header & Simulation Controls", "Top Header Control Strip", "Menampilkan judul modul, filter pemilih rute (Pick Up 1 Night AGP, Pick Up 2, dll), serta tombol kontrol simulasi (Play, Pause, Step Forward, Reset).", "State rute & playback timer", "Tombol 'Play' menjalankan simulasi otomatis pergerakan truk dari stop ke stop berikutnya."),
                ("Kotak [B]: Animated Cargo Truck Visualizer", "Interactive SVG Cargo Canvas Card", "Visualisasi grafis truk boks Pos Indonesia lengkap dengan animasi roda berputar saat melaju dan indikator ketinggian tumpukan muatan boks yang naik sesuai total kg.", "Kalkulasi `(weight / maxWeight) * 50px`", "Badge mengambang di atas truk menampilkan beban aktif saat ini (kg), jumlah koli paket, dan nama lokasi stop."),
                ("Kotak [C]: Multi-Stop Stepper Track", "Interactive Horizontal Waypoint Stepper", "Jalur lintasan stasiun singgah yang memuat informasi jam tiba (ETA), jam berangkat (ETD), tambahan muatan (+kg di stop ini), dan total beban kumulatif di atas truk.", "Koleksi `detail_route` & data estimasi", "Mengklik node stop memindahkan fokus truk dan memperbarui tabel rincian paket di bawahnya."),
                ("Kotak [D]: Manifest Packages Inspector Table", "Tabel Rincian Muatan di Lokasi Terpilih", "Tabel data paket yang dimuat pada stop aktif: Nomor Resi, Layanan (Q9, PE, PKH, EC3), Berat (kg), Asal Nopend, Tujuan Nopend, Pengirim, Penerima.", "Array kargo di stop terpilih", "Filter layanan pos, pencarian resi, dan tombol aksi 'Lihat Resi'."),
                ("Kotak [E]: Package Detail Modal", "Modal Pop-up Jendela Mengambang", "Menampilkan rincian lengkap dokumen resi, informasi kontak pengirim/penerima, serta mock tanda tangan digital serah terima (Proof of Pickup).", "State `selectedPackage`", "Verifikasi bukti fisik penerimaan barang di loket agen.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Kalkulasi Proyeksi Muatan",
            "items": [
                "Kalkulasi ETA Berantai: Waktu tiba di Stop N dihitung dari Jam Berangkat Stop (N-1) ditambah estimasi menit tempuh segmen jalan raya.",
                "Simulasi Beban Bertahap: Total beban truk pada Stop N adalah (Beban Stop N-1) + (Paket Di-load di Stop N) - (Paket Di-unload di Stop N)."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator membuka halaman Estimasi Milk Run (/estimasi).",
                "2. Operator memilih rute feeder yang ingin disimulasikan.",
                "3. Operator menekan tombol 'Play' untuk melihat visualisasi pergerakan armada dan pertambahan muatan.",
                "4. Operator memeriksa kapasitas sisa untuk memastikan armada tidak melebihi daya angkut maksimum."
            ]
        }
    ]
}
pages.append(("10_Estimasi_Milk_Run", page_10))

# ==============================================================================
# PAGE 11: GATE MONITORING (TRANSIT GATE HUB)
# ==============================================================================
page_11 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 11 — GATE MONITORING & TRANSIT PIPELINE",
    "metadata": [
        ("Nama Modul", "Gate Monitoring Transit (/transit-monitoring)"),
        ("Kategori Menu", "LOGISTICS / GATE OPERATIONS"),
        ("Route URL", "/transit-monitoring"),
        ("File Komponen React", "src/pages/GateMonitoring.jsx"),
        ("Backend API Endpoints", "GET /api/gate/pipeline, POST /api/gate/create-manifest, POST /api/gate/dispatch, POST /api/gate/receive-unload"),
        ("Koleksi MongoDB", "transaksi, route_journeys, tracking_events, master_kantor"),
        ("Hak Akses Role", "Operator Gate, Dispatcher, & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Modul Gate Monitoring mengawasi alur pipa perpindahan fisik kiriman paket (3-Stage Logistics Pipeline) "
                "dari loket penerimaan asal (KCU Cimahi) hingga gerbang pembongkaran di pusat pemrosesan pos (SPP Bandung 40000). "
                "Modul ini menangani pembuatan nomor manifest kantong pos, pemberangkatan armada angkutan feeder, serta pemindaian "
                "bongkar muatan di gerbang transit dengan penyegaran data real-time setiap 3.5 detik."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Gate Monitoring dirancang dalam bentuk 3-Kolom Kanban Transit Pipeline:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] SESSION BANNER & CONTROL BAR                                                                        |\n"
                "| - Session: Dispatch ID [TRP-20260824-008] | Armada [B 9910 PCX] | Driver [Ahmad] | Rute [Cimahi -> SPP]  |\n"
                "| - Manifest Aktif: [MNF000001 - Draft] | Jam Berangkat: [08:30 WIB]                                      |\n"
                "| - Controls: Toggle Auto-Refresh (3.5s) | Last Sync Time | [🔄 Refresh Manual]                            |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] 3-STAGE TRANSIT PIPELINE KANBAN COLUMNS                                                             |\n"
                "| +-----------------------------+ +-----------------------------+ +-----------------------------+         |\n"
                "| | [B1] 1. MANIFEST CREATION   | | [B2] 2. LOADING & TRANSIT   | | [B3] 3. GATE ARRIVAL &      |         |\n"
                "| |      (DITERIMA DI CIMAHI)   | |      (IN MANIFEST)          | |      UNLOADING (SPP BANDUNG)|         |\n"
                "| | - Select All Checkbox [✓]   | | - Manifest Code: MNF000001  | | - Arrived Inbound Packages  |         |\n"
                "| | - Resi Items:               | | - Loaded Resi Items:        | | - Ready for Inbound Scan:   |         |\n"
                "| |   • P260820010001 (Q9 2.5kg)| |   • P260820010002 (PE 1.2kg)| |   • P260820010005 (PKH 4kg) |         |\n"
                "| |   • P260820010003 (PKH 5kg) | |   • P260820010004 (EC3 0.8k)| |   • P260820010006 (Q9 1.5kg)|         |\n"
                "| | --------------------------- | | --------------------------- | | --------------------------- |         |\n"
                "| | Tombol Aksi:                | | Tombol Aksi:                | | Tombol Aksi:                |         |\n"
                "| | [📝 Buat Manifest (X Resi)] | | [🚚 Kirim & Berangkatkan]   | | [✅ Terima & Selesai Bongkar]|        |\n"
                "| +-----------------------------+ +-----------------------------+ +-----------------------------+         |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Session Banner & Controls", "Top Header Card", "Menampilkan identitas sesi pengiriman aktif (Dispatch ID, nomor armada, driver, rute, jam keberangkatan, status manifest) serta kontrol auto-refresh polling 3.5 detik.", "Object `sessionInfo` dari database", "Toggle saklar auto-refresh, indikator waktu sinkronisasi terakhir, dan tombol refresh manual."),
                ("Kotak [B1]: Stage 1 — Manifest Creation", "Kolom Kanban Kiri", "Menampilkan daftar paket yang baru diterima di loket Cimahi (`DITERIMA_DI_CIMAHI`) dan siap dimasukkan ke dalam manifest kantong pos.", "Array `s1Items`", "Checkbox pemilih resi massal (Select All), tombol '📝 Buat Manifest (X Resi Dipilih)' memindahkan paket terpilih ke Stage 2."),
                ("Kotak [B2]: Stage 2 — Loading & Transit", "Kolom Kanban Tengah", "Menampilkan paket yang telah disegel ke dalam nomor manifest (`IN_MANIFEST`) dan sedang dimuat di atas armada dalam perjalanan feeder.", "Array `s2Items`", "Kode manifest aktif (e.g. MNF000001), tombol '🚚 Kirim & Berangkatkan Armada' mengupdate status dan memindahkan paket ke Stage 3."),
                ("Kotak [B3]: Stage 3 — Gate Arrival & Unload", "Kolom Kanban Kanan", "Menampilkan paket yang telah tiba di gerbang terminal SPP Bandung (`TRANSIT_SPP_BANDUNG` / `TIBA_DI_SPP_TUJUAN`) untuk dibongkar.", "Array `s3Items`", "Daftar paket inbound, tombol '✅ Terima & Selesai Bongkar' memfinalisasi status serah terima di SPP.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Integritas Manifest",
            "items": [
                "Validasi Batch Manifest: Paket yang dimasukkan ke manifest harus memiliki status awal DITERIMA_DI_CIMAHI.",
                "Pemberangkatan Tunggal: Manifest yang telah diberangkatkan terkunci otomatis dan memicu pencatatan event IN_TRANSIT di `tracking_events`."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Petugas Loket Cimahi memilih paket-paket yang siap diberangkatkan di Kolom 1 dan mengklik 'Buat Manifest'.",
                "2. Petugas Dispatcher memeriksa muatan armada di Kolom 2 dan mengklik 'Kirim & Berangkatkan Armada'.",
                "3. Petugas Gate SPP Bandung menerima kedatangan armada di Kolom 3 dan mengklik 'Terima & Selesai Bongkar'.",
                "4. Sistem secara otomatis memperbarui status seluruh resi di database dan menampilkan notifikasi sukses."
            ]
        }
    ]
}
pages.append(("11_Gate_Monitoring", page_11))

# ==============================================================================
# PAGE 12: ANALITIK & LAPORAN OPERASIONAL
# ==============================================================================
page_12 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 12 — ANALITIK SLA & PUSAT LAPORAN OPERASIONAL",
    "metadata": [
        ("Nama Modul", "Analitik SLA & Laporan Operasional (/analytics)"),
        ("Kategori Menu", "LOGISTICS / REPORTING & ANALYTICS"),
        ("Route URL", "/analytics"),
        ("File Komponen React", "src/pages/AnalyticsReport.jsx"),
        ("Backend API Endpoints", "GET /api/analytics/sla-performance, GET /api/analytics/throughput, GET /api/analytics/export-csv"),
        ("Koleksi MongoDB", "transaksi, route_journeys, master_kendaraan, master_kantor"),
        ("Hak Akses Role", "Operator, Manager Operasional, & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Modul Analitik & Laporan menyajikan analisis mendalam mengenai tingkat kepatuhan Service Level Agreement (SLA On-Time), "
                "throughput tonase muatan kargo, breakdown performa ketepatan waktu per produk pos (Q9 Sameday, PE Nextday, PKH Reguler, EC3 Shopee), "
                "grafik tren SLA regional dengan skala sumbu Y jujur (0%–100%), serta pusat ekspor laporan resmi dalam format CSV/Spreadsheet dan cetak fisik."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Analitik SLA & Pusat Laporan disusun dalam 5 tingkatan blok data:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] HEADER BANNER: Judul (\"Analitik SLA & Pusat Laporan\") | [● Live DB] | [🔄 Refresh] | [🖨️ Cetak]     |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B1] Tingkat SLA On-Time | [B2] Total Paket Terolah | [B3] Rata-rata Lead Time  | [B4] Throughput Muatan|\n"
                "|      98.5% On-Time       |      922 Transaksi       |      4.2 Jam              |      43.5 Ton         |\n"
                "|      (Emerald Card)      |      (Cyan Card)         |      (Amber Card)         |      (Purple Card)    |\n"
                "+--------------------------+--------------------------+---------------------------+-----------------------+\n"
                "| [C] LINE OUTGOING PROSEN SLA REGIONAL (Full-Width Dark Spatial Card)                                    |\n"
                "| - Header: Judul Grafik, Badge Skala Proporsional, Badge Skala Y 0% - 100% (Standar Resmi Laporan)       |\n"
                "| - Legend: [● REG 1] [● REG 2] [● REG 3] [● REG 4]                                                       |\n"
                "| - Dynamic SVG Canvas: Y-Ticks (0%, 20%, 40%, 60%, 80%, 100%), Target SLA 90% Garis Merah Putus-Putus    |\n"
                "| - Multi-Line Curves REG 1 to 4 with Hover Tooltip Box (Region, Tanggal, Persentase SLA)                 |\n"
                "| - Footer: Date Range Slider Filter (2026-07-21 s/d 2026-08-12)                                          |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D1] PERFORMA SLA PER JENIS LAYANAN           | [D2] THROUGHPUT STATUS KIRIMAN (Volume & Berat)         |\n"
                "| - Q9 (Pos Sameday): 100.0% On-Time            | - DITERIMA_DI_CIMAHI: 350 Paket (12.400 kg)             |\n"
                "| - PE (Pos Nextday):  98.2% On-Time            | - IN_MANIFEST:        210 Paket (8.950 kg)              |\n"
                "| - PKH (Pos Reguler): 96.5% On-Time            | - TRANSIT_SPP_BANDUNG:180 Paket (10.120 kg)             |\n"
                "| - EC3 (Pos Shopee):  94.8% On-Time            | - TIBA_DI_SPP_TUJUAN:  45 Paket (3.200 kg)              |\n"
                "| (Progress bar indikator & target jam SLA)     | - DELIVERED:          137 Paket (8.848 kg)              |\n"
                "+-----------------------------------------------+---------------------------------------------------------+\n"
                "| [E] PUSAT EKSPOR LAPORAN OPERASIONAL (Export Hub Section)                                               |\n"
                "| - Filter Dropdown: Status Paket | Filter Jenis Layanan | Filter Nopend Tujuan                           |\n"
                "| - Action Buttons: [Reset Filter]  |  [📥 Unduh Laporan CSV / Spreadsheet]                               |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Header Banner & Print Toolbar", "Top Header Spatial Card", "Menampilkan judul modul analitik, badge status live database (`transaksi`), tombol refresh data, dan tombol cetak fisik (Print Document).", "Metadata `slaData.dataSource`", "Tombol '🔄 Refresh Data' memuat ulang agregasi, tombol '🖨️ Cetak Laporan' memicu dialog print browser window."),
                ("Kotak [B1]: Tingkat SLA On-Time Card", "KPI Card Pastel Emerald (Row 1 Kolom 1)", "Menampilkan persentase kepatuhan pengiriman tepat waktu terhadap target jam SLA (98.5% On-Time) beserta jumlah paket on-time.", "Field `metrics.slaComplianceRate` & `metrics.onTimeCount`", "Indikator efisiensi mutu pelayanan pengiriman."),
                ("Kotak [B2]: Total Paket Terolah Card", "KPI Card Pastel Cyan (Row 1 Kolom 2)", "Menampilkan jumlah total transaksi paket kiriman yang berhasil diproses di jaringan pos.", "Field `metrics.totalTransactions` & `metrics.deliveredCount`", "Volume throughput operasional harian/bulanan."),
                ("Kotak [B3]: Rata-rata Lead Time Card", "KPI Card Pastel Amber (Row 1 Kolom 3)", "Menampilkan durasi rata-rata dalam satuan jam dari proses loket Cimahi hingga serah terima di SPP tujuan (4.2 Jam).", "Field `metrics.avgHandlingTimeHours`", "Metrik kecepatan handling dan dispatching rantai pasok."),
                ("Kotak [B4]: Throughput Muatan Card", "KPI Card Pastel Purple (Row 1 Kolom 4)", "Menampilkan total tonase muatan kargo barang yang berhasil didistribusikan dalam satuan Ton dan kilogram riil.", "Field `throughputData.totalWeightKg`", "Konversi otomatis ke format Ton (e.g. 43.5 Ton / 43.518 kg)."),
                ("Kotak [C]: Line Outgoing SLA Regional", "Full-Width Dark Spatial Card (Row 2)", "Grafik garis tren persentase SLA harian per wilayah regional (REG 1 s/d REG 4) dengan skala Y 0%–100% dan garis target SLA 90%.", "Array data tren tanggal dan persentase regional", "Hover pada titik kurva menampilkan tooltip nilai persentase SLA, slider rentang tanggal di footer."),
                ("Kotak [D1]: Performa SLA Per Layanan", "Spatial Card Kiri (Row 3 Kolom 1)", "Kartu rincian kepatuhan waktu kirim per jenis produk pos: Q9 Pos Sameday (<=6 Jam), PE Nextday (<=24 Jam), PKH Reguler, EC3 Shopee.", "Object `serviceBreakdown`", "Progress bar warna (Hijau >=95%, Kuning <95%), rincian target jam SLA, dan jumlah paket terlambat."),
                ("Kotak [D2]: Throughput Status Kiriman", "Spatial Card Kanan (Row 3 Kolom 2)", "Tabel rekapitulasi volume paket dan akumulasi berat kargo (kg) di setiap tahapan status rantai distribusi pos.", "Object `stateThroughput`", "Distribusi status: DITERIMA_DI_CIMAHI, IN_MANIFEST, TRANSIT_SPP_BANDUNG, TIBA_DI_SPP_TUJUAN, DELIVERED."),
                ("Kotak [E]: Pusat Ekspor Laporan Hub", "Spatial Card Lebar Penuh (Row 4)", "Panel penyaring data dan generator unduhan laporan operasional resmi berformat CSV / Spreadsheet.", "Endpoint GET /api/analytics/export-csv", "Filter dropdown Status Paket, Jenis Layanan, Nopend Tujuan, tombol 'Reset Filter', dan tombol '📥 Unduh Laporan CSV'.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Standar Skala Representasi Data",
            "items": [
                "Standar Skala Y Jujur: Sumbu Y grafik SLA wajib dimulai dari 0% hingga 100% untuk mencegah distorsi persepsi performa.",
                "Kalkulasi SLA On-Time: Resi dikategorikan on-time bila selisih waktu antara status DITERIMA dan DELIVERED kurang dari sama dengan batas target jam layanan.",
                "Export Filtering: Berkas CSV yang diunduh mencakup seluruh kolom transaksi sesuai kriteria filter yang diterapkan operator."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator atau Manager membuka modul Analitik & Laporan (/analytics).",
                "2. Manager mengevaluasi persentase SLA On-Time dan mengidentifikasi layanan pos yang mengalami keterlambatan pada kartu [D1].",
                "3. Manager meninjau grafik tren harian regional pada kartu [C] untuk melihat stabilitas layanan.",
                "4. Operator menerapkan filter status/layanan pada panel [E] dan mengunduh berkas laporan CSV untuk rekapitulasi bulanan."
            ]
        }
    ]
}
pages.append(("12_Analitik_dan_Laporan", page_12))

# ==============================================================================
# PAGE 13: DATABASE VIEWER (TRANSAKSI)
# ==============================================================================
page_13 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 13 — DATABASE VIEWER (TABEL TRANSAKSI RESI)",
    "metadata": [
        ("Nama Modul", "Database Viewer Transaksi (/transaksi)"),
        ("Kategori Menu", "SYSTEM / RESTRICTED DATA VIEWER"),
        ("Route URL", "/transaksi"),
        ("File Komponen React", "src/pages/Transaksi.jsx"),
        ("Backend API Endpoints", "GET /api/transaksi?page=1&limit=25, GET /api/transaksi/stats, GET /api/transaksi/:connoteCode"),
        ("Koleksi MongoDB", "transaksi, master_kantor, master_kendaraan"),
        ("Hak Akses Role", "Restricted (Super Admin & Authorized Operators)"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Database Viewer merupakan modul penjelajah dan audit data mentah seluruh dokumen transaksi resi kiriman di koleksi MongoDB `transaksi`. "
                "Modul ini dilengkapi sistem pencarian teks bebas (debounced search), penyaringan multi-parameter "
                "(Status, Layanan, Nopend Tujuan, KPRK, Regional 1–6, Plat Armada, Rentang Tanggal), "
                "paginasi server-side berkecepatan tinggi, serta modal inspeksi dokumen resi dan telemetri armada."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Database Viewer Transaksi disusun dalam arsitektur tabel korporat:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] HEADER: Judul (\"Database Viewer Transaksi\") | Badge Total Data MongoDB | Timestamp Sync | [🔄 Sync] |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B1] Total Transaksi | [B2] Dalam Pengiriman | [B3] Selesai / Terkirim   | [B4] Muatan Terdaftar        |\n"
                "|      922 Resi        |      785 Resi (85%)   |      137 Resi (15%)       |      43.5 Ton                |\n"
                "+----------------------+-----------------------+---------------------------+------------------------------+\n"
                "| [C] ADVANCED MULTI-FILTER & SEARCH CONTROL PANEL                                                        |\n"
                "| - Baris 1: Debounced Search Input (Resi, Pengirim, Penerima, Kota) | Filter Status | Filter Layanan      |\n"
                "| - Baris 2: Filter KPRK Tujuan | Filter Regional (Reg 1-6) | Filter Nopol Armada | Date From s/d Date To   |\n"
                "| - Baris 3: Selector Baris per Halaman (10, 25, 50, 100) | Tombol [Reset Filter]                            |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D] COMPREHENSIVE TRANSACTIONS DATA TABLE                                                               |\n"
                "| - Kolom: No, Resi (Copyable), Tanggal, Layanan, Asal, Tujuan KPRK, Berat (kg), Tarif, Status, Nopol, Aksi|\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [E] PAGINATION & ROWS FOOTER: \"Menampilkan 1-25 dari 922 data\" | [◀ Prev] [1] [2] [3] ... [Next ▶]       |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [F] MODALS: [Modal Detail Resi Connote] | [Modal Profil & Telemetri Kendaraan (`VehicleDetailModal`)]   |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Header Bar & Sync Info", "Top Header Bar", "Menampilkan judul modul, badge jumlah total data di database MongoDB `transaksi`, waktu sinkronisasi terakhir, dan tombol refresh data.", "Metadata database MongoDB", "Tombol '🔄 Sync' memuat ulang data langsung dari database."),
                ("Kotak [B1 - B4]: 4 Metric Summary Cards", "Grid 4 Kartu Rangkuman (Row 1)", "Menampilkan jumlah total transaksi resi, paket dalam pengiriman aktif, paket sukses terkirim, dan total berat muatan terdaftar.", "Agregasi stats dari backend", "Memberikan gambaran cepat sebaran status transaksi."),
                ("Kotak [C]: Advanced Multi-Filter Panel", "Multi-Row Filter Control Card (Row 2)", "Bilah filter komprehensif: Debounced Search Input (400ms delay), Filter Status, Filter Layanan, Filter KPRK, Filter Regional, Filter Plat Armada, Date Picker Dari-Sampai, dan Page Size Selector.", "State filter transaksi", "Filter multi-kriteria dieksekusi secara server-side query."),
                ("Kotak [D]: Comprehensive Data Table", "Tabel Data Transaksi Responsif (Row 3)", "Menampilkan tabel data transaksi: Nomor Baris, Kode Resi (dengan tombol salin), Tanggal Transaksi, Badge Layanan, Kantor Asal, Nopend/KPRK Tujuan, Berat (kg), Biaya Kirim (Rp), Badge Status, Plat Armada (Link), Tombol Aksi.", "Array `data` dari GET /api/transaksi", "Klik Plat Nopol membuka modal telemetri mobil, klik tombol aksi membuka modal detail resi."),
                ("Kotak [E]: Pagination & Rows Footer", "Footer Bar Navigasi Paginasi", "Menampilkan info baris aktif ('Menampilkan X-Y dari Z data') dan tombol navigasi halaman (Prev, Next, Page Numbers).", "State `page`, `totalPages`, `totalRows`", "Paginasi server-side cepat dengan limit 10, 25, 50, atau 100 baris."),
                ("Kotak [F]: Details Modals Popup", "Modal Pop-up Jendela Mengambang", "Menampilkan rincian dokumen resi paket (kontak pengirim, penerima, riwayat pergerakan) atau spesifikasi armada mobil.", "State `selectedConnote` & `selectedVehicle`", "Inspeksi data mentah JSON dokumen MongoDB.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Pengindeksan Database",
            "items": [
                "Server-side Query Optimization: Backend memanfaatkan indeks MongoDB pada field `connote_code`, `created_at`, `connote_state`, dan `destination_nopen` untuk memastikan respon query di bawah 100ms.",
                "Debounced Search: Input pencarian menggunakan delay 400ms sebelum request dikirimkan ke server guna menghemat beban query database."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator membuka modul Database Viewer (/transaksi).",
                "2. Operator mengetikkan nomor resi atau nama pihak pengirim pada kolom pencarian.",
                "3. Operator dapat menyaring berdasarkan status pengiriman atau wilayah regional tertentu.",
                "4. Operator mengklik tombol 'Lihat Detail' untuk memeriksa rincian lengkap transaksi paket."
            ]
        }
    ]
}
pages.append(("13_Database_Viewer_Transaksi", page_13))

# ==============================================================================
# PAGE 14: SYSTEM SETTINGS & COMPASS CONNECTION
# ==============================================================================
page_14 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 14 — SYSTEM SETTINGS & COMPASS CONNECTION",
    "metadata": [
        ("Nama Modul", "System Settings & Compass Manager (/settings & /compass)"),
        ("Kategori Menu", "SYSTEM / DATABASE CONFIGURATION"),
        ("Route URL", "/settings, /compass"),
        ("File Komponen React", "src/pages/Settings.jsx, src/pages/Compass.jsx"),
        ("Backend API Endpoints", "POST /api/settings/test-db, GET /api/compass/connections, POST /api/compass/switch"),
        ("Koleksi MongoDB", "Konfigurasi MongoDB Multi-Server (`connections.json`)"),
        ("Hak Akses Role", "SUPER_ADMIN Only (Hak Akses Penuh Konfigurasi)"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Modul System Settings & Compass Manager digunakan secara eksklusif oleh Super Admin untuk mengelola koneksi database MongoDB multi-server. "
                "Modul ini mendukung konfigurasi connection string MongoDB live sync, pengujian latensi koneksi (Ping/Test Connection), "
                "pengalihan server database aktif secara instan (Primary Remote 192.168.5.219 vs Local Fallback 127.0.0.1), "
                "serta pengaturan enkripsi TLS dan protokol otentikasi SCRAM-SHA-256."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman System Settings & Compass dirancang dalam format panel konfigurasi aman:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] DATABASE CONNECTION SETTINGS CARD                                                                   |\n"
                "| - Header: Ikon Sinyal Wifi, Judul (\"Database Connection\"), Badge Status [Connected / Disconnected]     |\n"
                "| - Connection URI Input Box (Input Text / Password Toggle dengan Ikon Mata)                              |\n"
                "|   Default: mongodb://127.0.0.1:27017/ipos5_reporting                                                    |\n"
                "| - Tombol Aksi: [⚡ Test Connection]  |  [💾 Simpan & Terapkan]  |  [🔌 Disconnect]                       |\n"
                "| - Keterangan: Last Tested Timestamp WIB                                                                 |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] COMPASS MULTI-CLUSTER CONNECTION PRESETS                                                            |\n"
                "| +------------------------------------+ +------------------------------------+                          |\n"
                "| | [B1] Primary Remote Mongo (Active) | | [B2] Local Development MongoDB     |                          |\n"
                "| | - IP: 192.168.5.219:27017          | | - IP: 127.0.0.1:27017              |                          |\n"
                "| | - DB: ipos5_reporting              | | - DB: ipos5_reporting              |                          |\n"
                "| | - Status: [● Active Connected]     | | - Tombol: [Beralih ke Server Ini]  |                          |\n"
                "| +------------------------------------+ +------------------------------------+                          |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [C] SECURITY & PROTOCOL SETTINGS CARD                                                                   |\n"
                "| - SSL/TLS Encryption Toggle | SCRAM-SHA-256 Auth Protocol | Connection Timeout (ms)                      |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Database Connection Settings Card", "Spatial Card Konfigurasi Utama", "Panel pengaturan string koneksi URI MongoDB aktif, status koneksi (Connected/Disconnected/Testing), dan waktu pengujian terakhir.", "State `uri`, `connected`, `lastTested`", "Input field dengan toggle show/hide password, tombol '⚡ Test Connection' menguji respon server, tombol simpan menerapkan koneksi."),
                ("Kotak [B1]: Primary Remote Mongo Preset", "Cluster Preset Card (Server Utama)", "Profil koneksi server MongoDB pusat jaringan kantor pos (`192.168.5.219:27017/ipos5_reporting`).", "File konfigurasi `connections.json`", "Badge '● Active Connected' menandakan server ini sedang melayani seluruh permintaan sistem."),
                ("Kotak [B2]: Local Development Mongo Preset", "Cluster Preset Card (Server Lokal)", "Profil koneksi server MongoDB lokal pengembang (`127.0.0.1:27017/ipos5_reporting`) untuk pengujian offline.", "File konfigurasi `connections.json`", "Tombol 'Beralih ke Server Ini' mengalihkan koneksi sistem ke workstation lokal secara instan."),
                ("Kotak [C]: Security & Protocol Settings Card", "Spatial Card Keamanan Jaringan", "Konfigurasi parameter keamanan tingkat lanjut: Enkripsi SSL/TLS, mekanisme otentikasi pengguna SCRAM-SHA-256, dan batas waktu time-out koneksi.", "Protokol keamanan driver MongoDB", "Saklar proteksi enkripsi data sensitif transaksi pengiriman pos.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Keamanan Koneksi Database",
            "items": [
                "Otentikasi Kredensial: String koneksi yang memuat password secara otomatis disamarkan (masked) untuk mencegah kebocoran visual kredensial.",
                "Failover Aman: Apabila pengujian koneksi ke server baru gagal, sistem mempertahankan koneksi aktif yang ada tanpa mengganggu operasional sistem."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Super Admin membuka menu System Settings (/settings).",
                "2. Super Admin memeriksa status konektivitas database pada badge status [A].",
                "3. Bila diperlukan pengalihan server, Super Admin mengklik tombol 'Beralih ke Server Ini' pada kartu preset [B].",
                "4. Sistem melakukan uji ping koneksi dan menyinkronkan seluruh modul ke database terpilih."
            ]
        }
    ]
}
pages.append(("14_System_Settings_Compass", page_14))

# ==============================================================================
# PAGE 15: USER PROFILE & ACCOUNT
# ==============================================================================
page_15 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 15 — USER PROFILE & ACCOUNT MANAGEMENT",
    "metadata": [
        ("Nama Modul", "User Profile & Account (/profile)"),
        ("Kategori Menu", "ACCOUNT / SECURITY MANAGEMENT"),
        ("Route URL", "/profile"),
        ("File Komponen React", "src/pages/Profile.jsx"),
        ("Backend API Endpoints", "GET /api/auth/me, PUT /api/auth/update-profile, POST /api/auth/change-password"),
        ("Koleksi MongoDB", "users"),
        ("Hak Akses Role", "Semua Role (Super Admin, Operator, Dispatcher, Driver)"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Halaman User Profile & Account menampilkan identitas profil akun pegawai pos yang sedang aktif login, "
                "mencakup Nama Lengkap, Nomor Induk Pegawai (NIP), Username, Hak Akses Role (SUPER_ADMIN / OPERATOR), "
                "Unit Kantor Pos Penugasan (misal KCU Cimahi 40511), fitur pembaruan kata sandi, status otentikasi ganda (2FA), "
                "serta riwayat log audit sesi login pengguna."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman User Profile & Account disusun dalam arsitektur profil personal yang rapi:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] USER PROFILE HERO BANNER                                                                            |\n"
                "| - Avatar Profil Pengguna & Tombol Ganti Foto Avatar                                                     |\n"
                "| - Nama Lengkap Pengguna (e.g. \"Sari Rahayu\") | NIP Pegawai Pos [99283741]                              |\n"
                "| - Role Badge: [SUPER_ADMIN / DISPATCHER] | Unit Kerja: [40511 - KCU Cimahi]                             |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] PERSONAL & OFFICE ACCOUNT INFORMATION FORM                                                          |\n"
                "| - Form Grid: Nama Lengkap, NIP Pegawai, Username Login, Email Resmi Pos, No Telp / WA, Cabang Penugasan|\n"
                "| - Tombol: [💾 Simpan Perubahan Profil]                                                                  |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [C] SECURITY & PASSWORD MANAGEMENT CARD                                                                 |\n"
                "| - Form Ubah Password: Password Saat Ini, Password Baru, Konfirmasi Password Baru                        |\n"
                "| - Two-Factor Authentication (2FA) Security Status Badge                                                 |\n"
                "| - Tombol: [🔒 Perbarui Kata Sandi]                                                                      |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D] RECENT ACTIVITY & LOGIN SESSION AUDIT TRAIL                                                         |\n"
                "| - Tabel Riwayat Sesi: Waktu Login WIB, Alamat IP Client, Perangkat / Browser, Status Sesi Aktif           |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: User Profile Hero Banner", "Hero Banner Card (Paling Atas)", "Menampilkan avatar pengguna, nama lengkap, NIP resmi pegawai, badge hak akses peran (SUPER_ADMIN / DISPATCHER), dan kantor cabang tugas.", "Dokumen user aktif dari token JWT / session", "Tombol unggah foto avatar profil baru."),
                ("Kotak [B]: Personal & Office Info Form", "Spatial Form Card (Tengah Kiri)", "Formulir pembaruan data personel: Nama Lengkap, NIP, Username, Alamat Email Resmi (@posindonesia.co.id), Nomor WhatsApp/Telepon, Cabang Tugas.", "Koleksi MongoDB `users`", "Validasi format email dan nomor telepon, tombol '💾 Simpan Perubahan Profil'."),
                ("Kotak [C]: Security & Password Card", "Spatial Form Card (Tengah Kanan)", "Formulir perubahan kata sandi (Password Lama, Password Baru, Konfirmasi Password) serta indikator keamanan status Two-Factor Auth (2FA).", "Endpoint POST /api/auth/change-password", "Enkripsi password menggunakan Bcrypt hash dengan salt rounds standar industri, tombol '🔒 Perbarui Kata Sandi'."),
                ("Kotak [D]: Recent Activity Audit Trail", "Spatial Table Card (Bawah Halaman)", "Tabel jejak audit aktivitas sesi login: Timestamp WIB, Alamat IP perangkat, Tipe Browser / OS, dan status sesi (Active / Logged Out).", "Log sesi keamanan akun", "Pencegahan akses tidak sah dan transparansi jejak operasional pengguna.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Kebijakan Keamanan Akun",
            "items": [
                "Keamanan Kata Sandi: Kata sandi baru wajib memenuhi kriteria minimal 8 karakter dan di-hash menggunakan algoritma Bcrypt.",
                "Pemisahan Hak Akses (RBAC): Hak akses role (Super Admin vs Operator) hanya dapat diubah oleh akun dengan level Super Admin."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Pengguna membuka halaman Profil (/profile) melalui menu avatar di navigasi atas.",
                "2. Pengguna memeriksa kesesuaian unit kerja dan nomor kontak WhatsApp aktif.",
                "3. Pengguna dapat mengubah kata sandi secara berkala untuk menjaga keamanan akun.",
                "4. Pengguna meninjau log aktivitas login untuk memastikan tidak ada aktivitas mencurigakan dari IP asing."
            ]
        }
    ]
}
pages.append(("15_User_Profile", page_15))

# Generate Batch 3
for name, data in pages:
    md_path = os.path.join(DOCS_DIR, f"{name}.md")
    docx_path = os.path.join(DOCS_DIR, f"{name}.docx")
    write_markdown_file(data, md_path)
    create_docx_for_page(data, docx_path)

print("Batch 3 (10 to 15) completed successfully.")
