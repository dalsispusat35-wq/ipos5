# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 8 — TRANSPORT SCHEDULE (JADWAL TRANSPORTASI HARIAN)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Jadwal Transportasi Harian (/jadwal) |
| **Kategori Menu** | LOGISTICS / DISPATCHING |
| **Route URL** | /jadwal |
| **File Komponen React** | src/pages/JadwalTransportasi.jsx |
| **Backend API Endpoints** | GET /api/jadwal, POST /api/jadwal, POST /api/jadwal/generate-bulk, PUT /api/jadwal/:id |
| **Koleksi MongoDB** | jadwal_transportasi, master_kendaraan, master_route_nopen |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Jadwal Transportasi mengelola eksekusi jadwal perjalanan armada logistik aktual pada tanggal tertentu. Modul ini menyajikan kalender mingguan visual (Timetable Gantt) yang memetakan armada yang bertugas (Plat Nomor), jam keberangkatan riil (06:00 s/d 18:00 WIB), rute trayek, serta tombol bulk generator untuk membuat jadwal sebulan penuh.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Jadwal Transportasi disusun dalam bentuk matriks kalender mingguan responsif:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] TOOLBAR: [◀]  17 Agt – 23 Agt 2026  [▶]  |  [Progress Bar %]  |  [+ Tambah Trip] | [▶ Generate Jadwal]|
+---------------------------------------------------------------------------------------------------------+
| [B] WEEKLY TRANSPORT GANTT / CALENDAR TIMETABLE MATRIX (Responsive Timetable)                           |
| +-------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+           |
| | JAM   | SEN (17)  | SEL (18)  | RAB (19)  | KAM (20)* | JUM (21)  | SAB (22)  | MIN (23)  |
| +-------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+           |
| | 06:00 | [B 9910]  | [B 9910]  |           | [B 9910]  | [B 9910]  |           |           |           |
| | 07:00 | (Cimahi)  | (Cimahi)  | [B 9910]  | (Cimahi)  | (Cimahi)  |           |           |           |
| | 08:00 |           |           |           |           |           | [B 9945]  | [B 9910]  |           |
| | 09:00 |           |           |           | [B 9945]  |           |           |           |           |
| | 10:00 | [B 9945]  | [D 8990]  |           |           |           |           |           |           |
| | 11:00 |           | (SPP Jkt) |           |           | [D 8812]  |           |           |           |
| | 13:00 |           |           | [D 8812]  |           | (Soreang) |           |           |           |
| | 14:00 | [D 8812]  |           | (Soreang) | [D 8990]  |           |           |           |           |
| +-------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+           |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A1]: Week Navigation Controller** | Bilah Navigasi Tanggal (Kiri Toolbar) | Mengatur navigasi minggu aktif yang ditampilkan (tombol Prev, rentang tanggal 17-23 Agt 2026, tombol Next). | State `weekOffset` | Beralih minggu secara instan tanpa reload halaman. |
| **Kotak [A2]: Bulk Generator Progress Bar** | Progress Bar Animasi (Tengah Toolbar) | Menampilkan visual persentase proses pembuatan jadwal massal saat tombol generate dijalankan. | State `generating` & `progress` | Animasi progress bar halus 0% s/d 100%. |
| **Kotak [A3]: Action Buttons Toolbar** | Button Action Group (Kanan Toolbar) | Menyediakan tombol '+ Tambah Jadwal Trip' dan tombol utama '▶ Generate Jadwal Bulanan'. | Endpoint POST /api/jadwal/generate-bulk | Memicu generate otomatis jadwal harian dari blueprint template ke koleksi `jadwal_transportasi`. |
| **Kotak [B1]: Timetable Header (7 Days)** | Header Kolom Kalender | Menampilkan 7 nama hari (Sen, Sel, Rab, Kam, Jum, Sab, Min) beserta tanggal bulan aktif, hari ini ditandai warna Cyan khusus. | Array `days` | Penanda tanggal operasional riil. |
| **Kotak [B2]: Operating Hours Axis (06:00-18:00)** | Sumbu Jam Vertikal (Kiri Tabel) | Menampilkan baris slot jam kerja operasional logistik dari jam 06:00 pagi hingga 18:00 sore WIB. | Array `hours` (6 s/d 18) | Tinggi cell 52px terstandarisasi untuk kenyamanan visual. |
| **Kotak [B3]: Trip Schedule Cards Block** | Blok Kartu Trip Berwarna di Grid | Blok visual yang memuat nomor polisi armada (B 9910 PCX, B 9945 PCY, D 8812 AB, D 8990 SPP), rute perjalanan, dan durasi jam. | Array `trips` dari database | Blok berwarna sesuai kode rute (Biru: Cimahi-SPP Bandung, Oranye: Soreang, Navy: Jakarta). |

## 3. Aturan Bisnis & Penugasan Armada

- Pencegahan Konflik Jadwal: Satu unit armada kendaraan tidak dapat ditugaskan pada dua trip yang memiliki overlap rentang jam keberangkatan.
- Integrasi Checker: Jadwal transportasi yang berstatus aktif pada hari ini akan otomatis muncul sebagai referensi jadwal di halaman Checker (/checker).

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator membuka modul Jadwal Transportasi (/jadwal).
- 2. Operator memilih rentang minggu kerja yang ingin ditinjau atau dikelola.
- 3. Operator mengklik 'Generate Jadwal Bulanan' untuk mengotomasi jadwal seluruh armada berdasarkan template.
- 4. Operator dapat menambahkan trip manual tambahan jika ada lonjakan pengiriman tak terjadwal.
