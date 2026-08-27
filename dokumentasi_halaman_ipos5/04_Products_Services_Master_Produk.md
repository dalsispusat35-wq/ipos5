# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 4 — PRODUCTS & SERVICES (MASTER PRODUK LAYANAN)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Master Produk & Layanan Pos (/produk) |
| **Kategori Menu** | MASTER DATA / CATALOG |
| **Route URL** | /produk |
| **File Komponen React** | src/pages/MasterProduk.jsx |
| **Backend API Endpoints** | GET /api/produk, POST /api/produk, PUT /api/produk/:id, DELETE /api/produk/:id |
| **Koleksi MongoDB** | master_produk |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Master Produk mengelola katalog layanan pengiriman kurir dan logistik Pos Indonesia (seperti Pos Ekspres, Pos Reguler, Kilat Khusus, Express Mail Service, Pos Logistik, dan Same Day). Modul ini mengatur batasan komitmen SLA (Service Level Agreement), batas berat maksimum per koli, deskripsi layanan, dan status keaktifan.

## 2. Tata Letak Halaman (UI Layout & Wireframe)

Struktur tata letak visual halaman Master Produk disajikan dalam format grid kartu interaktif:

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
| [A] TOOLBAR: Counter Status ("6 produk aktif · 0 nonaktif")          |  [+ Tambah Layanan Produk Baru]  |
+---------------------------------------------------------------------------------------------------------+
| [B] PRODUCT CARDS GRID (Responsive Card Layout)                                                         |
| +-----------------------------+ +-----------------------------+ +-----------------------------+         |
| | [B1] Pos Ekspres (EKS)      | | [B2] Pos Reguler (REG)      | | [B3] Kilat Khusus (KLK)     |         |
| | - Kategori: Express (Cyan)  | | - Kategori: Regular (Navy)  | | - Kategori: Priority (Amber)|         |
| | - SLA: H+0 / H+1            | | - SLA: H+2 – H+7            | | - SLA: H+1 – H+3            |         |
| | - Max Berat: 30 kg          | | - Max Berat: 50 kg          | | - Max Berat: 30 kg          |         |
| | - Status Toggle: [Active]   | | - Status Toggle: [Active]   | | - Status Toggle: [Active]   |         |
| +-----------------------------+ +-----------------------------+ +-----------------------------+         |
| +-----------------------------+ +-----------------------------+ +-----------------------------+         |
| | [B4] Express Mail Svc (EXP) | | [B5] Pos Logistik (LOG)     | | [B6] Same Day (SDH)         |         |
| | - Kategori: Intl. (Green)   | | - Kategori: Logistics (Prpl)| | - Kategori: Express (Cyan)  |         |
| | - SLA: 5–7 days             | | - SLA: H+3 – H+10           | | - SLA: H+0 (Intra Bandung)  |         |
| | - Max Berat: 20 kg          | | - Max Berat: 500 kg         | | - Max Berat: 10 kg          |         |
| | - Status Toggle: [Active]   | | - Status Toggle: [Active]   | | - Status Toggle: [Active]   |         |
| +-----------------------------+ +-----------------------------+ +-----------------------------+         |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Kotak [A]: Toolbar & Counter** | Header Toolbar | Menampilkan jumlah layanan aktif dan non-aktif serta tombol penambahan produk baru. | Kalkulasi `products.filter(p => p.active).length` | Tombol '+ Tambah Layanan Produk' memicu pembukaan form pendaftaran produk baru. |
| **Kotak [B1]: Pos Ekspres (EKS) Card** | Product Card (Express) | Layanan kilat same-day/next-day dengan SLA H+0/H+1 dan batas muatan 30 kg. | Dokumen produk EKS | Saklar toggle aktif/nonaktif mengubah status ketersediaan layanan. |
| **Kotak [B2]: Pos Reguler (REG) Card** | Product Card (Regular) | Layanan standar pengiriman nasional dengan SLA H+2 sampai H+7 dan batas muatan 50 kg. | Dokumen produk REG | Saklar toggle aktif/nonaktif. |
| **Kotak [B3]: Kilat Khusus (KLK) Card** | Product Card (Priority) | Layanan prioritas domestik dengan SLA H+1 sampai H+3 dan batas muatan 30 kg. | Dokumen produk KLK | Saklar toggle aktif/nonaktif. |
| **Kotak [B4]: Express Mail Service (EXP)** | Product Card (International) | Layanan pos internasional ke 232 negara dengan SLA 5–7 hari dan batas muatan 20 kg. | Dokumen produk EXP | Saklar toggle aktif/nonaktif. |
| **Kotak [B5]: Pos Logistik (LOG) Card** | Product Card (Logistics) | Layanan kargo dan barang berat partai besar dengan SLA H+3 sampai H+10 dan kapasitas 500 kg. | Dokumen produk LOG | Saklar toggle aktif/nonaktif. |
| **Kotak [B6]: Same Day Bandung (SDH)** | Product Card (Intra-city) | Layanan kurir khusus koridor Cimahi–Bandung dengan jaminan tiba di hari yang sama (H+0). | Dokumen produk SDH | Saklar toggle aktif/nonaktif. |

## 3. Aturan Bisnis & Validasi Layanan

- Validasi Batas Berat: Transaksi yang melebihi batas berat maksimum produk akan otomatis ditolak atau dialihkan ke Pos Logistik (LOG).
- Integrasi SLA: Komitmen SLA jam/hari digunakan oleh modul Analitik (/analytics) untuk menghitung persentase kepatuhan SLA on-time.

## 4. Alur Penggunaan Operator (User Flow)

- 1. Operator membuka katalog Master Produk & Layanan (/produk).
- 2. Operator meninjau spesifikasi batas berat dan jaminan SLA dari setiap produk pos.
- 3. Operator dapat menonaktifkan sementara produk tertentu saat terjadi kendala rute atau lonjakan kapasitas.
