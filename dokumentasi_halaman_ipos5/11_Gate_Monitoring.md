# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 11 — GATE MONITORING & TRANSIT PIPELINE

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Gate Monitoring Transit (/transit-monitoring) |
| **Kategori Menu** | LOGISTICS / GATE OPERATIONS |
| **Route URL** | /transit-monitoring |
| **File Komponen React** | src/pages/GateMonitoring.jsx |
| **Backend API Endpoints** | GET /api/gate/pipeline, POST /api/gate/create-manifest, POST /api/gate/dispatch, POST /api/gate/receive-unload |
| **Koleksi MongoDB** | transaksi, route_journeys, tracking_events, master_kantor |
| **Hak Akses Role** | Operator Gate, Dispatcher, & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Gate Monitoring mengawasi alur pipa perpindahan fisik kiriman paket (3-Stage Logistics Pipeline) dari loket penerimaan asal (KCU Cimahi) hingga gerbang pembongkaran di pusat pemrosesan pos (SPP Bandung 40000). Modul ini menangani pembuatan nomor manifest kantong pos, pemberangkatan armada angkutan feeder, serta pemindaian bongkar muatan di gerbang transit dengan penyegaran data real-time setiap 3.5 detik.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Gate Monitoring dirancang dalam bentuk 3-Kolom Kanban Transit Pipeline:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] SESSION BANNER & CONTROL BAR                                                                        |
| - Session: Dispatch ID [TRP-20260824-008] | Armada [B 9910 PCX] | Driver [Ahmad] | Rute [Cimahi -> SPP]  |
| - Manifest Aktif: [MNF000001 - Draft] | Jam Berangkat: [08:30 WIB]                                      |
| - Controls: Toggle Auto-Refresh (3.5s) | Last Sync Time | [🔄 Refresh Manual]                            |
+---------------------------------------------------------------------------------------------------------+
| [B] 3-STAGE TRANSIT PIPELINE KANBAN COLUMNS                                                             |
| +-----------------------------+ +-----------------------------+ +-----------------------------+         |
| | [B1] 1. MANIFEST CREATION   | | [B2] 2. LOADING & TRANSIT   | | [B3] 3. GATE ARRIVAL &      |         |
| |      (DITERIMA DI CIMAHI)   | |      (IN MANIFEST)          | |      UNLOADING (SPP BANDUNG)|         |
| | - Select All Checkbox [✓]   | | - Manifest Code: MNF000001  | | - Arrived Inbound Packages  |         |
| | - Resi Items:               | | - Loaded Resi Items:        | | - Ready for Inbound Scan:   |         |
| |   • P260820010001 (Q9 2.5kg)| |   • P260820010002 (PE 1.2kg)| |   • P260820010005 (PKH 4kg) |         |
| |   • P260820010003 (PKH 5kg) | |   • P260820010004 (EC3 0.8k)| |   • P260820010006 (Q9 1.5kg)|         |
| | --------------------------- | | --------------------------- | | --------------------------- |         |
| | Tombol Aksi:                | | Tombol Aksi:                | | Tombol Aksi:                |         |
| | [📝 Buat Manifest (X Resi)] | | [🚚 Kirim & Berangkatkan]   | | [✅ Terima & Selesai Bongkar]|        |
| +-----------------------------+ +-----------------------------+ +-----------------------------+         |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Session Banner & Controls** | Top Header Card | Menampilkan identitas sesi pengiriman aktif (Dispatch ID, nomor armada, driver, rute, jam keberangkatan, status manifest) serta kontrol auto-refresh polling 3.5 detik. | Object `sessionInfo` dari database | Toggle saklar auto-refresh, indikator waktu sinkronisasi terakhir, dan tombol refresh manual. |
| **Kotak [B1]: Stage 1 — Manifest Creation** | Kolom Kanban Kiri | Menampilkan daftar paket yang baru diterima di loket Cimahi (`DITERIMA_DI_CIMAHI`) dan siap dimasukkan ke dalam manifest kantong pos. | Array `s1Items` | Checkbox pemilih resi massal (Select All), tombol '📝 Buat Manifest (X Resi Dipilih)' memindahkan paket terpilih ke Stage 2. |
| **Kotak [B2]: Stage 2 — Loading & Transit** | Kolom Kanban Tengah | Menampilkan paket yang telah disegel ke dalam nomor manifest (`IN_MANIFEST`) dan sedang dimuat di atas armada dalam perjalanan feeder. | Array `s2Items` | Kode manifest aktif (e.g. MNF000001), tombol '🚚 Kirim & Berangkatkan Armada' mengupdate status dan memindahkan paket ke Stage 3. |
| **Kotak [B3]: Stage 3 — Gate Arrival & Unload** | Kolom Kanban Kanan | Menampilkan paket yang telah tiba di gerbang terminal SPP Bandung (`TRANSIT_SPP_BANDUNG` / `TIBA_DI_SPP_TUJUAN`) untuk dibongkar. | Array `s3Items` | Daftar paket inbound, tombol '✅ Terima & Selesai Bongkar' memfinalisasi status serah terima di SPP. |

## 3. Aturan Bisnis & Integritas Manifest

- Validasi Batch Manifest: Paket yang dimasukkan ke manifest harus memiliki status awal DITERIMA_DI_CIMAHI.
- Pemberangkatan Tunggal: Manifest yang telah diberangkatkan terkunci otomatis dan memicu pencatatan event IN_TRANSIT di `tracking_events`.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Petugas Loket Cimahi memilih paket-paket yang siap diberangkatkan di Kolom 1 dan mengklik 'Buat Manifest'.
- 2. Petugas Dispatcher memeriksa muatan armada di Kolom 2 dan mengklik 'Kirim & Berangkatkan Armada'.
- 3. Petugas Gate SPP Bandung menerima kedatangan armada di Kolom 3 dan mengklik 'Terima & Selesai Bongkar'.
- 4. Sistem secara otomatis memperbarui status seluruh resi di database dan menampilkan notifikasi sukses.
