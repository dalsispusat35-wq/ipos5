# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 5 — FLEET MANAGEMENT (MASTER KENDARAAN ARMADA)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Master Kendaraan Armada (/kendaraan) |
| **Kategori Menu** | OPERATIONS / MASTER DATA |
| **Route URL** | /kendaraan |
| **File Komponen React** | src/pages/MasterKendaraan.jsx |
| **Backend API Endpoints** | GET /api/kendaraan, POST /api/kendaraan, PUT /api/kendaraan/:id, DELETE /api/kendaraan/:id, GET /api/kendaraan/capacity/:nopol |
| **Koleksi MongoDB** | master_kendaraan, route_journeys, master_route_nopen |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Fleet Management bertanggung jawab mengelola seluruh unit kendaraan operasional angkutan pos (Mobil Box 1.5 Ton, Mobil Box 3.5 Ton, Truk Medium Box 6 Ton, Truk Heavy Box 10 Ton, Blind Van). Modul ini mencatat nomor polisi (Plat Nopol), nama dan kontak driver penanggung jawab, kapasitas muatan maksimum (kg), kantor pangkalan (Home Base), rute default yang ditugaskan, tanggal servis terakhir, serta utilisasi beban muatan real-time.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Master Kendaraan Armada dirancang dalam format fleet grid interaktif:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] TOOLBAR: Counter Armada ("5 armada terdaftar · 5 aktif")               |  [+ Tambah Kendaraan Baru] |
+---------------------------------------------------------------------------------------------------------+
| [B] ADD / EDIT VEHICLE COLLAPSIBLE DRAWER FORM (Kondisional: Muncul saat tombol [+ Tambah] diklik)      |
| - Form Grid: Nopen Asal / Homebase, Plat Nopol, Tipe Armada, Merk/Model, Driver, Rute Default, Max Cap  |
+---------------------------------------------------------------------------------------------------------+
| [C] FLEET CARDS GRID (Visual Vehicle Fleet Grid)                                                        |
| +--------------------------------------+ +--------------------------------------+                       |
| | [C1] B 9910 PCX — Gran Max Box       | | [C2] B 9945 PCY — Isuzu Traga Box    |                       |
| | - Tipe: Mobil Box (1.5 Ton)          | | - Tipe: Mobil Box (3.5 Ton)          |                       |
| | - Driver: Supriatna                  | | - Driver: Ahmad Hidayat              |                       |
| | - Home Base: 40395C1 - KCP Cililin   | | - Home Base: 40000 - KCU Bandung     |                       |
| | - Rute: RT-MALAM-B9910-PCX           | | - Rute: RT-MALAM-B9945-PCY-PU1       |                       |
| | - Muatan: [||||||||||  ] 468/1500 kg | | - Muatan: [||||||||||||] 1225/3500 kg|                       |
| | - Status: [Active] | Servis: 22 Jul  | | - Status: [Active] | Servis: 22 Jul  |                       |
| | - Tombol: [🔍 Detail & Telemetri]    | | - Tombol: [🔍 Detail & Telemetri]    |                       |
| +--------------------------------------+ +--------------------------------------+                       |
| +--------------------------------------+ +--------------------------------------+                       |
| | [C3] D 8812 AB — Isuzu Elf Long Box  | | [C4] D 8990 SPP — Fuso Heavy Box     |                       |
| | - Tipe: Truk Medium Box (6 Ton)      | | - Tipe: Truk Heavy Box (10 Ton)      |                       |
| | - Muatan: [||||||||    ] 2100/6000 kg| | - Muatan: [||||||      ] 3120/10000kg|                       |
| | - Tombol: [🔍 Detail & Telemetri]    | | - Tombol: [🔍 Detail & Telemetri]    |                       |
| +--------------------------------------+ +--------------------------------------+                       |
+---------------------------------------------------------------------------------------------------------+
| [D] VEHICLE DETAIL & TELEMETRY MODAL (`VehicleDetailModal.jsx`)                                         |
| - Profil Lengkap Kendaraan, Kapasitas Muatan Real-time, Driver Phone, History Perjalanan Hari Ini       |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Toolbar & Counter** | Header Toolbar | Menampilkan jumlah total armada terdaftar dan armada yang berstatus aktif siap jalan. | Kalkulasi `vehicles.length` & status aktif | Tombol '+ Tambah Kendaraan Baru' membuka form drawer penambahan unit mobil. |
| **Kotak [B]: Add/Edit Vehicle Form Drawer** | Collapsible Form Drawer Card | Formulir input data kendaraan: Nopen Home Base, Plat Nopol, Jenis Mobil, Merk/Model, Driver, Rute Default, dan Kapasitas Maksimum (kg). | State `form` | Validasi keunikan nomor polisi dan penyimpanan ke koleksi MongoDB `master_kendaraan`. |
| **Kotak [C1 - C4]: Visual Fleet Cards Grid** | Responsive Cards Grid Layout | Kartu identitas kendaraan lengkap dengan plat nomor, merk, nama driver, kantor pangkalan, rute trayek, progress bar muatan terpakai, dan tanggal servis. | Koleksi `master_kendaraan` digabung dengan `getVehicleCapacity` | Progress bar kapasitas dinamis (Hijau/Kuning/Merah), tombol 'Detail & Telemetri' membuka modal rincian kargo. |
| **Kotak [D]: Vehicle Detail & Telemetry Modal** | Modal Pop-up Mengambang | Menampilkan detail mendalam profil mobil, kontak telepon driver, riwayat muatan kargo resi, dan posisi koordinat GPS terkini. | Komponen `VehicleDetailModal.jsx` | Operator dapat memverifikasi paket yang dibawa mobil dan melakukan panggilan telepon cepat ke pengemudi. |

## 3. Aturan Bisnis & Kapasitas Beban

- Ambang Batas Muatan: Maksimum kapasitas muatan (Gran Max: 1.500 kg, Traga: 3.500 kg, Elf: 6.000 kg, Fuso: 10.000 kg) menjadi pembagi persentase beban di Checker dan Milk Run.
- Pencegahan Overcapacity: Sistem memberikan peringatan visual merah jika akumulasi paket melebihi batas daya tampung kendaraan.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator membuka halaman Master Kendaraan Armada (/kendaraan).
- 2. Operator memantau keterisian muatan masing-masing mobil melalui indikator progress bar.
- 3. Operator mengklik tombol 'Detail & Telemetri' untuk memeriksa daftar muatan kargo di dalam mobil.
- 4. Operator dapat mendaftarkan unit armada baru atau memperbarui status perawatan rutin berkala.
