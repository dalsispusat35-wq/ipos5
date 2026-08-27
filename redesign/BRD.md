# 💼 Business Requirement Document (BRD)
## Cimahi Origin Delivery System (IPOS5 Redesign)

---

## 📑 Informasi Dokumen
* **Nama Proyek:** Cimahi Origin Delivery System (IPOS5 Redesign)
* **Unit Bisnis:** PT Pos Indonesia (Persero) - KCU Cimahi 40500 & SPP Bandung 40000
* **Versi Dokumen:** 3.2.0 (Real-Time Analytics, Popular Categories Deep-Dive, Telemetry Simulator, & Responsive Design Update)
* **Status:** Approved
* **Tanggal Pembaruan:** 27 Agustus 2026
* **Sponsor Bisnis:** Kepala Kantor Cabang Utama Cimahi & Manajer Logistik SPP Bandung

---

## 1. Latar Belakang Bisnis & Pernyataan Masalah

### 1.1 Latar Belakang Bisnis
PT Pos Indonesia KCU Cimahi menangani ribuan paket kiriman setiap harinya yang berasal dari berbagai Kantor Pos Pembantu (KCP) di wilayah Cimahi dan Kabupaten Bandung Barat (seperti KCP Cililin, KCP Padalarang, dll). Seluruh kiriman ini harus dikonsolidasikan di KCU Cimahi, dibuatkan manifest kontainer, dan dikirimkan ke Sentral Pengolahan Pos (SPP) Bandung sebelum diteruskan ke lokasi tujuan akhir di seluruh Indonesia.

### 1.2 Masalah Bisnis Utama (*Business Pain Points*)
1. **Bottleneck Pemrosesan Bagging Manual:** Pencatatan resi ke dalam manifest secara konvensional sering memicu penumpukan barang (*bottleneck*) di *loading dock* KCU Cimahi pada jam-jam sibuk (*cut-off time*).
2. **Diskrepansi Data Kiriman:** Adanya selisih antara jumlah fisik paket yang dikirim dengan data manifest digital yang diterima oleh SPP Bandung akibat *human error* saat *entry*.
3. **Ketidakpastian Status Tracking (Data Anomaly):** Status kiriman sering meloncat (*status skipping*) atau terlambat diperbarui, sehingga menimbulkan komplain dari pelanggan terkait keakuratan informasi lacak kiriman.
4. **Kurangnya Visibilitas Real-time & Analitik Produk:** Manajemen kesulitan memantau metrik performa produk (Nextday, Reguler, Sameday, Jumbo Cargo), utilisasi armada, dan distribusi pendapatan secara mendalam tanpa harus membuka banyak tabel terpisah.
5. **Keterbatasan Operasional Mobile:** Pengawas lapangan di area *docking* kesulitan mengakses dan mengecek data analitik melalui gawai seluler/tablet karena antarmuka sistem legacy yang kaku.

---

## 2. Sasaran & Tujuan Bisnis (*Business Objectives*)

| No | Sasaran Bisnis | Indikator Keberhasilan (Target Metric) |
| :--- | :--- | :--- |
| **BO-01** | Mempercepat Waktu Pemrosesan Outbound | Mengurangi waktu pemrosesan kiriman di gate outbound KCU Cimahi hingga **> 55%** (dari rata-rata 45 menit menjadi **< 20 menit** per manifest). |
| **BO-02** | Eliminasi Diskrepansi Data Manifest | Mencapai akurasi pencatatan resi dalam manifest hingga **99.9%** melalui enkapsulasi transaksi data ACID. |
| **BO-03** | Penataan Linear Status Kiriman | Menghilangkan **100%** kejadian *status skipping* atau transisi ilegal pada status kiriman pelanggan. |
| **BO-04** | Visibilitas Dashboard Operasional 24/7 | Menyediakan informasi metrik logistik terorganisir yang dapat diakses oleh manajemen 24/7 dengan auto-refresh polling 5 detik. |
| **BO-05** | Analitik Granular Pangsa Pasar Layanan | Menyediakan modul *deep-dive breakdown* kategori produk terpopuler dengan fitur multi-kriteria sorting dan cross-filtering dashboard instan. |
| **BO-06** | Simulasi & Stress-Testing Beban Operasional | Kemampuan menguji kesiapan sistem menghadapi lonjakan kiriman (*peak season*) via injektor telemetri dan scanner barcode. |
| **BO-07** | Aksesibilitas Multi-Device & Mobile Fieldwork | Memastikan **100%** fitur operasional dan visualisasi data dapat digunakan dengan lancar di smartphone dan tablet operator. |

---

## 3. Matriks Stakeholder & Peran Bisnis

```mermaid
quadrantChart
    title Matriks Keterlibatan Stakeholder
    x-axis Low Influence --> High Influence
    y-axis Low Interest --> High Interest
    quadrant-1 Keep Satisfied / Core Decision Makers
    quadrant-2 Key Players / Executive Sponsors
    quadrant-3 Monitor / Low Priority
    quadrant-4 Keep Informed / Operational Users
    "Tim IT Enterprise": [0.85, 0.40]
    "Manajer Logistik SPP Bandung": [0.90, 0.90]
    "Kepala KCU Cimahi": [0.85, 0.95]
    "Supervisor Operasional": [0.70, 0.90]
    "Operator Gate & Bagging": [0.35, 0.85]
    "Pengemudi Armada Logistik": [0.25, 0.60]
    "Pelanggan Pos Indonesia": [0.15, 0.75]
```

### Rincian Peran:
* **Kepala KCU Cimahi & Manajer SPP Bandung:** Pemilik proyek dan penentu kebijakan operasional alur pengiriman.
* **Supervisor Operasional:** Memantau metrik performa produk layanan, SLA lead-time regional, dan mengawasi partisi beban muatan truk.
* **Operator Gate & Bagging:** Pengguna harian sistem yang mengoperasikan fitur *Checkpoint 1, 2, dan 3* serta pemindai barcode.
* **Tim IT Enterprise / Super Admin:** Bertanggung jawab atas infrastruktur server Express, otorisasi RBAC, dan kluster database MongoDB.

---

## 4. Pemetaan Proses Bisnis (*Business Process Mapping*)

### 4.1 Proses Bisnis Eksisting (*As-Is Process*)
1. Paket diterima dari counter/KCP dan ditumpuk di area pemilahan KCU Cimahi.
2. Petugas memilah paket secara manual dan menginput satu per satu kode resi ke dalam lembar manifest spreadsheet/legacy.
3. Truk berangkat membawa barang fisik dan dokumen kertas manifest.
4. SPP Bandung menerima truk, membongkar muatan, dan melakukan kalkulasi manual matching antara kertas manifest dengan paket fisik.
5. Pembaruan status tracking terlambat di-update ke sistem pusat.

### 4.2 Proses Bisnis Baru (*To-Be Process*)
1. Paket yang masuk ke KCU Cimahi langsung tercatat dengan status linier `DITERIMA_DI_CIMAHI` dan dapat dipantau melalui modul **Data Transaksi Kiriman** atau diinjeksi via **Telemetry Simulator**.
2. Petugas menggunakan antarmuka **Transit & Gate Monitoring (Checkpoint 1)** untuk memilih paket individual dan meng-generate kode manifest digital terenkripsi (`MNFXXXXXX`). Status otomatis menjadi `IN_MANIFEST`.
3. Perjalanan penjemputan dan armada pengangkut dikelola melalui **Jadwal Pick Up SPP** dan dipantau via **Milk Run Telemetry & Load Partitioning (1.500 kg limit)** serta **Estimasi Milk Run Simulator**.
4. Saat armada tiba di SPP Bandung, petugas transit membuka modul **Checkpoint 2** dan melakukan scan massal kode manifest. Seluruh paket di dalam manifest berubah status menjadi `TRANSIT_SPP_BANDUNG` secara simultan dalam satu transaksi atomic (ACID).
5. Di SPP Tujuan akhir, modul **Checkpoint 3** memproses kedatangan (`TIBA_DI_SPP_TUJUAN`) dan penyelesaian pengiriman paket individual (`DELIVERED`).
6. Seluruh pergerakan terekam secara otomatis di **Dashboard Analytics Real-Time**, modul **Popular Categories Deep-Dive Modal**, **Routing Checker**, dan Audit Trail profil operator.

---

## 5. Aturan Bisnis & Batasan Sistem (*Business Rules*)

* **BR-01 (Kekakuan Transisi Status):** Paket tidak dapat meloncat status. Sebuah paket hanya bisa diubah menjadi `IN_MANIFEST` apabila status sebelumnya adalah `DITERIMA_DI_CIMAHI`.
* **BR-02 (Manifest Containment):** Satu kode manifest dapat menampung multiple nomor resi (`connote_code`), namun satu resi yang sedang aktif hanya boleh terikat pada **1 manifest** pada satu waktu.
* **BR-03 (Jaminan Audit Trail):** Setiap perubahan status kiriman wajib menyimpan identitas asal, identitas tujuan, timestamp presisi milidetik, serta ID manifest pendukung ke dalam array riwayat tracking (`tracking_history`).
* **BR-04 (Integritas Transaksi ACID):** Pembentukan manifest dan pemrosesan transit wajib gagal total (*full rollback*) apabila terdapat salah satu resi di dalam manifest yang mengalami kegagalan validasi status atau kegagalan koneksi database.
* **BR-05 (Otorisasi Akses Sensitif / RBAC):** Modul sensitif seperti Compass GUI dan Settings Connection String HANYA boleh diakses oleh pengguna bertipe `Super Admin / IT Enterprise`.
* **BR-06 (Batas Muatan Fisik - Load Partitioning):** Muatan armada per trip dibatasi maksimal 1.500 kg (100% Utilisasi - SAFE). Kelebihan muatan di atas ambang batas dialokasikan ke antrean *Overspill* untuk trip berikutnya.

---

## 6. Metric Keberhasilan & Key Performance Indicators (KPIs)

| Kategori KPI | Indikator Utama | Baseline (Sistem Lama) | Target (Sistem Baru) |
| :--- | :--- | :--- | :--- |
| **Speed** | Avg Manifesting Processing Time | 45 Menit | **< 20 Menit** |
| **Accuracy** | Data Discrepancy Rate | 3.5% | **< 0.05%** |
| **Reliability** | Successful ACID Transactions | N/A (Non-transactional) | **99.99%** |
| **Visibility** | Dashboard Auto-Refresh Polling | 1 - 2 Jam | **Auto-refresh 5 Detik** |
| **Usability** | Cross-Device Responsiveness Index | 40% (Desktop only) | **100% (Mobile, Tablet, Desktop)** |

---

## 7. Analisis Risiko & Strategi Mitigasi

| Risiko Bisnis | Tingkat Dampak | Strategi Mitigasi |
| :--- | :--- | :--- |
| **Kegagalan Koneksi Network di Gate Monitoring** | Tinggi | Backend menyediakan transaction rollback otomatis, serta frontend menyediakan pesan visual error alert yang jelas kepada operator. |
| **Kerusakan Node Primary Database MongoDB** | Sangat Tinggi | Penggunaan topologi **MongoDB Replica Set** yang mendukung otomatis *failover* ke node Secondary tanpa memutus transaksi aktif. |
| **Akses Ilegal ke Database/Settings** | Sangat Tinggi | Penerapan Role-Based Access Control (RBAC) ketat dan enkripsi token session untuk modul Compass dan Settings. |
| **Resistensi Pengguna di Lapangan** | Sedang | Pembuatan antarmuka UI modern berbasis **Navy Premium Theme** dengan tata letak responsif penuh (*bottom-sheet modal*, touch-friendly controls). |

---

## 8. Dampak Bisnis & Kesimpulan

### 8.1 Solusi Kelebihan Muatan Fisik (Load Partitioning) & Analitik Real-Time
* **Nilai Tambah Bisnis:** Mencegah pelanggaran *Over Dimension Over Load (ODOL)* pada truk armada serta memberikan visibilitas pendapatan dan pangsa pasar secara langsung melalui dashboard interaktif.

### 8.2 Kesimpulan Bisnis
Aplikasi Web Redesign IPOS5 menjamin operasional logistik PT Pos Indonesia berjalan **aman secara fisik, terukur secara matematis, transparan bagi pelanggan, dan adaptif di segala perangkat kerja**.

---
*© PT Pos Indonesia - BRD Cimahi Origin Delivery System*
