# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 10 — ESTIMASI MILK RUN (TRAVEL TIME & ROUTE PLANNER)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Estimasi Milk Run (/estimasi) |
| **Kategori Menu** | LOGISTICS / PLANNING |
| **Route URL** | /estimasi |
| **File Komponen React** | src/pages/EstimasiMilkRun.jsx |
| **Backend API Endpoints** | GET /api/estimasi-milk-run/:routeId, GET /api/routes |
| **Koleksi MongoDB** | detail_route, master_route_nopen, master_kantor, master_kendaraan, transaksi |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Halaman Estimasi Milk Run berfungsi sebagai kalkulator dan perencana estimasi waktu tempuh perjalanan (ETA/ETD), akumulasi jarak kilometer, serta simulasi visual muatan truk interaktif. Halaman ini menampilkan animasi truk boks Pos Indonesia yang bergerak antar-stasiun singgah dengan ketinggian muatan di dalam boks yang bertambah dinamis seiring paket yang di-pickup di setiap pos perhentian.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Estimasi Milk Run disusun dalam format simulasi visual interaktif:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] HEADER & CONTROLS: Judul ("Estimasi Milk Run") | Rute Filter Pills | [▶ Play] [⏸ Pause] [🔄 Reset]  |
+---------------------------------------------------------------------------------------------------------+
| [B] ANIMATED CARGO TRUCK VISUALIZER (Interactive SVG Truck)                                            |
| - Badge Mengambang: "Beban Aktif: 240 kg | 12 paket di AGEN ARVINET"                                    |
| - Visual Animasi Truk Box Pos Indonesia: Roda Berputar Saat Bergerak, Ketinggian Muatan Naik Sesuai Kg  |
+---------------------------------------------------------------------------------------------------------+
| [C] MULTI-STOP INTERACTIVE STEPPER TRACK                                                                |
| [Stop 1: Origin] =======> [Stop 2: Arvinet]* =======> [Stop 3: Cicalengka] =======> [Stop 4: SPP Hub]   |
| (ETA Kedatangan, ETD Keberangkatan, Tambahan Beban +kg, Akumulasi Total Kg di Truk)                     |
+---------------------------------------------------------------------------------------------------------+
| [D] MANIFEST PACKAGES INSPECTOR TABLE                                                                   |
| - Search Bar & Filter Layanan                                                                           |
| - Tabel Paket di Truk pada Stop Ini: Resi, Layanan, Berat (kg), Asal, Tujuan, Pengirim, Penerima, Aksi   |
+---------------------------------------------------------------------------------------------------------+
| [E] PACKAGE DETAIL MODAL: Info Lengkap Resi, Bukti Tanda Tangan Digital / Proof of Pickup Mock          |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Header & Simulation Controls** | Top Header Control Strip | Menampilkan judul modul, filter pemilih rute (Pick Up 1 Night AGP, Pick Up 2, dll), serta tombol kontrol simulasi (Play, Pause, Step Forward, Reset). | State rute & playback timer | Tombol 'Play' menjalankan simulasi otomatis pergerakan truk dari stop ke stop berikutnya. |
| **Kotak [B]: Animated Cargo Truck Visualizer** | Interactive SVG Cargo Canvas Card | Visualisasi grafis truk boks Pos Indonesia lengkap dengan animasi roda berputar saat melaju dan indikator ketinggian tumpukan muatan boks yang naik sesuai total kg. | Kalkulasi `(weight / maxWeight) * 50px` | Badge mengambang di atas truk menampilkan beban aktif saat ini (kg), jumlah koli paket, dan nama lokasi stop. |
| **Kotak [C]: Multi-Stop Stepper Track** | Interactive Horizontal Waypoint Stepper | Jalur lintasan stasiun singgah yang memuat informasi jam tiba (ETA), jam berangkat (ETD), tambahan muatan (+kg di stop ini), dan total beban kumulatif di atas truk. | Koleksi `detail_route` & data estimasi | Mengklik node stop memindahkan fokus truk dan memperbarui tabel rincian paket di bawahnya. |
| **Kotak [D]: Manifest Packages Inspector Table** | Tabel Rincian Muatan di Lokasi Terpilih | Tabel data paket yang dimuat pada stop aktif: Nomor Resi, Layanan (Q9, PE, PKH, EC3), Berat (kg), Asal Nopend, Tujuan Nopend, Pengirim, Penerima. | Array kargo di stop terpilih | Filter layanan pos, pencarian resi, dan tombol aksi 'Lihat Resi'. |
| **Kotak [E]: Package Detail Modal** | Modal Pop-up Jendela Mengambang | Menampilkan rincian lengkap dokumen resi, informasi kontak pengirim/penerima, serta mock tanda tangan digital serah terima (Proof of Pickup). | State `selectedPackage` | Verifikasi bukti fisik penerimaan barang di loket agen. |

## 3. Aturan Bisnis & Kalkulasi Proyeksi Muatan

- Kalkulasi ETA Berantai: Waktu tiba di Stop N dihitung dari Jam Berangkat Stop (N-1) ditambah estimasi menit tempuh segmen jalan raya.
- Simulasi Beban Bertahap: Total beban truk pada Stop N adalah (Beban Stop N-1) + (Paket Di-load di Stop N) - (Paket Di-unload di Stop N).

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator membuka halaman Estimasi Milk Run (/estimasi).
- 2. Operator memilih rute feeder yang ingin disimulasikan.
- 3. Operator menekan tombol 'Play' untuk melihat visualisasi pergerakan armada dan pertambahan muatan.
- 4. Operator memeriksa kapasitas sisa untuk memastikan armada tidak melebihi daya angkut maksimum.
