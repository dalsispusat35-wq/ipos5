# -*- coding: utf-8 -*-
"""
Batch 2 Documentation Generator (Pages 05, 06, 07, 08, 09)
"""

import os
from generate_all_documentation import create_docx_for_page, write_markdown_file, DOCS_DIR

pages = []

# ==============================================================================
# PAGE 05: FLEET MANAGEMENT (MASTER KENDARAAN)
# ==============================================================================
page_05 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 5 — FLEET MANAGEMENT (MASTER KENDARAAN ARMADA)",
    "metadata": [
        ("Nama Modul", "Master Kendaraan Armada (/kendaraan)"),
        ("Kategori Menu", "OPERATIONS / MASTER DATA"),
        ("Route URL", "/kendaraan"),
        ("File Komponen React", "src/pages/MasterKendaraan.jsx"),
        ("Backend API Endpoints", "GET /api/kendaraan, POST /api/kendaraan, PUT /api/kendaraan/:id, DELETE /api/kendaraan/:id, GET /api/kendaraan/capacity/:nopol"),
        ("Koleksi MongoDB", "master_kendaraan, route_journeys, master_route_nopen"),
        ("Hak Akses Role", "Operator & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Halaman Fleet Management bertanggung jawab mengelola seluruh unit kendaraan operasional angkutan pos "
                "(Mobil Box 1.5 Ton, Mobil Box 3.5 Ton, Truk Medium Box 6 Ton, Truk Heavy Box 10 Ton, Blind Van). "
                "Modul ini mencatat nomor polisi (Plat Nopol), nama dan kontak driver penanggung jawab, kapasitas muatan maksimum (kg), "
                "kantor pangkalan (Home Base), rute default yang ditugaskan, tanggal servis terakhir, serta utilisasi beban muatan real-time."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Master Kendaraan Armada dirancang dalam format fleet grid interaktif:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] TOOLBAR: Counter Armada (\"5 armada terdaftar · 5 aktif\")               |  [+ Tambah Kendaraan Baru] |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] ADD / EDIT VEHICLE COLLAPSIBLE DRAWER FORM (Kondisional: Muncul saat tombol [+ Tambah] diklik)      |\n"
                "| - Form Grid: Nopen Asal / Homebase, Plat Nopol, Tipe Armada, Merk/Model, Driver, Rute Default, Max Cap  |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [C] FLEET CARDS GRID (Visual Vehicle Fleet Grid)                                                        |\n"
                "| +--------------------------------------+ +--------------------------------------+                       |\n"
                "| | [C1] B 9910 PCX — Gran Max Box       | | [C2] B 9945 PCY — Isuzu Traga Box    |                       |\n"
                "| | - Tipe: Mobil Box (1.5 Ton)          | | - Tipe: Mobil Box (3.5 Ton)          |                       |\n"
                "| | - Driver: Supriatna                  | | - Driver: Ahmad Hidayat              |                       |\n"
                "| | - Home Base: 40395C1 - KCP Cililin   | | - Home Base: 40000 - KCU Bandung     |                       |\n"
                "| | - Rute: RT-MALAM-B9910-PCX           | | - Rute: RT-MALAM-B9945-PCY-PU1       |                       |\n"
                "| | - Muatan: [||||||||||  ] 468/1500 kg | | - Muatan: [||||||||||||] 1225/3500 kg|                       |\n"
                "| | - Status: [Active] | Servis: 22 Jul  | | - Status: [Active] | Servis: 22 Jul  |                       |\n"
                "| | - Tombol: [🔍 Detail & Telemetri]    | | - Tombol: [🔍 Detail & Telemetri]    |                       |\n"
                "| +--------------------------------------+ +--------------------------------------+                       |\n"
                "| +--------------------------------------+ +--------------------------------------+                       |\n"
                "| | [C3] D 8812 AB — Isuzu Elf Long Box  | | [C4] D 8990 SPP — Fuso Heavy Box     |                       |\n"
                "| | - Tipe: Truk Medium Box (6 Ton)      | | - Tipe: Truk Heavy Box (10 Ton)      |                       |\n"
                "| | - Muatan: [||||||||    ] 2100/6000 kg| | - Muatan: [||||||      ] 3120/10000kg|                       |\n"
                "| | - Tombol: [🔍 Detail & Telemetri]    | | - Tombol: [🔍 Detail & Telemetri]    |                       |\n"
                "| +--------------------------------------+ +--------------------------------------+                       |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D] VEHICLE DETAIL & TELEMETRY MODAL (`VehicleDetailModal.jsx`)                                         |\n"
                "| - Profil Lengkap Kendaraan, Kapasitas Muatan Real-time, Driver Phone, History Perjalanan Hari Ini       |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Toolbar & Counter", "Header Toolbar", "Menampilkan jumlah total armada terdaftar dan armada yang berstatus aktif siap jalan.", "Kalkulasi `vehicles.length` & status aktif", "Tombol '+ Tambah Kendaraan Baru' membuka form drawer penambahan unit mobil."),
                ("Kotak [B]: Add/Edit Vehicle Form Drawer", "Collapsible Form Drawer Card", "Formulir input data kendaraan: Nopen Home Base, Plat Nopol, Jenis Mobil, Merk/Model, Driver, Rute Default, dan Kapasitas Maksimum (kg).", "State `form`", "Validasi keunikan nomor polisi dan penyimpanan ke koleksi MongoDB `master_kendaraan`."),
                ("Kotak [C1 - C4]: Visual Fleet Cards Grid", "Responsive Cards Grid Layout", "Kartu identitas kendaraan lengkap dengan plat nomor, merk, nama driver, kantor pangkalan, rute trayek, progress bar muatan terpakai, dan tanggal servis.", "Koleksi `master_kendaraan` digabung dengan `getVehicleCapacity`", "Progress bar kapasitas dinamis (Hijau/Kuning/Merah), tombol 'Detail & Telemetri' membuka modal rincian kargo."),
                ("Kotak [D]: Vehicle Detail & Telemetry Modal", "Modal Pop-up Mengambang", "Menampilkan detail mendalam profil mobil, kontak telepon driver, riwayat muatan kargo resi, dan posisi koordinat GPS terkini.", "Komponen `VehicleDetailModal.jsx`", "Operator dapat memverifikasi paket yang dibawa mobil dan melakukan panggilan telepon cepat ke pengemudi.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Kapasitas Beban",
            "items": [
                "Ambang Batas Muatan: Maksimum kapasitas muatan (Gran Max: 1.500 kg, Traga: 3.500 kg, Elf: 6.000 kg, Fuso: 10.000 kg) menjadi pembagi persentase beban di Checker dan Milk Run.",
                "Pencegahan Overcapacity: Sistem memberikan peringatan visual merah jika akumulasi paket melebihi batas daya tampung kendaraan."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator membuka halaman Master Kendaraan Armada (/kendaraan).",
                "2. Operator memantau keterisian muatan masing-masing mobil melalui indikator progress bar.",
                "3. Operator mengklik tombol 'Detail & Telemetri' untuk memeriksa daftar muatan kargo di dalam mobil.",
                "4. Operator dapat mendaftarkan unit armada baru atau memperbarui status perawatan rutin berkala."
            ]
        }
    ]
}
pages.append(("05_Fleet_Master_Kendaraan", page_05))

# ==============================================================================
# PAGE 06: ROUTES MANAGEMENT (MASTER RUTE)
# ==============================================================================
page_06 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 6 — ROUTES MANAGEMENT (MASTER RUTE LOGISTIK)",
    "metadata": [
        ("Nama Modul", "Master Route Logistik (/route)"),
        ("Kategori Menu", "OPERATIONS / MASTER DATA"),
        ("Route URL", "/route"),
        ("File Komponen React", "src/pages/MasterRoute.jsx"),
        ("Backend API Endpoints", "GET /api/route, POST /api/route, PUT /api/route/:id, DELETE /api/route/:id"),
        ("Koleksi MongoDB", "master_route_nopen, detail_route, master_kantor"),
        ("Hak Akses Role", "Operator & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Modul Master Route mengelola struktur jaringan trayek rute distribusi pos (Feeder, Intercity, Transit Hub). "
                "Setiap rute mendefinisikan titik asal keberangkatan (origin), titik tujuan akhir (destination), "
                "daftar urutan pos perhentian (detail_route waypoints), estimasi jarak tempuh kilometer, durasi menit, "
                "serta matriks cakupan prefix kode pos tujuan pengiriman (1: Jabodetabek, 2: Sumatera, 3: Jateng, dst)."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Master Rute Logistik disusun dalam bentuk kartu akordeon interaktif:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] HEADER & TOOLBAR: Judul (\"Master Rute Logistik & Feeder\") | [🔄 Refresh] | [+ Tambah Rute Baru]     |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] ADD ROUTE FORM BOX (Collapsible): Kode Rute, Nama, Origin, Destination, Coverage Nopend, Prefix Dest|\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [C] SEARCH BAR: Cari Kode Rute (e.g. RTE-1, RT-MALAM) atau Nama Lintasan Trayek                          |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D] ROUTE ACCORDION CARDS LIST (Daftar Rute Expandable)                                                 |\n"
                "| +-----------------------------------------------------------------------------------------------------+ |\n"
                "| | [D1] RTE-1: Rute Feeder Terpadu Cimahi Raya -> SPP Bandung                        [Expand / Collapse]| |\n"
                "| | - Asal: KPRK Cimahi (40511) -> Tujuan: SPP Bandung (40000)                                          | |\n"
                "| | - Total Jarak: 25 km | Estimasi Durasi: 45 min | Destination Prefix: [1] [2] [3] [7] [9]            | |\n"
                "| | --------------------------------------------------------------------------------------------------- | |\n"
                "| | (Saat Di-expand / Dibuka):                                                                          | |\n"
                "| | [Stop 1: 40511 KPRK Cimahi] -> [Stop 2: 40512 Cisangkan] -> [Stop 3: 40514 Melong] -> [40000 SPP]  | |\n"
                "| | - Checkpoints Table: Sequence, Kode Stop, Nama Kantor Pos, Tipe Node, Est Waktu Tiba, Jarak Parsial | |\n"
                "| | - Origin Nopend Coverage Chips: [40511] [40500] [40512] [40514]                                     | |\n"
                "| | - Destination Matrix Badge Explanations: 1: Jabodetabek, 2: Sumatera, 3: Jateng, 7: Kalimantan     | |\n"
                "| | - Action Buttons: [🧪 Uji Simulasi Rute]  |  [✏️ Edit Rute]  |  [🗑️ Hapus]                            | |\n"
                "| +-----------------------------------------------------------------------------------------------------+ |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Header & Toolbar", "Top Header Toolbar", "Menampilkan judul modul, tombol refresh sinkronisasi rute, dan tombol pemicu form tambah rute.", "Data rute aktif", "Tombol '+ Tambah Rute Baru' membuka form drawer pembuat rute baru."),
                ("Kotak [B]: Add Route Form Box", "Collapsible Form Card", "Formulir pendefinisian rute baru: Kode Rute, Nama Rute, Origin Nopen, Destination Nopen, Nopen Asal Yang Dilayani, Filter Prefix Tujuan, Jarak KM, Durasi.", "State `form`", "Penyimpanan struktur data ke koleksi `master_route_nopen` dan segmen ke `detail_route`."),
                ("Kotak [C]: Search Bar", "Input Pencarian", "Memfilter rute berdasarkan kode unik (RTE-1, RTE-2) atau nama koridor lintasan.", "State `searchTerm`", "Penyaringan dinamis instan pada kartu rute."),
                ("Kotak [D1]: Route Accordion Header", "Accordion Title Bar", "Menampilkan Route ID, Nama Rute, Asal -> Tujuan, Total Jarak (KM), Total Durasi (Menit), dan Badge Kategori Prefix Tujuan.", "Dokumen `master_route_nopen`", "Klik baris membuka / menutup rincian seluruh checkpoint perhentian."),
                ("Kotak [D2]: Checkpoints Waypoint Table", "Tabel Checkpoints di dalam Accordion", "Daftar urutan perhentian (Sequence 1 sampai N) dengan kode kantor, nama lokasi, tipe node, estimasi jam tiba, dan jarak tempuh parsial.", "Koleksi `detail_route`", "Memetakan titik singgah fisik pengangkutan kantong pos."),
                ("Kotak [D3]: Coverage & Matrix Badges", "Chips Matriks Cakupan Wilayah", "Menampilkan daftar nopend asal yang dilayani dan pemetaan prefix tujuan (1: Jabodetabek, 2: Sumatera, 3: Jateng, 4: Jabar, 5: Jatim Barat, 7: Kalimantan, dll).", "Atribut `originNopenList` & `destinationPrefixFilter`", "Panduan visual bagi operator untuk memastikan rute yang dipilih menjangkau kota tujuan paket."),
                ("Kotak [D4]: Action Buttons", "Action Button Group", "Menyediakan tombol 'Uji Simulasi Rute', 'Edit Rute', dan 'Hapus Rute'.", "Routing engine", "Tombol 'Uji Simulasi' langsung mengarahkan operator ke halaman Milk Run (/route-journey) dengan rute terpilih.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Algoritma Routing Engine",
            "items": [
                "Pencocokan Otomatis Resi: Backend memeriksa `origin_nopen` resi terhadap `originNopenList` rute dan digit pertama `destination_nopen` terhadap `destinationPrefixFilter`.",
                "Prioritas Trayek: Rute dengan nilai prioritas 1 dieksekusi lebih dahulu dibandingkan rute sekunder (prioritas 2)."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator membuka halaman Master Route Logistik (/route).",
                "2. Operator memperluas akordeon rute untuk meninjau urutan perhentian kantor pos.",
                "3. Operator memverifikasi jarak kilometer dan estimasi menit tempuh antar-kantor cabang.",
                "4. Operator dapat mengklik 'Uji Simulasi Rute' untuk memvalidasi alur muatan barang sebelum jadwal dijalankan."
            ]
        }
    ]
}
pages.append(("06_Routes_Master_Route", page_06))

# ==============================================================================
# PAGE 07: SCHEDULE TEMPLATES (TEMPLATE JADWAL)
# ==============================================================================
page_07 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 7 — SCHEDULE TEMPLATES (TEMPLATE JADWAL TRANSPORTASI)",
    "metadata": [
        ("Nama Modul", "Template Jadwal Transportasi (/template)"),
        ("Kategori Menu", "LOGISTICS / PLANNING"),
        ("Route URL", "/template"),
        ("File Komponen React", "src/pages/TemplateJadwal.jsx"),
        ("Backend API Endpoints", "GET /api/template-jadwal, POST /api/template-jadwal, PUT /api/template-jadwal/:id, DELETE /api/template-jadwal/:id"),
        ("Koleksi MongoDB", "template_jadwal_transportasi, master_kendaraan, master_route_nopen"),
        ("Hak Akses Role", "Operator & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Modul Template Jadwal Transportasi menyimpan pola cetak biru (master blueprint) jadwal perjalanan logistik rutin mingguan. "
                "Template menentukan hari-hari beroperasi dalam sepekan (Senin s/d Minggu), jam keberangkatan standar (ETD), "
                "armada kendaraan acuan, serta rute trayek yang dilayani sebelum di-generate secara massal menjadi Jadwal Harian."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Template Jadwal disusun dalam bentuk kartu pola operasional:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] TOOLBAR: Counter (\"4 template aktif · 5 total pola\")                 |  [+ Tambah Template Baru]    |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] TEMPLATE CARDS LIST                                                                                 |\n"
                "| +-----------------------------------------------------------------------------------------------------+ |\n"
                "| | [B1] Standard Weekday Morning                                                  [Active] [Toggle Switch| |\n"
                "| | - Deskripsi: Pola perjalanan pagi hari kerja untuk kiriman ke SPP Bandung.                          | |\n"
                "| | - Hari Beroperasi: [Sen] [Sel] [Rab] [Kam] [Jum]  (Sab, Min: Abu-abu nonaktif)                      | |\n"
                "| | - Jam Keberangkatan: [06:00 WIB] [10:00 WIB]                                                        | |\n"
                "| | - Armada Default: D 9021 AB  |  Rute: Cimahi -> Bandung SC (Main)                                   | |\n"
                "| | - Tombol Aksi: [✏️ Edit]  |  [🗑️ Hapus]                                                             | |\n"
                "| +-----------------------------------------------------------------------------------------------------+ |\n"
                "| +-----------------------------------------------------------------------------------------------------+ |\n"
                "| | [B2] Afternoon Loop (Soreang Area)                                             [Active] [Toggle Switch| |\n"
                "| | - Hari: [Sen] [Rab] [Jum]  |  Jam: [14:00 WIB]  |  Armada: D 7741 EF  |  Rute: Cimahi -> Soreang Loop| |\n"
                "| +-----------------------------------------------------------------------------------------------------+ |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Toolbar & Counter", "Header Toolbar", "Menampilkan jumlah template aktif versus total pola yang tersimpan dan tombol pemicu form template baru.", "Kalkulasi `templates.filter(t => t.active).length`", "Tombol '+ Tambah Template Baru' membuka modal pembuatan template jadwal."),
                ("Kotak [B1]: Standard Weekday Template Card", "Template Card (Hari Kerja Pagi)", "Pola rutin Senin-Jumat jam 06:00 & 10:00 WIB menggunakan armada D 9021 AB untuk rute Cimahi -> Bandung SC.", "Dokumen template weekday", "Pills hari aktif, pill jam keberangkatan, saklar toggle aktif/nonaktif, tombol edit & hapus."),
                ("Kotak [B2]: Afternoon Loop Template Card", "Template Card (Siang)", "Pola perjalanan sore hari (Senin, Rabu, Jumat) jam 14:00 WIB rute Soreang Loop dengan armada D 7741 EF.", "Dokumen template afternoon", "Pills hari aktif, tombol edit & hapus."),
                ("Kotak [B3]: Weekend Minimal Template Card", "Template Card (Akhir Pekan)", "Pola khusus Sabtu & Minggu jam 08:00 WIB untuk pengantaran kiriman akhir pekan.", "Dokumen template weekend", "Pills hari aktif, tombol edit & hapus."),
                ("Kotak [B4]: Express Peak Seasonal Card", "Template Card (Musiman)", "Pola frekuensi tinggi 5 trip/hari saat musim puncak (Lebaran, Akhir Tahun) dengan status default nonaktif.", "Dokumen template peak", "Saklar toggle aktifkan saat peak season tiba.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Mekanisme Pembangkitan Jadwal",
            "items": [
                "Blueprint Generator: Jadwal Transportasi Harian (/jadwal) dibuat dengan meng-copy konfigurasi template aktif sesuai dengan hari dalam tanggal yang dipilih.",
                "Pemisahan Template & Jadwal Riil: Perubahan pada jadwal tanggal tertentu di lapangan tidak akan merusak master blueprint template."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator membuka halaman Template Jadwal (/template).",
                "2. Operator meninjau hari dan jam keberangkatan rutin pada setiap pola rute.",
                "3. Operator dapat menambah pola rute baru atau mengaktifkan template peak season bila volume kiriman meningkat.",
                "4. Operator beralih ke Jadwal Transportasi (/jadwal) untuk men-generate jadwal aktual bulanan."
            ]
        }
    ]
}
pages.append(("07_Schedule_Templates", page_07))

# ==============================================================================
# PAGE 08: TRANSPORT SCHEDULE (JADWAL TRANSPORTASI)
# ==============================================================================
page_08 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 8 — TRANSPORT SCHEDULE (JADWAL TRANSPORTASI HARIAN)",
    "metadata": [
        ("Nama Modul", "Jadwal Transportasi Harian (/jadwal)"),
        ("Kategori Menu", "LOGISTICS / DISPATCHING"),
        ("Route URL", "/jadwal"),
        ("File Komponen React", "src/pages/JadwalTransportasi.jsx"),
        ("Backend API Endpoints", "GET /api/jadwal, POST /api/jadwal, POST /api/jadwal/generate-bulk, PUT /api/jadwal/:id"),
        ("Koleksi MongoDB", "jadwal_transportasi, master_kendaraan, master_route_nopen"),
        ("Hak Akses Role", "Operator & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Modul Jadwal Transportasi mengelola eksekusi jadwal perjalanan armada logistik aktual pada tanggal tertentu. "
                "Modul ini menyajikan kalender mingguan visual (Timetable Gantt) yang memetakan armada yang bertugas (Plat Nomor), "
                "jam keberangkatan riil (06:00 s/d 18:00 WIB), rute trayek, serta tombol bulk generator untuk membuat jadwal sebulan penuh."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Jadwal Transportasi disusun dalam bentuk matriks kalender mingguan responsif:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] TOOLBAR: [◀]  17 Agt – 23 Agt 2026  [▶]  |  [Progress Bar %]  |  [+ Tambah Trip] | [▶ Generate Jadwal]|\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B] WEEKLY TRANSPORT GANTT / CALENDAR TIMETABLE MATRIX (Responsive Timetable)                           |\n"
                "| +-------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+           |\n"
                "| | JAM   | SEN (17)  | SEL (18)  | RAB (19)  | KAM (20)* | JUM (21)  | SAB (22)  | MIN (23)  |\n"
                "| +-------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+           |\n"
                "| | 06:00 | [B 9910]  | [B 9910]  |           | [B 9910]  | [B 9910]  |           |           |           |\n"
                "| | 07:00 | (Cimahi)  | (Cimahi)  | [B 9910]  | (Cimahi)  | (Cimahi)  |           |           |           |\n"
                "| | 08:00 |           |           |           |           |           | [B 9945]  | [B 9910]  |           |\n"
                "| | 09:00 |           |           |           | [B 9945]  |           |           |           |           |\n"
                "| | 10:00 | [B 9945]  | [D 8990]  |           |           |           |           |           |           |\n"
                "| | 11:00 |           | (SPP Jkt) |           |           | [D 8812]  |           |           |           |\n"
                "| | 13:00 |           |           | [D 8812]  |           | (Soreang) |           |           |           |\n"
                "| | 14:00 | [D 8812]  |           | (Soreang) | [D 8990]  |           |           |           |           |\n"
                "| +-------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+           |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A1]: Week Navigation Controller", "Bilah Navigasi Tanggal (Kiri Toolbar)", "Mengatur navigasi minggu aktif yang ditampilkan (tombol Prev, rentang tanggal 17-23 Agt 2026, tombol Next).", "State `weekOffset`", "Beralih minggu secara instan tanpa reload halaman."),
                ("Kotak [A2]: Bulk Generator Progress Bar", "Progress Bar Animasi (Tengah Toolbar)", "Menampilkan visual persentase proses pembuatan jadwal massal saat tombol generate dijalankan.", "State `generating` & `progress`", "Animasi progress bar halus 0% s/d 100%."),
                ("Kotak [A3]: Action Buttons Toolbar", "Button Action Group (Kanan Toolbar)", "Menyediakan tombol '+ Tambah Jadwal Trip' dan tombol utama '▶ Generate Jadwal Bulanan'.", "Endpoint POST /api/jadwal/generate-bulk", "Memicu generate otomatis jadwal harian dari blueprint template ke koleksi `jadwal_transportasi`."),
                ("Kotak [B1]: Timetable Header (7 Days)", "Header Kolom Kalender", "Menampilkan 7 nama hari (Sen, Sel, Rab, Kam, Jum, Sab, Min) beserta tanggal bulan aktif, hari ini ditandai warna Cyan khusus.", "Array `days`", "Penanda tanggal operasional riil."),
                ("Kotak [B2]: Operating Hours Axis (06:00-18:00)", "Sumbu Jam Vertikal (Kiri Tabel)", "Menampilkan baris slot jam kerja operasional logistik dari jam 06:00 pagi hingga 18:00 sore WIB.", "Array `hours` (6 s/d 18)", "Tinggi cell 52px terstandarisasi untuk kenyamanan visual."),
                ("Kotak [B3]: Trip Schedule Cards Block", "Blok Kartu Trip Berwarna di Grid", "Blok visual yang memuat nomor polisi armada (B 9910 PCX, B 9945 PCY, D 8812 AB, D 8990 SPP), rute perjalanan, dan durasi jam.", "Array `trips` dari database", "Blok berwarna sesuai kode rute (Biru: Cimahi-SPP Bandung, Oranye: Soreang, Navy: Jakarta).")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & Penugasan Armada",
            "items": [
                "Pencegahan Konflik Jadwal: Satu unit armada kendaraan tidak dapat ditugaskan pada dua trip yang memiliki overlap rentang jam keberangkatan.",
                "Integrasi Checker: Jadwal transportasi yang berstatus aktif pada hari ini akan otomatis muncul sebagai referensi jadwal di halaman Checker (/checker)."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator membuka modul Jadwal Transportasi (/jadwal).",
                "2. Operator memilih rentang minggu kerja yang ingin ditinjau atau dikelola.",
                "3. Operator mengklik 'Generate Jadwal Bulanan' untuk mengotomasi jadwal seluruh armada berdasarkan template.",
                "4. Operator dapat menambahkan trip manual tambahan jika ada lonjakan pengiriman tak terjadwal."
            ]
        }
    ]
}
pages.append(("08_Transport_Schedule", page_08))

# ==============================================================================
# PAGE 09: MILK RUN TELEMETRY & EXECUTION
# ==============================================================================
page_09 = {
    "title": "DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN",
    "subtitle": "HALAMAN 9 — MILK RUN TELEMETRY & EXECUTION",
    "metadata": [
        ("Nama Modul", "Milk Run Telemetry & Execution (/route-journey)"),
        ("Kategori Menu", "LOGISTICS / REAL-TIME OPERATIONS"),
        ("Route URL", "/route-journey"),
        ("File Komponen React", "src/pages/RouteJourney.jsx"),
        ("Backend API Endpoints", "GET /api/route-journeys/active, POST /api/route-journeys/start, POST /api/route-journeys/:id/process-stop/:seq, GET /api/kendaraan/capacity/:nopol"),
        ("Koleksi MongoDB", "route_journeys, detail_route, transaksi, master_kantor, master_kendaraan"),
        ("Hak Akses Role", "Operator, Dispatcher, & Super Admin"),
    ],
    "sections": [
        {
            "heading": "1. Deskripsi & Tujuan Utama Modul",
            "content": (
                "Modul Milk Run Telemetry merupakan jantung dari eksekusi perjalanan armada pengumpul logistik multi-stop (feeder pickup run). "
                "Modul ini menangani simulasi dan eksekusi ACID transaction penambahan muatan di setiap kantor pos persinggahan "
                "(Stop 1 sampai Stop 10) secara berurutan, memantau utilisasi beban kg vs daya tampung 1.500 kg, serta mendeteksi stop yang dilewati (skipped)."
            )
        },
        {
            "heading": "2. Tata Letak Halaman (UI Layout & Wireframe)",
            "content": "Struktur tata letak visual halaman Milk Run Telemetry & Execution disusun dalam urutan alur kontrol operasional:",
            "wireframe": (
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [A] TOP HEADER & CONTEXT STRIP                                                                          |\n"
                "| - Judul: \"Visualisasi Rute Milk Run Logistics (Telemetri Armada B 9910 PCX)\"                            |\n"
                "| - Context Chips: Armada [B 9910 PCX] | Shift [MALAM 16.00–21.00] | Tujuan [SPP BANDUNG 40400]           |\n"
                "| - Action Buttons: [▶ Lanjut ke Stop Berikutnya]  |  [🔄 Reset Rute]                                     |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [B1] Current Stop Location        | [B2] Vehicle Load Meter           | [B3] Remaining Capacity         |\n"
                "|      AGEN ARVINET (40395C1)       |      468 kg / 1500 kg (31%)       |      1032 kg Tersedia           |\n"
                "|      Muatan Masuk: +240 kg        |      [||||||||||                ] |      Status: NORMAL AMAN        |\n"
                "+-----------------------------------+-----------------------------------+---------------------------------+\n"
                "| [C] VISUAL MILK RUN SEQUENCE MAP & STEPPER (10 Waypoints Path)                                          |\n"
                "| [1. AGP ONG] -> [2. ARVINET]* -> [3. CICALENGKA] -> [4. CIPARAY] -> [5. MAJALAYA] -> [6. KCP MAJALAYA]  |\n"
                "| -> [7. AGP OMEGA] -> [8. CILEUNYI] -> [9. CINUNUK] -> [10. SPP BANDUNG 40400 (Tujuan Akhir)]            |\n"
                "| (*Node Status Badges: COMPLETED [✓], CURRENT ACTIVE [🚚], WAITING [⏳], SKIPPED [✕])                     |\n"
                "+---------------------------------------------------------------------------------------------------------+\n"
                "| [D] WAYPOINT MANIFEST & ACID LOAD VALIDATION TABLE                                                      |\n"
                "| - Tabel Urutan Stop, Nopend, Nama Kantor, Status Singgah, Muatan Masuk (kg), Kumulatif Beban, Validasi  |\n"
                "+---------------------------------------------------------------------------------------------------------+"
            ),
            "components_table": [
                ("Kotak [A]: Top Header & Controls", "Header Context Strip", "Menampilkan judul modul, informasi armada (B 9910 PCX Gran Max 1.5 Ton), shift kerja (Malam 16.00-21.00 WIB), tujuan akhir, dan tombol eksekusi perjalanan.", "Dokumen `route_journeys` aktif", "Tombol '▶ Lanjut ke [Nama Stop]' memajukan armada ke stop berikutnya, tombol '🔄 Reset Rute' mengembalikan posisi ke titik awal."),
                ("Kotak [B1]: Current Stop Location Card", "Telemetry KPI Card Kiri", "Menampilkan nama kantor pos lokasi armada saat ini berada (e.g. AGEN ARVINET 40395C1) dan jumlah muatan masuk di stop ini (+240 kg).", "Array `stops[currentStopIndex]`", "Memberikan kepastian posisi armada terkini."),
                ("Kotak [B2]: Vehicle Load Meter Card", "Telemetry KPI Card Tengah", "Menghitung total berat muatan yang sedang berada di dalam boks mobil (468 kg / 1500 kg) beserta bar visual persentase utilisasi (31%).", "Field `capacityData.total_berat_terpakai_kg`", "Bar berubah warna dari Hijau (<70%), Kuning (70-90%), hingga Merah (>90%)."),
                ("Kotak [B3]: Remaining Capacity Card", "Telemetry KPI Card Kanan", "Menampilkan sisa daya tampung mobil yang masih aman dimuati paket (1.032 kg) dan status keselamatan beban (NORMAL AMAN).", "Kalkulasi `maxCapacity - currentLoad`", "Memastikan armada tidak mengalami overcapacity."),
                ("Kotak [C]: Visual Milk Run Stepper Track", "Sequential Stepper Path (10 Stop Nodes)", "Memvisualisasikan alur 10 stasiun singgah: 1. AGP Ong (Skipped), 2. Arvinet (Aktif), 3. Cicalengka, 4. Ciparay, 5. Majalaya, 6. KCP Majalaya, 7. AGP Omega (Skipped), 8. Cileunyi, 9. Cinunuk, 10. SPP Bandung (Tujuan Akhir).", "Koleksi `detail_route` & status perjalanan", "Node memiliki penanda status: COMPLETED (Centang Hijau), CURRENT ACTIVE (Truk Bergerak), WAITING (Jam Pasir), SKIPPED (Silang Abu-abu), DESTINATION (Bendera Finis)."),
                ("Kotak [D]: Waypoint Manifest Table", "Tabel Rincian Muatan per Stop", "Tabel rincian beban muatan di setiap perhentian kantor pos, mencakup volume kg paket yang diangkut, akumulasi kargo di mobil, dan status transaksi MongoDB.", "Array `stops` & data kargo", "Transparansi audit muatan di setiap titik singgah rantai pasok pos.")
            ]
        },
        {
            "heading": "3. Aturan Bisnis & ACID Idempotency Transaction",
            "items": [
                "Transaksi Atomik MongoDB: Setiap pemrosesan stop mengeksekusi ACID transaction untuk mengunci dokumen journey dan mengupdate status resi secara atomik.",
                "Penanganan Skip Stop: Sistem otomatis melompati (skip) agen pos yang tidak memiliki paket pickup tanpa menghentikan kelanjutan rute.",
                "Proteksi Idempotensi: Menggunakan Idempotency Key unik untuk mencegah pemrosesan muatan ganda saat koneksi jaringan tidak stabil."
            ]
        },
        {
            "heading": "4. Alur Penggunaan Operator (User Flow)",
            "items": [
                "1. Operator memantau armada B 9910 PCX yang sedang menjalankan rute Pickup Malam.",
                "2. Setiap kali armada tiba dan selesai memuat paket di suatu kantor pos, operator mengklik tombol 'Lanjut ke Stop Berikutnya'.",
                "3. Sistem memperbarui meteran beban muatan (kg) dan memajukan indikator truk pada stepper rute.",
                "4. Saat tiba di SPP Bandung (Stop 10), sistem menandai perjalanan selesai dan siap diproses di Gate Monitoring."
            ]
        }
    ]
}
pages.append(("09_Milk_Run_Telemetry", page_09))

# Generate Batch 2
for name, data in pages:
    md_path = os.path.join(DOCS_DIR, f"{name}.md")
    docx_path = os.path.join(DOCS_DIR, f"{name}.docx")
    write_markdown_file(data, md_path)
    create_docx_for_page(data, docx_path)

print("Batch 2 (05 to 09) completed successfully.")
