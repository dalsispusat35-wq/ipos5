# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## MASTER INDEX DOKUMENTASI SELURUH HALAMAN IPOS5

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Aplikasi Induk** | IPOS5 Routing & Schedule Management System |
| **Organisasi** | PT Pos Indonesia (Persero) |
| **Total Modul / Halaman** | 15 Modul Utama (16 File Dokumentasi Terstruktur) |
| **Arsitektur Sistem** | React 18 Vite + Express.js OOP MVC + MongoDB Multi-Server |
| **Versi Sistem** | Redesign Enterprise v2.5.0 |
| **Karakteristik Dokumentasi** | Dilengkapi Wireframe ASCII Tata Letak UI & Rincian Kotak/Komponen |

---

## 1. Pendahuluan & Gambaran Umum Sistem

Dokumentasi ini menyajikan spesifikasi teknis, operasional, dan arsitektur visual tata letak antarmuka untuk seluruh 15 modul halaman pada sistem IPOS5 (Integrated Post Office System v5) PT Pos Indonesia. Setiap modul didokumentasikan dalam format Markdown (.md) dan Microsoft Word (.docx) secara mandiri, disertai diagram wireframe tata letak layar (layout grid) serta rincian fungsi setiap komponen/kotak visual.

## 2. Struktur Peta Navigasi & Hirarki Modul Halaman

### 📐 Diagram Visual Tata Letak Halaman (Wireframe UI Layout)
```text
+---------------------------------------------------------------------------------------------------------+
|                                  IPOS5 ENTERPRISE SYSTEM ARCHITECTURE                                   |
+---------------------------------------------------------------------------------------------------------+
| [OPERATIONS]           | [MASTER DATA]          | [LOGISTICS & PLANNING] | [ANALYTICS & SYSTEM]         |
| • 01. Dashboard (/)    | • 03. Kantor (/kantor) | • 07. Template (/tmpl) | • 12. Analitik (/analytics)  |
| • 02. Checker (/check) | • 04. Produk (/produk) | • 08. Jadwal (/jadwal) | • 13. Transaksi (/transaksi) |
|                        | • 05. Fleet (/kendaraan| • 09. Milk Run (/jrn)  | • 14. Settings (/settings)   |
|                        | • 06. Route (/route)   | • 10. Estimasi (/est)  | • 15. Profile (/profile)     |
|                        |                        | • 11. Gate (/transit)  |                              |
+---------------------------------------------------------------------------------------------------------+
```

### 📋 Rincian & Keterangan Setiap Kotak / Komponen Tata Letak
| Bagian / Kotak UI | Tipe Visual & Posisi | Fungsi & Kegunaan | Sumber Data & Kalkulasi | Interaktivitas & Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **Modul 01 — Dashboard Operasional** | Halaman Utama (`/`) | Pusat komando metrik volume paket, tonase muatan, status pengiriman, grafik tren, dan live stream connotes. | transaksi, master_kendaraan, route_journeys | Filter periode data (Hari Ini, 7D, 30D, YTD, Custom Range), hover tooltip, live polling 5s. |
| **Modul 02 — Package Tracking & Checker** | Operasional (`/checker`) | Pelacakan resi connote (14-15 digit) atau armada mobil dengan multi-stop waypoint stepper, gauge muatan, dan log audit. | transaksi, master_kendaraan, route_journeys, detail_route, tracking_events | Tab mode switch, date picker WIB, strict future date banner, live GPS tracking modal, CSV import. |
| **Modul 03 — Post Offices (Master Kantor)** | Master Data (`/kantor`) | Direktori seluruh jaringan kantor pos nasional (KCU, KCP, KC, Agenpos, SPP DC) beserta koordinat lat/long. | master_kantor | Filter kategori hierarki, search bar nopend/nama/kota, modal detail profil, modal add/edit, export CSV. |
| **Modul 04 — Products & Services (Produk)** | Master Data (`/produk`) | Katalog layanan pengiriman kurir pos (Pos Ekspres, Reguler, Kilat Khusus, EMS, Logistik, Sameday) dan komitmen SLA. | master_produk | Toggle switch active/inactive, grid card produk, tombol tambah layanan produk baru. |
| **Modul 05 — Fleet Management (Armada)** | Master Data (`/kendaraan`) | Manajemen armada mobil/truk pos, kapasitas maksimum kg/ton, nama driver, nomor kontak, homebase, dan rute penugasan. | master_kendaraan, route_journeys | Form collapsible drawer tambah armada, visual fleet cards, tombol pemicu VehicleDetailModal telemetri. |
| **Modul 06 — Routes Management (Rute)** | Master Data (`/route`) | Pengelolaan master rute trayek logistik, waypoint singgah (detail_route), jarak tempuh KM, estimasi menit, dan prefix tujuan. | master_route_nopen, detail_route | Accordion expandable per rute, form builder rute baru, matriks jangkauan regional prefix 1-9. |
| **Modul 07 — Schedule Templates (Template)** | Logistics (`/template`) | Pola cetak biru jadwal mingguan (hari aktif Sen-Min, jam berangkat acuan, armada acuan, rute acuan). | template_jadwal_transportasi, master_kendaraan | Toggle active template, filter shift operasional, tombol pemicu generate jadwal harian. |
| **Modul 08 — Transport Schedule (Jadwal)** | Logistics (`/jadwal`) | Eksekusi jadwal transportasi riil per tanggal operasional dengan kalender mingguan visual jam 06:00-18:00 WIB. | jadwal_transportasi, master_kendaraan | Navigasi minggu (< Week >), generator jadwal massal dengan progress bar %, visual timetable grid. |
| **Modul 09 — Milk Run Telemetry** | Logistics (`/route-journey`) | Simulasi & eksekusi perjalanan multi-stop armada feeder dengan kalkulasi muatan bertahap, status stop, dan ACID lock. | route_journeys, detail_route, transaksi | Tombol kontrol eksekusi stop berikutnya, reset rute, live capacity meter, manifest stop inspection. |
| **Modul 10 — Estimasi Milk Run** | Logistics (`/estimasi`) | Kalkulator dan perencana estimasi waktu tempuh (ETA), akumulasi KM, dan simulasi muatan truk animasi interaktif. | detail_route, master_route_nopen, master_kantor | Play/pause auto simulation, truk animasi roda berputar, popup rincian bukti tanda tangan pengambilan. |
| **Modul 11 — Gate Monitoring Transit** | Logistics (`/transit-monitoring`) | Pemantauan 3-stage transit pipeline: 1. Manifest Creation -> 2. In-Flight Transit -> 3. Gate SPP Unloading. | transaksi, route_journeys, tracking_events | Batch select checkbox resi, tombol dispatch armada, tombol finalisasi bongkar, polling auto-refresh 3.5s. |
| **Modul 12 — Analitik SLA & Laporan** | Reporting (`/analytics`) | Analisis performa SLA pengiriman regional (skala Y 0%-100%), throughput tonase muatan, breakdown produk, dan ekspor CSV. | transaksi, route_journeys, master_kendaraan | Interactive line chart dengan tooltip hover, date range slider, filter multi-dropdown, tombol cetak & CSV. |
| **Modul 13 — Database Viewer Transaksi** | System Data (`/transaksi`) | Penjelajah data mentah resi kiriman di MongoDB dengan multi-filter lengkap, server-side pagination, dan modal audit. | transaksi, master_kantor | Debounced search, filter status, layanan, nopend tujuan, KPRK, regional, tanggal, modal raw JSON & fleet. |
| **Modul 14 — System Settings & Compass** | System Config (`/settings`) | Manajemen koneksi database MongoDB multi-server (Primary Remote 192.168.5.219 vs Local 127.0.0.1), ping test, dan security. | connections.json, DbConnection.js | Input URI dengan toggle masking mata, tombol test connection, preset cluster switcher, TLS config. |
| **Modul 15 — User Profile & Account** | Account (`/profile`) | Manajemen profil personel, NIP pegawai pos, unit kantor penugasan, ubah password akun, dan log audit sesi login. | users | Form edit profil, form ubah kata sandi, status 2FA, tabel riwayat sesi aktivitas IP/browser. |

## 3. Standar Arsitektur Integrasi Backend & Database

Seluruh modul halaman terhubung dengan Backend Node.js Express.js berarsitektur OOP MVC. Operasi pembacaan dan pembaruan data dialirkan secara aman melalui API endpoints dengan proteksi validasi, pembatasan hak akses role (RBAC), serta transaksi atomik MongoDB (ACID transaction) pada proses bongkar muat kargo.
