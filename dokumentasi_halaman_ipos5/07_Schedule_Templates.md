# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 7 — SCHEDULE TEMPLATES (TEMPLATE JADWAL TRANSPORTASI)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Template Jadwal Transportasi (/template) |
| **Kategori Menu** | LOGISTICS / PLANNING |
| **Route URL** | /template |
| **File Komponen React** | src/pages/TemplateJadwal.jsx |
| **Backend API Endpoints** | GET /api/template-jadwal, POST /api/template-jadwal, PUT /api/template-jadwal/:id, DELETE /api/template-jadwal/:id |
| **Koleksi MongoDB** | template_jadwal_transportasi, master_kendaraan, master_route_nopen |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Template Jadwal Transportasi menyimpan pola cetak biru (master blueprint) jadwal perjalanan logistik rutin mingguan. Template menentukan hari-hari beroperasi dalam sepekan (Senin s/d Minggu), jam keberangkatan standar (ETD), armada kendaraan acuan, serta rute trayek yang dilayani sebelum di-generate secara massal menjadi Jadwal Harian.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Template Jadwal disusun dalam bentuk kartu pola operasional:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] TOOLBAR: Counter ("4 template aktif · 5 total pola")                 |  [+ Tambah Template Baru]    |
+---------------------------------------------------------------------------------------------------------+
| [B] TEMPLATE CARDS LIST                                                                                 |
| +-----------------------------------------------------------------------------------------------------+ |
| | [B1] Standard Weekday Morning                                                  [Active] [Toggle Switch| |
| | - Deskripsi: Pola perjalanan pagi hari kerja untuk kiriman ke SPP Bandung.                          | |
| | - Hari Beroperasi: [Sen] [Sel] [Rab] [Kam] [Jum]  (Sab, Min: Abu-abu nonaktif)                      | |
| | - Jam Keberangkatan: [06:00 WIB] [10:00 WIB]                                                        | |
| | - Armada Default: D 9021 AB  |  Rute: Cimahi -> Bandung SC (Main)                                   | |
| | - Tombol Aksi: [✏️ Edit]  |  [🗑️ Hapus]                                                             | |
| +-----------------------------------------------------------------------------------------------------+ |
| +-----------------------------------------------------------------------------------------------------+ |
| | [B2] Afternoon Loop (Soreang Area)                                             [Active] [Toggle Switch| |
| | - Hari: [Sen] [Rab] [Jum]  |  Jam: [14:00 WIB]  |  Armada: D 7741 EF  |  Rute: Cimahi -> Soreang Loop| |
| +-----------------------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Toolbar & Counter** | Header Toolbar | Menampilkan jumlah template aktif versus total pola yang tersimpan dan tombol pemicu form template baru. | Kalkulasi `templates.filter(t => t.active).length` | Tombol '+ Tambah Template Baru' membuka modal pembuatan template jadwal. |
| **Kotak [B1]: Standard Weekday Template Card** | Template Card (Hari Kerja Pagi) | Pola rutin Senin-Jumat jam 06:00 & 10:00 WIB menggunakan armada D 9021 AB untuk rute Cimahi -> Bandung SC. | Dokumen template weekday | Pills hari aktif, pill jam keberangkatan, saklar toggle aktif/nonaktif, tombol edit & hapus. |
| **Kotak [B2]: Afternoon Loop Template Card** | Template Card (Siang) | Pola perjalanan sore hari (Senin, Rabu, Jumat) jam 14:00 WIB rute Soreang Loop dengan armada D 7741 EF. | Dokumen template afternoon | Pills hari aktif, tombol edit & hapus. |
| **Kotak [B3]: Weekend Minimal Template Card** | Template Card (Akhir Pekan) | Pola khusus Sabtu & Minggu jam 08:00 WIB untuk pengantaran kiriman akhir pekan. | Dokumen template weekend | Pills hari aktif, tombol edit & hapus. |
| **Kotak [B4]: Express Peak Seasonal Card** | Template Card (Musiman) | Pola frekuensi tinggi 5 trip/hari saat musim puncak (Lebaran, Akhir Tahun) dengan status default nonaktif. | Dokumen template peak | Saklar toggle aktifkan saat peak season tiba. |

## 3. Aturan Bisnis & Mekanisme Pembangkitan Jadwal

- Blueprint Generator: Jadwal Transportasi Harian (/jadwal) dibuat dengan meng-copy konfigurasi template aktif sesuai dengan hari dalam tanggal yang dipilih.
- Pemisahan Template & Jadwal Riil: Perubahan pada jadwal tanggal tertentu di lapangan tidak akan merusak master blueprint template.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator membuka halaman Template Jadwal (/template).
- 2. Operator meninjau hari dan jam keberangkatan rutin pada setiap pola rute.
- 3. Operator dapat menambah pola rute baru atau mengaktifkan template peak season bila volume kiriman meningkat.
- 4. Operator beralih ke Jadwal Transportasi (/jadwal) untuk men-generate jadwal aktual bulanan.
