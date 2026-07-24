# 📄 Product Requirement Document (PRD)
## Cimahi Origin Delivery System (IPOS5 Redesign)

---

## 📑 Informasi Dokumen
* **Nama Produk:** Cimahi Origin Delivery System (IPOS5 Redesign)
* **Versi Dokumen:** 2.0.0
* **Status:** Final / Approved
* **Tanggal:** 24 Juli 2026
* **Target Audience:** Tim Pengembang (Frontend & Backend), Tim Database Administrator, QA Engineer, dan Operational Manager KCU Cimahi / SPP Bandung.

---

## 1. Visi Produk & Ringkasan Eksekutif

### 1.1 Visi Produk
Membangun platform manajemen logistik asal (*origin delivery system*) yang modern, responsif, dan ultra-andal untuk PT Pos Indonesia (KCU Cimahi). Sistem ini mengotomasikan alur pemrosesan kiriman dari pencatatan awal di kantor asal, pembuatan manifest kontainer, transit di SPP Bandung, hingga serah terima di SPP tujuan akhir.

### 1.2 Tujuan Utama
1. **Otomasi Konsolidasi Manifest:** Menghilangkan pencatatan manual bagging dan mengurangi kesalahan penyusunan manifest.
2. **State Machine Linier:** Mengunci transisi status kiriman agar urut dan tidak membolehkan *status skipping* atau manipulasi ilegal.
3. **Visibilitas Real-time:** Menyediakan dasbor statistik interaktif dan fitur pelacakan *audit trail* rinci.
4. **Jaminan Integritas Data (ACID):** Menggunakan MongoDB Session Transactions untuk transaksi pembentukan dan pemrosesan manifest tanpa risiko *partial writes*.

---

## 2. Persona Pengguna (*User Personas*)

| Persona | Peran | Tugas & Kebutuhan Utama |
| :--- | :--- | :--- |
| **Operator Counter KCU Cimahi** | Inputter Kiriman | Menerima paket dari pengirim, mencatat nomor resi (`connote_code`), dan menetapkan status awal `DITERIMA_DI_CIMAHI`. |
| **Dispatcher / Manifesting Officer** | Pengelola Bagging & Outbound | Memilih paket-paket individual berstatus `DITERIMA_DI_CIMAHI` untuk digabungkan dalam Manifest Kontainer baru (`IN_MANIFEST`). |
| **Operator Transit SPP Bandung** | Tim Hub Logistik Transit | Melakukan proses scan in / transit massal manifest kontainer yang masuk dari Cimahi (`TRANSIT_SPP_BANDUNG`). |
| **Operator Last-Mile SPP Tujuan** | Receiver & Courier Hub | Memproses kedatangan manifest (`TIBA_DI_SPP_TUJUAN`) dan memperbarui status paket individual menjadi `DELIVERED`. |
| **Super Admin & Supervisor Logistik** | Monitoring & Master Data | Memantau KPI statistik di Dashboard, mengelola master kantor/rute/jadwal, serta melakukan inspeksi database melalui Compass GUI internal. |

---

## 3. Spesifikasi Kebutuhan Fungsional (*Functional Requirements*)

### 3.1 Modul 1: Dashboard Monitoring (`FR-DB-001` hingga `FR-DB-004`)
* **FR-DB-001:** System harus menampilkan ringkasan metrik statistik real-time: Total Kantor Pos Terdaftar, Jumlah Produk Aktif, Jumlah Kendaraan Logistik, dan Jumlah Rute Utama.
* **FR-DB-002:** System harus menyajikan breakdown jumlah paket berdasarkan status linier tanpa melakukan *hardcoding* atau transformasi nama key.
* **FR-DB-003:** Grafik breakdown status harus mendukung interaksi *hover* dan *click to filter*, yang akan memfilter daftar rincian status paket secara dinamis.
* **FR-DB-004:** Antarmuka dasbor wajib menggunakan layout responsif dengan penanganan *empty space* yang optimal.

### 3.2 Modul 2: Routing Checker & Audit Trail (`FR-CH-001` hingga `FR-CH-003`)
* **FR-CH-001:** System harus menyediakan kolom pencarian nomor resi (`connote_code`) dengan penanganan *error state* jika resi tidak ditemukan.
* **FR-CH-002:** System harus menampilkan visualisasi alur rute dari Kantor Pos Asal (contoh: KCP Cililin) menuju SPP Bandung hingga Kantor Tujuan Akhir.
* **FR-CH-003:** System harus menyajikan **Tabel Audit Trail (Riwayat Perjalanan)** yang merekam jejak perjalanan kronologis paket berdasarkan array `tracking_history`.

### 3.3 Modul 3: Manajemen Master Data (`FR-MD-001` hingga `FR-MD-005`)
* **FR-MD-001 (Master Kantor):** Mampu melakukan CRUD data kantor pos (`nopend`, `nama_nopend`, `kdregional`, `status`). Mendukung pencarian data legacy (>13.000 kantor pos) dengan pagination dan filter status `AKTIF`/`NONAKTIF`.
* **FR-MD-002 (Master Layanan/Produk):** Mampu mengelola produk Pos Indonesia (Pos Sameday, Nextday, Kilat Khusus, dll).
* **FR-MD-003 (Master Kendaraan):** Mampu mencatat data nopol, jenis kendaraan, dan kapasitas armada logistik.
* **FR-MD-004 (Master Rute):** Mampu memetakan rute pengiriman asal-tujuan. Menyediakan komponen *autocomplete* Nopend kantor pos secara otomatis.
* **FR-MD-005 (Template & Penjadwalan):** Mampu mengatur template rutin mingguan dan men-generate jadwal perjalanan armada bulanan secara otomatis.

### 3.4 Modul 4: Transit & Gate Monitoring System (`FR-GM-001` hingga `FR-GM-004`)
* **FR-GM-001 (Checkpoint 1 - Bagging & Manifesting):** Filter paket individual berstatus `DITERIMA_DI_CIMAHI`. Operator dapat memilih paket-paket tersebut dan membentuk kode manifest kontainer baru (`MNFXXXXXX`). Status paket otomatis berubah menjadi `IN_MANIFEST`.
* **FR-GM-002 (Checkpoint 2 - Inbound Transit SPP Bandung):** Operator memasukkan/scan kode manifest. System memproses seluruh resi di dalam manifest tersebut menjadi status `TRANSIT_SPP_BANDUNG`.
* **FR-GM-003 (Checkpoint 3 - Arrival & Last-Mile Delivery):** Operator memproses kedatangan manifest di SPP tujuan (`TIBA_DI_SPP_TUJUAN`) dan dapat menyelesaikan status pengiriman paket individual menjadi `DELIVERED`.
* **FR-GM-004 (ACID Transaction Rule):** Seluruh operasi perubahan status manifest dan pembentukan manifest wajib dibungkus dalam MongoDB Session Transaction untuk menjamin atomisitas data.

### 3.5 Modul 5: Database Browser & System Settings (`FR-SYS-001` hingga `FR-SYS-002`)
* **FR-SYS-001 (Internal Compass):** Menyediakan antarmuka GUI internal untuk melihat koleksi MongoDB, struktur dokumen, dan indeks tanpa aplikasi pihak ketiga.
* **FR-SYS-002 (Settings Connection):** Memungkinkan pengubahan profil koneksi URI MongoDB secara dinamis tanpa perlu me-restart server Express.

---

## 4. Kebutuhan Non-Fungsional (*Non-Functional Requirements*)

### 4.1 Performa & Responsivitas (`NFR-PERF`)
* **Waktu Respon API:** API response time < 200ms untuk query standar dan < 500ms untuk transaksi multi-document manifest.
* **Waktu Muat SPA:** Initial Page Load Frontend < 1.5 detik menggunakan Vite bundle optimization.

### 4.2 Integritas Data & Keamanan (`NFR-SEC`)
* **Atomisitas Transaksi (ACID):** Transaksi bagging dan transit tidak boleh meninggalkan state *half-updated*. Jika 1 resi gagal di-update, seluruh transaksi di-rollback.
* **Validasi Input Backend:** Validasi ketat format Nopend, Connote Code, dan Master Manifest Code di layer controller Express.

### 4.3 Desain Antarmuka & UX (`NFR-UX`)
* **Navy Premium Design Token:** Menggunakan konsistensi warna Dark Navy (`#0b132b`, `#1c2541`), glowing cyan accent (`#48cae4`), dan komponen visual glassmorphism.
* **Micro-Animations:** Transisi smooth pada hover kartu, tab switching, dan pembaruan grafik breakdown.

---

## 5. State Machine Linier Transisi Status Paket

Aplikasi memberlakukan aturan transisi status paket yang kaku di Backend (`TransactionController.js`):

```mermaid
stateDiagram-v2
    [*] --> DITERIMA_DI_CIMAHI: Entry Packet di KCU Cimahi
    DITERIMA_DI_CIMAHI --> IN_MANIFEST: Process Bagging (Checkpoint 1)
    IN_MANIFEST --> TRANSIT_SPP_BANDUNG: Inbound Transit SPP (Checkpoint 2)
    TRANSIT_SPP_BANDUNG --> TIBA_DI_SPP_TUJUAN: Arrival at Destination SPP (Checkpoint 3)
    TIBA_DI_SPP_TUJUAN --> DELIVERED: Final Handover to Recipient
    DELIVERED --> [*]
```

---

## 6. Kriteria Penerimaan (*Acceptance Criteria*)

1. **AC-01 (Manifest Creation):** Ketika operator membuat manifest dengan 5 resi berstatus `DITERIMA_DI_CIMAHI`, maka dibuat 1 dokumen manifest di koleksi `manifests`, dan 5 dokumen di koleksi `transaksi` secara teratomik berubah statusnya menjadi `IN_MANIFEST` serta mencatat riwayat di `tracking_history`.
2. **AC-02 (Invalid Transition Prevention):** Jika resi masih berstatus `DITERIMA_DI_CIMAHI` dan dilakukan permohonan transit langsung ke `TRANSIT_SPP_BANDUNG` tanpa melalui `IN_MANIFEST`, backend wajib menolak request dengan status HTTP 400 Bad Request.
3. **AC-03 (Audit Trail Accuracy):** Setiap perubahan status harus menambahkan entri baru pada array `tracking_history` berisi timestamp `changedAt`, status asal, status tujuan, dan `manifest_id` (jika ada).

---
*© PT Pos Indonesia - PRD Cimahi Origin Delivery System*
