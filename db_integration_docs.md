# 📦 IPOS5 — Dokumentasi Integrasi & Skema Field Database MongoDB

> **Database**: `ipos5_reporting`  
> **Server**: `192.168.5.219:27017` (Primary MongoDB Remote)  
> **Auth**: `mongodb://Valdric:****@192.168.5.219:27017/ipos5_reporting?authSource=admin`  
> **Koneksi diatur di**: [`connections.json`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/config/connections.json) → dikelola oleh [`DbConnection.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/config/DbConnection.js)

---

## 🗃️ Daftar Koleksi MongoDB (Collections)

| Nama Koleksi | Deskripsi Utama | Dipakai Di |
|---|---|---|
| `transaksi` | Data paket / connote kiriman | Checker, Transaksi, Manifest, Gate, Dashboard |
| `master_kendaraan` | Data armada mobil operasional | Checker, Fleet, Gate Monitoring |
| `master_kantor` | Data kantor / nopend / KC-KC | Checker, Dashboard, Semua lookup kantor |
| `detail_route` | Waypoint stop-stop per rute | Checker, Route Journey, Estimasi |
| `master_route_nopen` | Header rute operasional | Checker, Route Journey, Jadwal, Estimasi |
| `route_journeys` | Perjalanan aktif per kendaraan per tanggal | Checker, Route Journey, Estimasi |
| `jadwal_transportasi` | Jadwal pickup/transport harian | Jadwal Pickup, Jadwal Transportasi, Checker |
| `template_jadwal_transportasi` | Template jadwal default per rute | Jadwal, Template |
| `manifests` (`manifest_master` & `manifest_detail`) | Data manifest kantong kiriman | Transaksi / Manifest controller |
| `tracking_events` | Event log tracking per paket | Checker (timeline) |
| `users` | Data akun pengguna sistem | Login, Profil, Manajemen User |
| `master_produk` | Katalog layanan & produk Pos | Master Produk |

---

## 🖥️ Halaman Web & Koleksi MongoDB Yang Dipakai

---

### 1. 🔐 Halaman Login (`/login`)
**File**: [`Login.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/Login.jsx)  
**API Endpoint**: `POST /api/auth/login`  
**Controller**: [`AuthController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/AuthController.js)

| Koleksi MongoDB | Operasi | Data Yang Diambil |
|---|---|---|
| `users` | `findOne({ username })` | Username, password_hash, role, nama, NIP, branch |

> **Catatan**: Ada fallback user bawaan (`admin/admin`, `sari/sari`, `operator/operator`) jika database offline.

---

### 2. 📊 Halaman Dashboard (`/`)
**File**: [`Dashboard.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/Dashboard.jsx)  
**API Endpoint**: `GET /api/dashboard-stats`  
**Controller**: [`TransactionController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/TransactionController.js) → `getDashboardStats()`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `transaksi` | `aggregate / count` | Statistik paket: total, in-transit, delivered, entry |
| `master_kendaraan` | `find({})` | Jumlah armada aktif |
| `route_journeys` | `find({ status: 'IN_PROGRESS' })` | Jumlah perjalanan aktif hari ini |
| `master_kantor` | `find({})` | Jumlah kantor terdaftar |

---

### 3. 🔍 Halaman Package Tracking / Checker (`/checker`)
**File**: [`Checker.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/Checker.jsx)  
**API Endpoints**:
- `GET /api/checker/:connoteOrNopol?date=YYYY-MM-DD` — utama tracking
- `GET /api/kendaraan?limit=100` — load fleet list panel

**Controllers**:
- [`TransactionController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/TransactionController.js) → `checkRouting()`
- [`KendaraanController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/KendaraanController.js)

#### Saat mencari **Nomor Resi / Connote**:

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan di UI |
|---|---|---|
| `transaksi` | `findOne({ connote_code })` | Berat, layanan, pengirim, penerima, asal, tujuan, status |
| `master_kantor` | `find({ nopend: [...] })` | Nama kantor asal & tujuan |
| `master_route_nopen` | `find({ nopen_asal })` | Rute yang cocok untuk paket |
| `detail_route` | `find({ route_id, asal_nopen/tujuan_nopen })` | Waypoints / stop rute |
| `jadwal_transportasi` | `findOne({ asal, tujuan, tanggal })` | Jadwal kendaraan yang relevan |
| `template_jadwal_transportasi` | `findOne({ ... })` | Fallback template jadwal |
| `master_kendaraan` | `findOne({ kendaraan_id })` | Info kendaraan yang dijadwalkan |
| `route_journeys` | `findOne({ cargo.connote_code })` | Journey aktif yang memuat paket ini |
| `tracking_events` | `find({ connote_code })` | Timeline event tracking (ENTRY → IN_TRANSIT → DELIVERED) |

#### Saat mencari **Plat Nomor Kendaraan** (mode armada):

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan di UI |
|---|---|---|
| `master_kendaraan` | `find({})` → normalisasi nopol | Profil armada: driver, jenis, kapasitas, home base, rute |
| `route_journeys` | `findOne({ vehicle_nopol, journey_date })` | Journey & cargo aktif hari ini |
| `detail_route` | `find({ route_id, status: 'AKTIF' })` | Waypoints multi-stop route stepper |
| `master_kantor` | `find({ nopend: [...stopCodes] })` | Nama kantor per stop di stepper |

#### List Fleet Mobil Panel (saat klik tab "List Fleet"):

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan di UI |
|---|---|---|
| `master_kendaraan` | `find({})` (via `GET /api/kendaraan`) | Kartu armada: nopol, driver, jenis, max_capacity_kg, rute, home_base |

#### Import CSV Harian (Tool Testing):

| Koleksi MongoDB | Operasi |
|---|---|
| `transaksi` | `insertMany / updateMany` — data paket dari CSV |
| `route_journeys` | `updateOne` — cargo ditambahkan ke journey aktif |

---

### 4. 🏢 Halaman Master Kantor (`/kantor`)
**File**: [`MasterKantor.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/MasterKantor.jsx)  
**API**: `GET/POST/PUT/DELETE /api/kantor`  
**Controller**: [`KantorController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/KantorController.js)  
**Model**: [`KantorModel.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/models/KantorModel.js) → koleksi `master_kantor`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `master_kantor` | `find, findOne, insertOne, updateOne, deleteOne` | Daftar kantor: nopend, nama, kota, tipe (KCU/KCP/AGP/SPP) |

---

### 5. 🚛 Halaman Fleet / Kendaraan (`/fleet`)
**File**: [`MasterKendaraan.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/MasterKendaraan.jsx)  
**API**: `GET/POST/PUT/DELETE /api/kendaraan`  
**Controller**: [`KendaraanController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/KendaraanController.js)  
**Model**: [`KendaraanModel.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/models/KendaraanModel.js) → koleksi `master_kendaraan`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `master_kendaraan` | `find, findOne, insertOne, updateOne, deleteOne` | List armada, detail kendaraan |
| `master_route_nopen` | `find({ route_id })` | Rute yang ditugaskan per kendaraan |
| `detail_route` | `find({ route_id })` | Waypoints rute per kendaraan |
| `master_kantor` | `find({ nopend })` | Nama kantor stop rute |
| `transaksi` | `find({ vehicle_nopol })` | Daftar transaksi per armada |
| `route_journeys` | `findOne({ vehicle_nopol, journey_date })` | Utilisasi kapasitas real-time |

---

### 6. 🛤️ Halaman Routes (`/routes`)
**File**: [`MasterRoute.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/MasterRoute.jsx)  
**API**: `GET/POST/PUT/DELETE /api/route`, `GET /api/detail-route`  
**Controllers**: [`RouteController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/RouteController.js), [`DetailRouteController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/DetailRouteController.js)  
**Models**: `RouteModel.js` → `master_route_nopen`, `DetailRouteModel.js` → `detail_route`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `master_route_nopen` | `find, insertOne, updateOne, deleteOne` | List rute operasional |
| `detail_route` | `find({ route_id }), insertOne, updateOne` | Waypoints / segmen per rute (seq, asal_nopen, tujuan_nopen) |

---

### 7. 📅 Halaman Schedule Templates (`/schedule-templates`)
**File**: [`TemplateJadwal.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/TemplateJadwal.jsx)  
**Model**: `TemplateModel.js` → koleksi `template_jadwal_transportasi`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `template_jadwal_transportasi` | `find, insertOne, updateOne, deleteOne` | Template jadwal default per rute kendaraan |

---

### 8. 🗓️ Halaman Transport Schedule (`/jadwal-transportasi`)
**File**: [`JadwalTransportasi.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/JadwalTransportasi.jsx)  
**Model**: `JadwalModel.js` → koleksi `jadwal_transportasi`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `jadwal_transportasi` | `find, insertOne, updateOne, deleteOne` | Jadwal transportasi per tanggal operasional |
| `master_kendaraan` | `findOne` | Data kendaraan terjadwal |
| `master_route_nopen` | `findOne` | Rute yang dijadwalkan |

---

### 9. 🚗 Halaman Milk Run Telemetry / Route Journey (`/route-journey`)
**File**: [`RouteJourney.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/RouteJourney.jsx)  
**API**: `GET /api/route-journeys/active`, `POST /api/route-journeys/:id/stops/:seq/process`  
**Controller**: [`RouteJourneyController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/RouteJourneyController.js)  
**Model**: [`RouteJourneyModel.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/models/RouteJourneyModel.js) → koleksi `route_journeys`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `route_journeys` | `find/findOne/updateOne` | Status perjalanan aktif, cargo list, current_stop_seq |
| `master_kendaraan` | `findOne({ nopol })` | Info armada & kapasitas |
| `detail_route` | `find({ route_id, status: 'AKTIF' })` | Waypoints rute aktif |
| `master_kantor` | `find({ nopend })` | Nama lokasi tiap stop |
| `transaksi` | `find({ connote_code })` | Paket yang ada di cargo |

---

### 10. 📈 Halaman Estimasi Milk Run (`/estimasi-milk-run`)
**File**: [`EstimasiMilkRun.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/EstimasiMilkRun.jsx)  
**API**: `GET /api/estimasi-milk-run/...`  
**Controller**: [`EstimasiController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/EstimasiController.js)

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `master_kendaraan` | `find({})` | Daftar kendaraan untuk estimasi |
| `route_journeys` | `findOne({ vehicle_nopol, journey_date })` | Journey aktif per kendaraan |
| `detail_route` | `find({ route_id })` | Stop-stop rute estimasi |
| `master_kantor` | `find({ nopend })` | Nama kantor stop |
| `transaksi` | `find({ vehicle_nopol / cargo })` | Paket dalam hitungan estimasi berat |

> **Catatan**: Halaman ini juga memiliki data kendaraan default (hardcoded fallback) di `EstimasiController.js` untuk mode demo/presentasi akademik.

---

### 11. 🚪 Halaman Gate Monitoring (`/gate-monitoring`)
**File**: [`GateMonitoring.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/GateMonitoring.jsx)  
**API**: `GET /api/transaksi?...`  
**Controller**: [`TransactionController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/TransactionController.js)

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `transaksi` | `find({ state: 'ENTRY' / 'IN_TRANSIT' })` | Paket yang masuk / keluar gate |
| `master_kantor` | `find({ nopend })` | Nama kantor asal/tujuan paket |
| `master_kendaraan` | `findOne({ nopol })` | Info armada pengangkut |

---

### 12. 📦 Halaman Transaksi (`/transaksi`)
**File**: [`Transaksi.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/Transaksi.jsx)  
**API**: `GET /api/transaksi`, `GET /api/manifests`  
**Controllers**: `TransactionController.js`, `ManifestController.js`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `transaksi` | `find({ filters }), aggregate` | List semua transaksi kiriman dengan filter |
| `manifests` | `find / findOne` | Data manifest pengiriman |
| `master_kantor` | `find` | Lookup nama kantor |
| `route_journeys` | `find` | Journey terkait manifest |

---

### 13. 🛍️ Halaman Produk (`/produk`)
**File**: [`MasterProduk.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/MasterProduk.jsx)  
**Model**: `ProdukModel.js` → koleksi `master_produk`

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `master_produk` | `find, insertOne, updateOne, deleteOne` | Daftar layanan / produk pos (Reguler, Kilat, Express) |

---

### 14. 👤 Halaman Profil & User Management (`/profil`)
**File**: [`Profile.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/Profile.jsx)  
**API**: `GET/POST/PUT/DELETE /api/users`  
**Controller**: [`UserController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/UserController.js)

| Koleksi MongoDB | Operasi | Data Yang Ditampilkan |
|---|---|---|
| `users` | `find, insertOne, updateOne (password_hash, profile), deleteOne` | Manajemen akun: username, nama, role, NIP, cabang |

---

### 15. ⚙️ Database Viewer / Compass (`/settings` atau `/compass`)
**File**: [`Compass.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/Compass.jsx), [`Settings.jsx`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/client/src/pages/Settings.jsx)  
**Controller**: [`CompassController.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/controllers/CompassController.js)

| Koleksi MongoDB | Operasi |
|---|---|
| **Semua koleksi** | `listCollections, find, insertOne, updateOne, deleteOne` — UI admin untuk browse & edit dokumen langsung |

---

## 📋 Spesifikasi Rinci Skema Field Per Koleksi MongoDB (12 Koleksi)

---

### 1. Koleksi `transaksi` (Data Paket / Connote Kiriman)
Koleksi ini menyimpan seluruh data transaksi pengiriman barang/paket di sistem Pos Indonesia.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId / String | `ObjectId("66b9d...")` | Identifier unik dokumen MongoDB. | Kunci internal dokumen di MongoDB Viewer (`/compass`). |
| `connote_code` | String | `"P20260724000001"` | Nomor resi / connote utama pengiriman. | Input pencarian di `/checker`, Kolom Resi tabel `/transaksi`, ID kargo di modal `/route-journey` & `/gate-monitoring`. |
| `connote.connote_code` | String | `"P20260724000001"` | Duplicate alias nomor resi (sub-dokumen). | Matching resi pada query legacy `findByConnoteCode()` di `TransactionModel.js`. |
| `connote.connote_booking_code` | String | `"BK-P20260724000001"` | Kode booking transaksi dari aplikasi asal (PosAja/iPOS). | Tampil sebagai **Booking Code** di modal detail resi `/checker` & `/transaksi`. |
| `connote.connote_service` | String | `"Pos Reguler"`, `"Pos Express"` | Nama layanan pengiriman pos. | Badge Jenis Layanan (Kuning/Biru) di `/checker` & filter dropdown layanan di `/transaksi`. |
| `connote.connote_amount` | Number | `35000` | Biaya / ongkos kirim paket (IDR). | Kolom **Biaya Kirim** pada tabel transaksi `/transaksi` & rincian tarif di `/checker`. |
| `connote.actual_weight` | Number | `25.5` | Berat fisik riil paket dalam satuan Kilogram (kg). | Dipakai menghitung `current_load_kg` & persen muatan armada di `/checker`, `/route-journey`, dan `/estimasi-milk-run`. |
| `connote.connote_state` | String | `"ENTRY"`, `"IN_TRANSIT"`, `"DELIVERED"` | Status siklus keberadaan fisik paket. | Badge Warna Status di `/checker` (Biru: ENTRY, Kuning: IN_TRANSIT, Hijau: DELIVERED) & Ringkasan Stats di `/` (Dashboard). |
| `connote.connote_sender_name` | String | `"PT Pos Logistics Store"` | Nama lengkap pihak pengirim paket. | Kartu **Detail Pengirim** di `/checker` & kolom Pengirim di tabel `/transaksi`. |
| `connote.connote_receiver_name` | String | `"SPP Bandung Hub"` | Nama lengkap pihak penerima paket. | Kartu **Detail Penerima** di `/checker` & kolom Penerima di tabel `/transaksi`. |
| `connote.connote_receiver_address` | String | `"Jl. Soekarno Hatta No. 564, Bandung"` | Alamat lengkap tujuan pengantaran. | Tampilan Alamat Penerima pada modal detail resi di `/checker`. |
| `connote.created_at` | String / Date | `"24/07/2026 08:00"` | Tanggal dan waktu transaksi dibuat di loket pos. | Info **Tanggal Dibuat** di header hasil pencarian `/checker` & tabel `/transaksi`. |
| `location_data_created.location_name` | String | `"Kantor 40511"` | Nama lokasi loket pembuatan transaksi. | Label lokasi asal pada header tracking `/checker`. |
| `location_data_created.custom_field.nopen` | String | `"40511"` | Kode Nopend kantor pos lokasi pembuatan. | Digunakan backend routing engine untuk memetakan titik asal rute di `/checker`. |
| `custom_field.origin_nopen` | String | `"40511"` | Kode Nopend kantor pos pengirim (Origin). | Titik asal A pada Stepper Rute `/checker` & pencocokan rute feeder. |
| `custom_field.destination_nopen` | String | `"40400"` | Kode Nopend kantor pos tujuan (Destination). | Titik tujuan B pada Stepper Rute `/checker` & pencocokan rute tujuan. |
| `createdAt` | Date | `2026-07-24T08:00:00Z` | Timestamp pembuatan dokumen MongoDB. | Sorting transaksi terbaru di tabel `/transaksi`. |

---

### 2. Koleksi `master_kendaraan` (Data Armada Logistik)
Koleksi ini menyimpan profil armada kendaraan fisik operasional milik Pos Indonesia.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66b9e...")` | Identifier unik dokumen MongoDB. | Kunci internal dokumen. |
| `kendaraan_id` | String | `"VH-B9910PCX"` | Kode unik identifier armada kendaraan. | Relasi ke `template_jadwal_transportasi` & pilihan dropdown ID di `/fleet`. |
| `nopol` | String | `"B 9910 PCX"` | Plat nomor polisi kendaraan (Plat No). | Kunci pencarian di `/checker` (Tab List Fleet), Judul Kartu Armada di `/fleet`, `/route-journey`, `/estimasi-milk-run`. |
| `nama_kendaraan` | String | `"Daihatsu Gran Max Box - Feeder Express"` | Nama deskriptif lengkap kendaraan. | Subtitle header kendaraan di `/fleet` & modal detail armada di `/route-journey`. |
| `jenis_kendaraan` | String | `"MOBIL BOX INTERCITY (1.5 TON)"` | Klasifikasi jenis & tipe bodi kendaraan. | Badge Tipe Mobil di `/fleet` & kartu fleet panel `/checker`. |
| `kapasitas_ton` | Number | `1.5` | Kapasitas daya angkut maksimal (Ton). | Spesifikasi teknik pada kartu detail armada `/fleet`. |
| `max_capacity_kg` | Number | `1500` | Kapasitas angkut maksimum dalam kg (Denominator). | Pembagi rumus % Utilisasi Beban (`(load/max)*100`) di `/checker`, `/route-journey`, `/estimasi-milk-run`. Mengatur warna Gauge (Hijau <70%, Kuning 70-90%, Oranye 90-100%, Merah >100%). |
| `driver` | String | `"Ahmad Supriadi"` | Nama pengemudi / driver penanggung jawab. | Informasi Driver di kartu `/fleet`, modal `/route-journey`, & info armada `/checker`. |
| `driver_phone` | String | `"0812-9876-54321"` | Nomor kontak WhatsApp/telepon pengemudi. | Tombol Hubungi Driver pada modal detail armada di `/fleet` & `/route-journey`. |
| `status` | String | `"AKTIF"`, `"PERBAIKAN"` | Status kelayakan operasional kendaraan. | Badge Status (Hijau: AKTIF, Merah: PERBAIKAN) di `/fleet` & filter ketersediaan armada. |
| `home_base` | String | `"40511 - KCU Cimahi"` | Kantor pangkalan / garasi asal armada. | Kolom Home Base di `/fleet` & lokasi pangkalan awal pada pencarian armada `/checker`. |
| `rute_utama` / `assigned_route_id` | String | `"RT-MALAM-B9910-PCX"` | ID rute utama yang ditugaskan ke armada. | Auto-select rute trayek saat armada dipilih di `/route-journey`, `/jadwal-transportasi`, & `/estimasi-milk-run`. |

---

### 3. Koleksi `master_kantor` (Data Kantor Pos / Node Nopend)
Koleksi ini menyimpan master data seluruh kantor pos, KCU, KCP, SPP, dan Agen Pos di Indonesia.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66b9f...")` | Identifier unik dokumen. | Internal MongoDB. |
| `nopend` | String | `"40511"`, `"40400"` | Nomor Pendirian / Kode Unik Kantor Pos (5 digit). | **Primary Key Lookup**: Digunakan seluruh halaman (`/checker`, `/kantor`, `/routes`, `/route-journey`) untuk memetakan kode ke nama kantor. |
| `nama_nopend` | String | `"KCU Cimahi"`, `"SPP Bandung"` | Nama resmi kantor pos. | Label Nama Lokasi pada Stepper Rute di `/checker`, header stop `/route-journey`, & kolom Nama Kantor di `/kantor`. |
| `nopen_kc_kcu` | String | `"40500"` | Kode Nopend KCU pembina / kantor utama. | Hierarki pengelompokan kantor cabang di bawah KCU pada halaman `/kantor`. |
| `kdregional` | String | `"05"` | Kode Regional Wilayah Pos Indonesia. | Filter Wilayah Regional (Regional 5 Jabar) pada tabel `/kantor`. |
| `tipe` | String | `"KCU"`, `"KCP"`, `"SPP"`, `"AGEN"` | Jenis/klasifikasi peran kantor pos. | Badge Tipe Kantor di `/kantor` & Ikon titik stop pada Stepper Rute `/checker` (Ikon Hub SPP vs Kantor Cabang). |
| `status` | String | `"AKTIF"` | Status operasional kantor pos. | Filter kantor aktif di `/kantor`. |

---

### 4. Koleksi `master_route_nopen` (Header Rute Statis Operasional)
Koleksi ini menyimpan definisi header rute trayek perjalanan pos.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66ba0...")` | Identifier unik dokumen. | Internal MongoDB. |
| `route_id` | String | `"RT-MALAM-B9910-PCX"` | Kode ID unik rute trayek. | Kunci relasi dengan `detail_route`, dropdown rute di `/routes`, `/fleet`, `/jadwal-transportasi`, `/route-journey`. |
| `nama_route` | String | `"Rute Malam Feeder Cimahi -> SPP Bandung"` | Nama lengkap rute trayek. | Judul Utama Rute pada tabel `/routes`, header Stepper `/checker` & `/route-journey`. |
| `nopen_asal` | String | `"40511"` | Kode Nopend kantor titik keberangkatan awal (Origin). | Teks Origin pada kartu `/routes` & filter rute berdasarkan titik awal di `/checker`. |
| `nama_asal` | String | `"KCU Cimahi (40511)"` | Nama kantor asal keberangkatan. | Label lokasi asal rute di `/routes` & `/checker`. |
| `nopen_tujuan` | String | `"40400"` | Kode Nopend kantor titik tujuan akhir (Destination). | Teks Destination pada kartu `/routes` & filter rute tujuan di `/checker`. |
| `nama_tujuan` | String | `"SPP Bandung (40400)"` | Nama kantor tujuan akhir. | Label lokasi tujuan rute di `/routes` & `/checker`. |
| `kodeMile` | String | `"FIRST_MILE"`, `"MIDDLE_MILE"` | Kategori tahapan distribusi logistik. | Badge Warna Mile Category (First Mile = Hijau, Middle Mile = Biru, Last Mile = Ungu) di `/routes` & `/checker`. |
| `deskripsi_produk` | String | `"Pos Reguler & Express Pickup Malam"` | Keterangan jenis muatan produk di rute. | Kolom Deskripsi di tabel `/routes`. |
| `prioritas` | Number | `1`, `2` | Tingkat prioritas pemilihan rute. | Dipakai algoritma backend `checkRouting()` untuk memilih rute paling utama saat pencarian resi di `/checker`. |
| `status_route` | String | `"LENGKAP"` | Status kelengkapan struktur rute. | Badge status kelengkapan data rute di `/routes`. |
| `aktif` | String | `"Y"`, `"N"` | Flag keaktifan rute operasional. | Toggle status Aktif/Nonaktif di modal `/routes`. |

---

### 5. Koleksi `detail_route` (Waypoint / Stop Segmen Rute)
Koleksi ini menyimpan urutan titik-titik persinggahan (stop/waypoint) per segmen pada suatu rute.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66ba1...")` | Identifier unik dokumen. | Internal MongoDB. |
| `detail_route_id` | String | `"DR-B9910-01"` | ID unik per titik segmen rute. | Referensi internal editing waypoint di `/routes`. |
| `route_id` | String | `"RT-MALAM-B9910-PCX"` | ID rute induk pemegang waypoint. | Foreign Key ke `master_route_nopen`. backend menarik seluruh waypoint rute ini untuk menyusun Stepper di `/checker` & `/route-journey`. |
| `seq` | Number | `1`, `2`, `3`, `4`, `5` | Nomor urut persinggahan (Sequence Stop). | Menentukan urutan nomor lingkaran (Stop 1, Stop 2, dst) pada Stepper Rute di `/checker` & `/route-journey`. |
| `asal_nopen` | String | `"40511"` | Kode Nopend kantor awal segmen ini. | Label asal segmen waypoint di Stepper `/checker`. |
| `asal_nama` | String | `"KCU Cimahi"` | Nama kantor asal segmen ini. | Teks nama kantor pada node Stepper `/checker`. |
| `tujuan_nopen` | String | `"40521"` | Kode Nopend kantor tujuan segmen ini. | Label tujuan segmen waypoint di Stepper `/checker`. |
| `tujuan_nama` | String | `"KCP Cimahi Selatan"` | Nama kantor tujuan segmen ini. | Teks nama kantor persinggahan pada node Stepper di `/checker` & `/route-journey`. |
| `estimasi_menit` | Number | `12`, `25` | Waktu tempuh segmen dalam menit. | Menampilkan durasi antar-stop (e.g. "⏱️ 12 min") pada garis Stepper `/checker` & total ETA di `/estimasi-milk-run`. |
| `jarak_km` | Number | `5.2`, `8.5` | Jarak fisik segmen dalam Kilometer (km). | Menampilkan jarak antar-stop (e.g. "📏 5.2 km") pada garis Stepper `/checker` & akumulasi total KM rute di `/routes`. |
| `status` | String | `"AKTIF"` | Status keaktifan segmen waypoint. | Filter waypoint aktif di `/routes`. |

---

### 6. Koleksi `route_journeys` (Perjalanan Harian Armada & Kargo Telemetri)
Koleksi ini menyimpan data instans perjalanan operasional harian armada fisik beserta kargo muatan di dalamnya.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66ba2...")` | Identifier unik dokumen. | Internal MongoDB. |
| `journey_id` | String | `"JRN-20260724-B9910PCX-001"` | Kode unik transaksi perjalanan operasional armada. | Header utama halaman `/route-journey`, parameter URL API, & log audit operasional. |
| `vehicle_nopol` | String | `"B 9910 PCX"` | Plat nomor armada yang menjalankan journey. | Matching journey dengan armada di `/checker` & `/route-journey`. |
| `route_id` | String | `"RT-MALAM-B9910-PCX"` | ID rute yang sedang ditempuh. | Menentukan daftar waypoints yang ditampilkan pada Stepper Live `/route-journey`. |
| `status` | String | `"IN_PROGRESS"`, `"COMPLETED"` | Status eksekusi perjalanan armada. | Badge Warna Status di `/route-journey` & `/checker` (Kuning: IN_PROGRESS, Hijau: COMPLETED) & statistik aktif di `/` (Dashboard). |
| `current_stop_seq` | Number | `1`, `2`, `3` | Nomor urut stop tempat armada saat ini berada/terakhir singgah. | **Penggerak Stepper Live**: Mengatur status node di `/checker` & `/route-journey` (`seq < current_stop_seq` → COMPLETED/Centang Hijau, `seq === current_stop_seq` → CURRENT/Mobil Berkedip, `seq > current_stop_seq` → UPCOMING/Abu-abu). |
| `maximum_capacity_kg` | Number | `1500` | Batas maksimum muatan mobil (kg). | Pembagi persen muatan pada Gauge Meter `/route-journey`. |
| `current_load_kg` | Number | `619.0` | Total berat muatan paket aktif yang ada di atas mobil (kg). | Meter Utilisasi Muatan Real-time di `/route-journey` & `/checker`. |
| `shift` | String | `"MALAM"`, `"SIANG"` | Shift jadwal kerja operasional. | Badge Shift di header `/route-journey`. |
| `tanggal_operasional` | Date / String | `"2026-07-24"` | Tanggal pelaksanaan perjalanan. | Picker Filter Tanggal di `/checker` & `/route-journey`. |
| `cargo` | Array of Objects | `[{ connote_code: "P...", weight_kg: 25.5 }]` | List paket/barang yang dimuat di dalam armada. | Tabel **Kargo Aktif Dalam Mobil** di `/route-journey` & detail muatan armada saat pencarian nopol di `/checker`. |
| `cargo[].connote_code` | String | `"P20260724000001"` | Resi paket di dalam muatan armada. | Kolom Resi di tabel kargo `/route-journey`. |
| `cargo[].weight_kg` | Number | `25.5` | Berat paket individu (kg). | Kolom Berat Paket di tabel kargo `/route-journey`. |
| `cargo[].origin_nopen` | String | `"40511"` | Kode Nopend kantor asal muat paket. | Kolom Asal Kargo di `/route-journey`. |
| `cargo[].destination_nopen` | String | `"40400"` | Kode Nopend kantor tujuan bongkar paket. | Kolom Tujuan Kargo di `/route-journey`. |
| `cargo[].loaded_at_seq` | Number | `1` | Stop sequence tempat paket di-LOAD ke mobil. | Log urutan muat kargo di `/route-journey`. |
| `cargo[].unloaded_at_seq` | Number | `6` | Stop sequence tempat paket akan di-UNLOAD dari mobil. | Log urutan bongkar kargo di `/route-journey`. |

---

### 7. Koleksi `jadwal_transportasi` (Jadwal Operasional Harian)
Koleksi ini menyimpan jadwal perjalanan harian armada per tanggal operasional.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66ba3...")` | Identifier unik dokumen. | Internal MongoDB. |
| `jadwal_id` | String | `"SCH-20260724-001"` | Kode unik record jadwal harian. | Referensi internal tabel `/jadwal-transportasi`. |
| `route_id` | String | `"RT-MALAM-B9910-PCX"` | ID rute yang dijadwalkan. | Kolom Rute di `/jadwal-transportasi` & matching jadwal di `/checker`. |
| `nomor_polisi` / `nopol` | String | `"B 9910 PCX"` | Plat nomor armada yang ditugaskan. | Kolom Armada / Plat No di `/jadwal-transportasi` & `/checker`. |
| `tanggal` | String / Date | `"2026-07-24"` | Tanggal berlakunya jadwal operasional. | Filter Tanggal di halaman `/jadwal-transportasi`. |
| `jam_berangkat` | String | `"21:00"` | Rencana jam keberangkatan dari origin (ETD). | Kolom **Jam Berangkat** di `/jadwal-transportasi` & info ETD di `/checker`. |
| `jam_tiba` | String | `"03:30"` | Rencana jam kedatangan di tujuan (ETA). | Kolom **Jam Tiba** di `/jadwal-transportasi` & info ETA di `/checker`. |
| `status` | String | `"TERJADWAL"`, `"BERJALAN"` | Status pelaksanaan jadwal. | Badge warna status di tabel `/jadwal-transportasi`. |
| `sumber_generate` | String | `"AUTO_GENERATE_TEMPLATE"` | Catatan asal mula jadwal. | Kolom Keterangan / Sumber di `/jadwal-transportasi`. |

---

### 8. Koleksi `template_jadwal_transportasi` (Template Jadwal Default)
Koleksi ini menyimpan master template jadwal default mingguan per rute trayek.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66ba4...")` | Identifier unik dokumen. | Internal MongoDB. |
| `template_id` | String | `"TMPL-RT-MALAM-B9910"` | ID unik template jadwal. | Referensi tabel di `/schedule-templates`. |
| `route_id` | String | `"RT-MALAM-B9910-PCX"` | ID rute rujukan template. | Dropdown Rute di `/schedule-templates` & fallback lookup jadwal di backend `/checker`. |
| `kendaraan_id` | String | `"VH-B9910PCX"` | ID armada default untuk rute ini. | Kolom Armada Default di `/schedule-templates`. |
| `jam_berangkat` | String | `"21:00"` | Jam berangkat standar harian. | Kolom Jam Berangkat Default di `/schedule-templates`. |
| `jam_tiba` | String | `"03:30"` | Jam tiba standar harian. | Kolom Jam Tiba Default di `/schedule-templates`. |
| `hari_operasional` | Array / String | `["SENIN", "SELASA"]` | Hari-hari berlakunya jadwal mingguan. | Checklist Hari Operasional pada modal `/schedule-templates`. |
| `status` | String | `"AKTIF"` | Status keaktifan template jadwal. | Toggle status di `/schedule-templates`. |

---

### 9. Koleksi `manifest_master` & `manifest_detail` (Manifest Kantong Pos)
Koleksi ini menyimpan data manifest/kantong penggabungan resi kiriman pos.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `master_manifest_code` | String | `"MF-20260724-B9910PCX"` | Kode barcode / nomor unik manifest kantong pos. | Header Manifest pada tab Kantong `/transaksi` & cetak lembar serah terima manifest. |
| `asal_nopen` | String | `"40511"` | Kode Nopend kantor yang menyegel manifest. | Tampilan Kantor Asal Manifest di `/transaksi`. |
| `tujuan_nopen` | String | `"40400"` | Kode Nopend kantor tujuan kantong. | Tampilan Kantor Tujuan Manifest di `/transaksi`. |
| `total_connote` | Number | `10` | Total jumlah paket di dalam kantong. | Kolom Total Paket pada tabel manifest `/transaksi`. |
| `total_weight_kg` | Number | `619.0` | Total berat akumulasi kantong (kg). | Kolom Total Berat (kg) pada tabel manifest `/transaksi`. |
| `status` | String | `"SEALED"`, `"IN_TRANSIT"` | Status fisik kantong pos. | Badge status manifest di `/transaksi`. |
| `created_by` | String | `"SUPER_ADMIN"` | Petugas pembuat manifest kantong. | Kolom Petugas di `/transaksi`. |
| `manifest_detail.connote_code` | String | `"P20260724000001"` | Resi paket individual di dalam kantong. | Item list resi saat baris manifest di-expand pada `/transaksi`. |

---

### 10. Koleksi `tracking_events` (Event Log Tracking Scan Paket)
Koleksi ini menyimpan riwayat event log scan individual (ENTRY, LOADED, ARRIVED, DELIVERED) secara idempotent.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66ba5...")` | Identifier unik dokumen. | Internal MongoDB. |
| `event_id` | String | `"P20260724000001_LOADED_..."` | Key unik penjamin idempotensi (cegah duplikasi saat re-import CSV). | Deduplikasi backend & log audit. |
| `connote_code` | String | `"P20260724000001"` | Resi paket yang discan. | Foreign Key query timeline riwayat tracking di `/checker`. |
| `event_type` | String | `"ENTRY"`, `"LOADED"`, `"DELIVERED"` | Kode jenis kejadian fisik logistik. | **Penyusun Timeline UI**: Menentukan Ikon Status & Judul Langkah pada Timeline Riwayat Tracking `/checker` (ENTRY = 📦 Terima di Loket, LOADED = 🚚 Dimuat ke Armada, ARRIVED = 🏢 Tiba di Node, DELIVERED = ✅ Selesai). |
| `event_datetime` | Date / String | `2026-07-24T10:15:00Z` | Waktu persis scan dilakukan. | Tampilan Jam & Tanggal pada setiap baris Timeline `/checker`. |
| `office_code` / `location_name` | String | `"40511"`, `"KCU Cimahi"` | Lokasi kantor pos saat scan. | Label Lokasi pada baris Timeline `/checker`. |
| `vehicle_code` | String | `"B 9910 PCX"` | Plat nomor armada pengangkut saat scan. | Teks Keterangan "Diangkut oleh B 9910 PCX" pada event LOADED di `/checker`. |
| `stop_sequence` | Number | `1`, `2` | Urutan stop tempat scan terjadi. | Menyorot node stop yang bersesuaian di Stepper `/checker`. |
| `import_batch_id` | String | `"BATCH-20260724-153045-8A2F"` | ID batch impor CSV harian. | Tagging audit data untuk fitur komited/rollback impor CSV di `/checker`. |

---

### 11. Koleksi `users` (Data Akun Pengguna & Role RBAC)
Koleksi ini menyimpan data akun login pengguna aplikasi dan hak aksesnya.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66ba6...")` | Identifier unik dokumen user. | Internal MongoDB. |
| `username` | String | `"admin"`, `"sari"`, `"dispatcher"` | Nama akun unik untuk login. | Input Username di form `/login` & daftar pengguna di `/profil`. |
| `password_hash` | String | `"$2b$10$3pZ51LdGg9g..."` | Password terenkripsi Bcrypt. | Otentikasi keamanan saat tombol Login ditekan di `/login`. |
| `name` | String | `"Sari Rahayu"` | Nama lengkap pengguna. | Tampilan **Nama Pengguna** di Pojok Kanan Atas App Bar & Kartu Profil `/profil`. |
| `role` | String | `"SUPER_ADMIN"`, `"DISPATCHER"` | Peran / Hak Akses Pengguna (RBAC). | **Proteksi Fitur Web**: Membatasi menu sidebar & proteksi route halaman React (Super Admin = full akses, Driver = route journey saja). |
| `NIP` / `branch` | String | `"99283741"`, `"40511 - KCU Cimahi"` | Nomor Induk Pegawai & Cabang Tugas. | Informasi NIP & Cabang pada halaman Profil `/profil`. |

---

### 12. Koleksi `master_produk` (Katalog Layanan Produk Pos)
Koleksi ini menyimpan katalog jenis layanan dan produk pengiriman Pos Indonesia.

| Nama Field / Key | Tipe Data | Contoh Nilai | Deskripsi & Fungsi Field | Keterhubungan Ke Tampilan Web (UI & Fitur) |
|---|---|---|---|---|
| `_id` | ObjectId | `ObjectId("66ba7...")` | Identifier unik dokumen. | Internal MongoDB. |
| `serviceId` | String | `"POS-REGULER"`, `"POS-NEXTDAY"` | Kode unik produk layanan pos. | Dropdown Layanan saat input transaksi di `/transaksi` & tabel katalog `/produk`. |
| `kodeMile` | String | `"FIRST_MILE"`, `"MIDDLE_MILE"` | Segmen jangkauan distribusi pos. | Badge Mile pada katalog layanan `/produk`. |
| `deskripsi` | String | `"Pos Reguler Pengiriman Standar Intercity"` | Penjelasan rinci SLA layanan. | Kolom Deskripsi di tabel `/produk`. |
| `segmenProduk` | String | `"REGULER"`, `"EXPRESS"` | Kategori kelas kecepatan kirim. | Filter Segmen Produk pada `/produk`. |
| `pasar` | String | `"DOMESTIK"` | Lingkup pasar layanan (Domestik/Intl). | Tag Pasar pada `/produk`. |
| `status` | String | `"AKTIF"` | Status keaktifan produk. | Toggle status layanan di `/produk`. |

---

## 🔄 Alur Data: Dari Database ke Tampilan Web

```
MongoDB Remote (192.168.5.219)
        │
        │  (koneksi via DbConnection.js)
        ▼
Express.js Backend (Port 5002)
   ├── TransactionController.js   ← Checker, Dashboard, Transaksi, Gate
   ├── KendaraanController.js     ← Fleet, Checker (vehicle query)
   ├── RouteJourneyController.js  ← Route Journey, Checker (cargo stops)
   ├── EstimasiController.js      ← Estimasi Milk Run
   ├── ManifestController.js      ← Transaksi / Manifests
   ├── JadwalController.js        ← Jadwal Transportasi
   ├── AuthController.js          ← Login / Autentikasi
   └── UserController.js          ← Profil / User Management
        │
        │  (REST API /api/... via Vite Proxy atau langsung)
        ▼
React Frontend (Port 5173)
   ├── Checker.jsx      ← /checker
   ├── Dashboard.jsx    ← /
   ├── MasterKendaraan.jsx  ← /fleet
   ├── MasterKantor.jsx     ← /kantor
   ├── MasterRoute.jsx      ← /routes
   ├── RouteJourney.jsx     ← /route-journey
   ├── EstimasiMilkRun.jsx  ← /estimasi-milk-run
   ├── Transaksi.jsx        ← /transaksi
   ├── GateMonitoring.jsx   ← /gate-monitoring
   ├── JadwalTransportasi.jsx ← /jadwal-transportasi
   ├── Profile.jsx          ← /profil
   └── ... (halaman lainnya)
```

---

## 📝 Ringkasan: Koleksi MongoDB & Halaman Yang Menggunakannya

| Koleksi MongoDB | Halaman Yang Menggunakan |
|---|---|
| `transaksi` | Checker, Dashboard, Transaksi, Gate Monitoring, Fleet (detail), Manifest |
| `master_kendaraan` | Checker (fleet list + vehicle query), Fleet, Dashboard, Route Journey, Estimasi |
| `master_kantor` | Checker (lookup nama), Semua halaman yang tampilkan nama kantor/nopend |
| `detail_route` | Checker (route stepper), Route Journey, Fleet (detail rute), Estimasi |
| `master_route_nopen` | Checker (routing logic), Fleet, Jadwal, Estimasi |
| `route_journeys` | Checker (cargo & stops), Route Journey, Dashboard, Estimasi |
| `jadwal_transportasi` | Jadwal Transportasi, Checker (vehicle scheduling) |
| `template_jadwal_transportasi` | Schedule Templates, Checker (fallback jadwal) |
| `manifests` (`manifest_master` & `manifest_detail`) | Transaksi / Manifest |
| `tracking_events` | Checker (timeline event log) |
| `users` | Login, Profil / User Management |
| `master_produk` | Master Produk |

---

> **File Konfigurasi Koneksi Database**:
> - [`connections.json`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/config/connections.json) — daftar koneksi MongoDB (primary remote diutamakan)
> - [`DbConnection.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/config/DbConnection.js) — singleton koneksi MongoDB yang dipakai semua controller
> - [`clean-and-standardize-db.js`](file:///c:/Users/Asus/Documents/POSIND/IPOS5/ipos5/redesign/server/scripts/clean-and-standardize-db.js) — script standardisasi & seed data ke MongoDB Remote
