# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## MASTER INDEX DOKUMENTASI SELURUH HALAMAN IPOS5

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Aplikasi Induk** | IPOS5 Routing & Schedule Management System |
| **Organisasi** | PT Pos Indonesia (Persero) |
| **Total Modul / Halaman** | 15 Modul Utama (16 File Dokumentasi) |
| **Arsitektur** | React Vite + Express.js OOP MVC + MongoDB Multi-Server |
| **Versi Sistem** | Redesign Enterprise v2.5.0 |

---

## 1. Pendahuluan & Struktur Dokumentasi

Dokumentasi ini mencakup penjelasan teknis dan operasional secara detail untuk seluruh 15 modul halaman pada aplikasi IPOS5 PT Pos Indonesia. Setiap halaman didokumentasikan dalam 2 format file independen: format Markdown (.md) dan Microsoft Word (.docx).

Sistem IPOS5 dirancang untuk mengelola pendistribusian kiriman pos, manajemen armada kendaraan feeder/intercity, penjadwalan rantai pasok logistik, telemetri Milk Run multi-stop, dan pemantauan gate transit gerbang gerak secara real-time.

## 2. Daftar Pemetaan Modul Halaman & Route URL

Berikut adalah daftar lengkap 15 modul halaman aplikasi IPOS5 beserta URL route dan file komponen React pendukung:

- 1. Dashboard Operasional (`/`) -> File: `Dashboard.jsx`
- 2. Package Tracking & Checker (`/checker`) -> File: `Checker.jsx`
- 3. Master Kantor Pos (`/kantor`) -> File: `MasterKantor.jsx`
- 4. Master Produk & Layanan (`/produk`) -> File: `MasterProduk.jsx`
- 5. Master Kendaraan Armada (`/kendaraan`) -> File: `MasterKendaraan.jsx`
- 6. Master Route Logistik (`/route`) -> File: `MasterRoute.jsx`
- 7. Template Jadwal Transportasi (`/template`) -> File: `TemplateJadwal.jsx`
- 8. Transport Schedule Harian (`/jadwal`) -> File: `JadwalTransportasi.jsx`
- 9. Milk Run Telemetry & Execution (`/route-journey`) -> File: `RouteJourney.jsx`
- 10. Estimasi Milk Run (`/estimasi`) -> File: `EstimasiMilkRun.jsx`
- 11. Gate Monitoring & Transit Hub (`/transit-monitoring`) -> File: `GateMonitoring.jsx`
- 12. Analitik & Laporan Operasional (`/analytics`) -> File: `AnalyticsReport.jsx`
- 13. Database Viewer Transaksi (`/transaksi`) -> File: `Transaksi.jsx`
- 14. System Settings & Compass Connection (`/settings`) -> File: `SettingsPage.jsx`
- 15. Profile User & Account (`/profile`) -> File: `Profile.jsx`

## 3. Standar Arsitektur Integrasi Backend & Database

Setiap modul terkoneksi dengan Backend Node.js Express.js bertipe OOP Controller (`TransactionController`, `KendaraanController`, `RouteJourneyController`, `KantorController`, dll.) dan menyimpan/mengambil data dari MongoDB koleksi resmi (`transaksi`, `route_journeys`, `master_kendaraan`, `master_kantor`, `detail_route`, `master_route_nopen`, `jadwal_transportasi`).

