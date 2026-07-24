# 💼 Business Requirement Document (BRD)
## Cimahi Origin Delivery System (IPOS5 Redesign)

---

## 📑 Informasi Dokumen
* **Nama Proyek:** Cimahi Origin Delivery System (IPOS5 Redesign)
* **Unit Bisnis:** PT Pos Indonesia (Persero) - KCU Cimahi 40500 & SPP Bandung 40000
* **Versi Dokumen:** 2.0.0
* **Status:** Approved
* **Tanggal:** 24 Juli 2026
* **Sponsor Bisnis:** Kepala Kantor Cabang Utama Cimahi & Manajer Logistik SPP Bandung

---

## 1. Latar Belakang Bisnis & Pernyataan Masalah

### 1.1 Latar Belakang Bisnis
PT Pos Indonesia KCU Cimahi menangani ribuan paket kiriman setiap harinya yang berasal dari berbagai Kantor Pos Pembantu (KCP) di wilayah Cimahi dan Kabupaten Bandung Barat (seperti KCP Cililin, KCP Padalarang, dll). Seluruh kiriman ini harus dikonsolidasikan di KCU Cimahi, dibuatkan manifest kontainer, dan dikirimkan ke Sentral Pengolahan Pos (SPP) Bandung sebelum diteruskan ke lokasi tujuan akhir di seluruh Indonesia.

### 1.2 Masalah Bisnis Utama (*Business Pain Points*)
1. **Bottleneck Pemrosesan Bagging Manual:** Pencatatan resi ke dalam manifest secara konvensional sering memicu penumpukan barang (*bottleneck*) di *loading dock* KCU Cimahi pada jam-jam sibuk (*cut-off time*).
2. **Diskrepansi Data Kiriman:** Adanya selisih antara jumlah fisik paket yang dikirim dengan data manifest digital yang diterima oleh SPP Bandung akibat *human error* saat *entry*.
3. **Ketidakpastian Status Tracking (Data Anomaly):** Status kiriman sering meloncat (*status skipping*) atau terlambat diperbarui, sehingga menimbulkan komplain dari pelanggan terkait keakuratan informasi lacak kiriman.
4. **Kurangnya Visibilitas Real-time:** Manajemen kesulitan memantau jumlah armada yang sedang berjalan, kapasitas rute yang terpakai, dan estimasi waktu ketibaan paket secara presisi.

---

## 2. Sasaran & Tujuan Bisnis (*Business Objectives*)

| No | Sasaran Bisnis | Indikator Keberhasilan (Target Metric) |
| :--- | :--- | :--- |
| **BO-01** | Mempercepat Waktu Pemrosesan Outbound | Mengurangi waktu pemrosesan kiriman di gate outbound KCU Cimahi hingga **40%** (dari rata-rata 45 menit menjadi < 25 menit per manifest). |
| **BO-02** | Eliminasi Diskrepansi Data Manifest | Mencapai akurasi pencatatan resi dalam manifest hingga **99.9%** melalui enkapsulasi transaksi data ACID. |
| **BO-03** | Penataan Linear Status Kiriman | Menghilangkan **100%** kejadian *status skipping* atau transisi ilegal pada status kiriman pelanggan. |
| **BO-04** | Visibilitas Dashboard Operasional | Menyediakan informasi metrik logistik real-time yang dapat diakses oleh manajemen 24/7 tanpa perlambatan sistem. |

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
    "Operator Gate & Bagging": [0.35, 0.85]
    "Pengemudi Armada Logistik": [0.25, 0.60]
    "Pelanggan Pos Indonesia": [0.15, 0.75]
```

### Rincian Peran:
* **Kepala KCU Cimahi & Manajer SPP Bandung:** Pemilik proyek dan penentu kebijakan operasional alur pengiriman.
* **Operator Gate & Bagging:** Pengguna harian sistem yang mengoperasikan fitur *Checkpoint 1, 2, dan 3*.
* **Tim IT Enterprise:** Bertanggung jawab atas pengelolaan infrastruktur server Node.js dan kluster database MongoDB.

---

## 4. Pemetaan Proses Bisnis (*Business Process Mapping*)

### 4.1 Proses Bisnis Eksisting (*As-Is Process*)
1. Paket diterima dari counter/KCP dan ditumpuk di area pemilahan KCU Cimahi.
2. Petugas memilah paket secara manual dan menginput satu per satu kode resi ke dalam lembar manifest spreadsheet/legacy.
3. Truk berangkat membawa barang fisik dan dokumen kertas manifest.
4. SPP Bandung menerima truk, membongkar muatan, dan melakukan kalkulasi manual matching antara kertas manifest dengan paket fisik.
5. Pembaruan status tracking terlambat di-update ke sistem pusat.

### 4.2 Proses Bisnis Baru (*To-Be Process*)
1. Paket yang masuk ke KCU Cimahi langsung tercatat dengan status linier `DITERIMA_DI_CIMAHI`.
2. Petugas menggunakan antarmuka **Transit & Gate Monitoring (Checkpoint 1)** untuk memilih paket individual dan meng-generate kode manifest digital terenkripsi (`MNFXXXXXX`). Status otomatis menjadi `IN_MANIFEST`.
3. Saat armada tiba di SPP Bandung, petugas transit membuka modul **Checkpoint 2** dan melakukan scan massal kode manifest. Seluruh paket di dalam manifest berubah status menjadi `TRANSIT_SPP_BANDUNG` secara simultan dalam satu transaksi atomic (ACID).
4. Di SPP Tujuan akhir, modul **Checkpoint 3** memproses kedatangan (`TIBA_DI_SPP_TUJUAN`) dan penyelesaian pengiriman paket individual (`DELIVERED`).
5. Seluruh pergerakan terekam secara otomatis di **Dashboard Analytics** dan **Routing Checker**.

---

## 5. Aturan Bisnis & Batasan Sistem (*Business Rules*)

* **BR-01 (Kekakuan Transisi Status):** Paket tidak dapat meloncat status. Sebuah paket hanya bisa diubah menjadi `IN_MANIFEST` apabila status sebelumnya adalah `DITERIMA_DI_CIMAHI`.
* **BR-02 (Manifest Containment):** Satu kode manifest dapat menampung multiple nomor resi (`connote_code`), namun satu resi yang sedang aktif hanya boleh terikat pada **1 manifest** pada satu waktu.
* **BR-03 (Jaminan Audit Trail):** Setiap perubahan status kiriman wajib menyimpan identitas asal, identitas tujuan, timestamp presisi milidetik, serta ID manifest pendukung ke dalam array riwayat tracking (`tracking_history`).
* **BR-04 (Integritas Transaksi ACID):** Pembentukan manifest dan pemrosesan transit wajib gagal total (*full rollback*) apabila terdapat salah satu resi di dalam manifest yang mengalami kegagalan validasi status atau kegagalan koneksi database.

---

## 6. Metric Keberhasilan & Key Performance Indicators (KPIs)

| Kategori KPI | Indikator Utama | Baseline (Sistem Lama) | Target (Sistem Baru) |
| :--- | :--- | :--- | :--- |
| **Speed** | Avg Manifesting Processing Time | 45 Menit | **< 20 Menit** |
| **Accuracy** | Data Discrepancy Rate | 3.5% | **< 0.05%** |
| **Reliability** | Successful ACID Transactions | N/A (Non-transactional) | **99.99%** |
| **Visibility** | Real-time Dashboard Delay | 1 - 2 Jam | **< 1 Detik (Real-time)** |

---

## 7. Analisis Risiko & Strategi Mitigasi

| Risiko Bisnis | Tingkat Dampak | Strategi Mitigasi |
| :--- | :--- | :--- |
| **Kegagalan Koneksi Network di Gate Monitoring** | Tinggi | Backend menyediakan transaction rollback otomatis, serta frontend menyediakan pesan visual error alert yang jelas kepada operator. |
| **Kerusakan Node Primary Database MongoDB** | Sangat Tinggi | Penggunaan topologi **MongoDB Replica Set** yang mendukung otomatis *failover* ke node Secondary tanpa memutus transaksi aktif. |
| **Resistensi Pengguna (Operator Gudang)** | Sedang | Pembuatan antarmuka UI modern berbasis **Navy Premium Theme** yang sangat ramah pengguna (*user-friendly*), responsif, dan mudah dipahami dengan bantuan visual ikon Lucide. |

---
*© PT Pos Indonesia - BRD Cimahi Origin Delivery System*
